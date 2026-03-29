#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

const COMMENT_HEADER = '<!-- RENOVATE_SUMMARY_COMMENT -->';

/**
 * Main function to summarize renovate PR
 */
async function main() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const prNumber = parseInt(process.env.PR_NUMBER);
    const repository = process.env.REPOSITORY;
    const prTitle = process.env.PR_TITLE;
    const prBody = process.env.PR_BODY || '';

    if (!githubToken || !prNumber || !repository) {
      throw new Error('Missing required environment variables');
    }

    const [owner, repo] = repository.split('/');

    // Dynamically import Octokit from esm.sh
    const { Octokit } = await import('https://esm.sh/@octokit/rest');
    const octokit = new Octokit({ auth: githubToken });

    console.log(`Processing PR #${prNumber} in ${repository}`);

    // Get PR files and changes
    const { data: prFiles } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
    });

    // Extract package changes from PR
    const packageChanges = await extractPackageChanges(octokit, owner, repo, prNumber, prFiles, prBody);

    if (packageChanges.length === 0) {
      console.log('No package changes detected');
      return;
    }

    console.log(`Found ${packageChanges.length} package changes`);

    // Analyze where packages are used in the codebase
    const usageAnalysis = await analyzePackageUsage(packageChanges);

    // Generate AI summary using GitHub Copilot CLI
    const summary = await generateSummaryWithCopilot(prTitle, prBody, packageChanges, usageAnalysis);

    // Find existing comment or create new one
    await createOrUpdateComment(octokit, owner, repo, prNumber, summary);

    console.log('Successfully created/updated PR comment');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

/**
 * Extract package changes from PR by comparing parsed package.json files
 * @param {Object} octokit - Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name  
 * @param {number} prNumber - PR number
 * @param {Array} prFiles - List of files changed in the PR
 * @param {string} prBody - PR description body
 * @returns {Promise<Array>} List of package changes
 */
async function extractPackageChanges(octokit, owner, repo, prNumber, prFiles, prBody) {
  const changes = [];

  // Check if package.json was modified
  const packageJsonFile = prFiles.find(file => file.filename === 'package.json');
  
  if (!packageJsonFile) {
    return changes;
  }

  try {
    // Get PR details to find base and head commits
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });
    
    const baseSha = pr.base.sha;
    const headSha = pr.head.sha;
    
    // Get package.json from base commit (previous version)
    let previousPackageJson;
    try {
      const { data: baseFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'package.json',
        ref: baseSha,
      });
      
      if (baseFile.content) {
        const content = Buffer.from(baseFile.content, 'base64').toString('utf-8');
        previousPackageJson = JSON.parse(content);
      }
    } catch (error) {
      console.warn('Could not fetch previous package.json:', error.message);
      return changes;
    }

    // Get package.json from head commit (current version)
    let currentPackageJson;
    try {
      const { data: headFile } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'package.json',
        ref: headSha,
      });
      
      if (headFile.content) {
        const content = Buffer.from(headFile.content, 'base64').toString('utf-8');
        currentPackageJson = JSON.parse(content);
      }
    } catch (error) {
      console.warn('Could not fetch current package.json:', error.message);
      return changes;
    }

    // Compare dependencies and devDependencies
    const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    
    for (const depType of depTypes) {
      const currentDeps = currentPackageJson[depType] || {};
      const previousDeps = previousPackageJson[depType] || {};
      
      // Find changed packages
      for (const [packageName, currentVersion] of Object.entries(currentDeps)) {
        const previousVersion = previousDeps[packageName];
        
        if (previousVersion && previousVersion !== currentVersion) {
          // Version changed - keep version as-is including ^ or ~ prefix
          changes.push({
            name: packageName,
            oldVersion: previousVersion,
            newVersion: currentVersion,
            depType,
          });
        }
      }
    }

  } catch (error) {
    console.error('Error extracting package changes:', error);
  }

  return changes;
}

/**
 * Analyze where packages are used in the codebase
 * @param {Array} packageChanges - List of package changes
 * @returns {Object} Usage analysis results
 */
async function analyzePackageUsage(packageChanges) {
  const analysis = {};

  for (const pkg of packageChanges) {
    console.log(`Analyzing usage of ${pkg.name}...`);

    try {
      // Only allow safe characters in package names to avoid shell injection
      // Valid npm package names contain: alphanumerics, hyphens, periods, slashes, and @ for scoped packages
      const safeNamePattern = /^[a-zA-Z0-9@/._-]+$/;
      if (!safeNamePattern.test(pkg.name)) {
        const errorMessage = 'Package name contains unsupported characters and will not be analyzed for usage.';
        console.warn(`Skipping usage analysis for package with unsafe name: "${pkg.name}". ${errorMessage}`);
        analysis[pkg.name] = {
          usageCount: 0,
          locations: [],
          error: errorMessage,
        };
        continue;
      }
      
      // Search for imports/requires of this package (including subpaths for scoped packages)
      const searchPatterns = [
        `from '${pkg.name}`,
        `from "${pkg.name}`,
        `require('${pkg.name}`,
        `require("${pkg.name}`,
        `import('${pkg.name}`,
        `import("${pkg.name}`,
      ];

      const locations = new Set();

      for (const pattern of searchPatterns) {
        try {
          // Use shell escaping by passing pattern through proper quoting
          const { stdout } = await execAsync(
            `grep -r --fixed-strings "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.mjs" --exclude-dir=node_modules --exclude-dir=build --exclude-dir=dist .`,
            { cwd: process.cwd(), maxBuffer: 10 * 1024 * 1024 }
          );

          if (stdout) {
            const files = stdout
              .split('\n')
              .filter(line => line.trim())
              .map(line => line.split(':')[0])
              .filter(file => file);

            files.forEach(file => locations.add(file));
          }
        } catch (err) {
          // Exit code 1 means no matches found, which is fine
          // Any other error should be logged
          if (err.code !== 1) {
            console.warn(`Error searching for pattern "${pattern}":`, err.message);
          }
          // Continue with other patterns
        }
      }

      analysis[pkg.name] = {
        usageCount: locations.size,
        locations: Array.from(locations),
      };
    } catch (error) {
      console.error(`Error analyzing ${pkg.name}:`, error.message);
      analysis[pkg.name] = {
        usageCount: 0,
        locations: [],
        error: error.message,
      };
    }
  }

  return analysis;
}

/**
 * Generate AI summary using GitHub Copilot CLI
 * @param {string} prTitle - PR title
 * @param {string} prBody - PR body
 * @param {Array} packageChanges - Package changes
 * @param {Object} usageAnalysis - Usage analysis
 * @returns {string} Generated summary
 */
async function generateSummaryWithCopilot(prTitle, prBody, packageChanges, usageAnalysis) {
  // Truncate PR body if it's too long to prevent issues with Copilot CLI
  const MAX_PR_BODY_LENGTH = 10000;
  const truncatedPrBody = prBody.length > MAX_PR_BODY_LENGTH 
    ? prBody.substring(0, MAX_PR_BODY_LENGTH) + '\n\n[... truncated for length ...]'
    : prBody;

  const prompt = `You are a senior software engineer reviewing a dependency update PR from Renovate.

PR Title: ${prTitle}

PR Description:
${truncatedPrBody}

Package Changes:
${packageChanges.map(pkg => `- ${pkg.name}: ${pkg.oldVersion} → ${pkg.newVersion}`).join('\n')}

Usage Analysis:
${Object.entries(usageAnalysis).map(([name, info]) => {
  return `- ${name}: Used in ${info.usageCount} location(s)${info.locations.length > 0 ? '\n  Files: ' + info.locations.slice(0, 5).join(', ') + (info.locations.length > 5 ? '...' : '') : ''}`;
}).join('\n')}

Please provide a concise summary that includes:
1. **Release Summary**: Brief overview of what changed in this update
2. **Breaking Changes**: Any breaking changes mentioned in the release notes (if any)
3. **Impact Assessment**: How likely this update is to cause issues based on:
   - The version change (major/minor/patch)
   - Where the package is used in the codebase
   - Any mentioned breaking changes
   Rate as: Low Risk, Medium Risk, or High Risk
4. **Recommended Actions**: Areas in the codebase that should be reviewed or tested based on the usage analysis

Format your response in markdown. Be concise but thorough. If there are no release notes available, acknowledge this and provide a best-effort analysis based on version numbers.`;

  try {
    // Generate unique temp file path
    const tempDir = os.tmpdir();
    const uniqueId = randomBytes(8).toString('hex');
    const tempFile = path.join(tempDir, `copilot-prompt-${process.pid}-${uniqueId}.txt`);
    
    await fs.writeFile(tempFile, prompt, 'utf8');

    try {
      // Use GitHub Copilot CLI to generate summary
      // Pass prompt file directly to avoid shell escaping issues
      const { stdout } = await execAsync(
        `gh copilot suggest -t shell < "${tempFile}" | tail -n +3`,
        { 
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
          env: { ...process.env }
        }
      );

      // Clean up temp file
      await fs.unlink(tempFile).catch((err) => {
        console.warn(`Failed to cleanup temp file ${tempFile}:`, err.message);
      });

      if (!stdout || stdout.trim().length === 0) {
        throw new Error('GitHub Copilot CLI returned empty response');
      }

      return stdout.trim();
    } catch (execError) {
      // Clean up temp file on error
      await fs.unlink(tempFile).catch((err) => {
        console.warn(`Failed to cleanup temp file ${tempFile}:`, err.message);
      });
      throw execError;
    }
  } catch (error) {
    console.error('Error calling GitHub Copilot CLI:', error);
    throw new Error(`Failed to generate summary using GitHub Copilot CLI: ${error.message}`);
  }
}

/**
 * Create or update PR comment
 * @param {Octokit} octokit - GitHub API client
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} prNumber - PR number
 * @param {string} summary - Generated summary
 */
async function createOrUpdateComment(octokit, owner, repo, prNumber, summary) {
  // Find existing comment
  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });

  const existingComment = comments.find(comment =>
    comment.body && comment.body.includes(COMMENT_HEADER)
  );

  const commentBody = `${COMMENT_HEADER}
# 🤖 Renovate Update Summary

${summary}

---
*This summary was automatically generated using AI. Last updated: ${new Date().toISOString()}*`;

  if (existingComment) {
    // Update existing comment
    await octokit.issues.updateComment({
      owner,
      repo,
      comment_id: existingComment.id,
      body: commentBody,
    });
    console.log(`Updated existing comment #${existingComment.id}`);
  } else {
    // Create new comment
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: commentBody,
    });
    console.log('Created new comment');
  }
}

// Export for testing
export { extractPackageChanges };

// Only run main if this is the main module (not imported for testing)
const currentFile = fileURLToPath(import.meta.url);
const invokedFile = path.resolve(process.argv[1]);
if (currentFile === invokedFile) {
  main();
}
