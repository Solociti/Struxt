#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomBytes } from 'crypto';

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
    const packageChanges = extractPackageChanges(prFiles, prBody);

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
 * Extract package changes from PR files and body
 * @param {Array} prFiles - List of files changed in the PR
 * @param {string} prBody - PR description body
 * @returns {Array} List of package changes
 */
function extractPackageChanges(prFiles, prBody) {
  const changes = [];

  // Check for package.json changes
  const packageJsonFile = prFiles.find(file => file.filename === 'package.json');

  if (packageJsonFile && packageJsonFile.patch) {
    const patch = packageJsonFile.patch;
    const lines = patch.split('\n');

    for (const line of lines) {
      // Look for version changes in dependencies (supports semver including pre-release)
      const match = line.match(/^[\+\-]\s+"(@?[\w\-\/]+)":\s+"[\^~]?([\d\.\-\w]+)"/);
      if (match) {
        const packageName = match[1];
        const version = match[2];
        const isAddition = line.startsWith('+');

        // Check if we already have this package
        const existing = changes.find(c => c.name === packageName);
        if (existing) {
          if (isAddition) {
            existing.newVersion = version;
          } else {
            existing.oldVersion = version;
          }
        } else {
          changes.push({
            name: packageName,
            oldVersion: isAddition ? null : version,
            newVersion: isAddition ? version : null,
          });
        }
      }
    }
  }

  // Also parse from PR body (Renovate usually includes this info)
  const releaseNotesMatch = prBody.match(/### Release Notes[^\#]*/s);
  if (releaseNotesMatch) {
    const releaseNotes = releaseNotesMatch[0];
    for (const change of changes) {
      change.releaseNotes = releaseNotes;
    }
  }

  return changes.filter(c => c.oldVersion && c.newVersion);
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
      // Escape special shell characters in package name
      const escapedPkgName = pkg.name.replace(/['"\\$`]/g, '\\$&');
      
      // Search for imports/requires of this package (including subpaths for scoped packages)
      const searchPatterns = [
        `from '${escapedPkgName}`,
        `from "${escapedPkgName}`,
        `require('${escapedPkgName}`,
        `require("${escapedPkgName}`,
        `import('${escapedPkgName}`,
        `import("${escapedPkgName}`,
      ];

      const locations = new Set();

      for (const pattern of searchPatterns) {
        try {
          // Use shell escaping by passing pattern through proper quoting
          const { stdout } = await execAsync(
            `grep -r --fixed-strings "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.mjs" --exclude-dir=node_modules --exclude-dir=build --exclude-dir=dist . || true`,
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
  const prompt = `You are a senior software engineer reviewing a dependency update PR from Renovate.

PR Title: ${prTitle}

PR Description:
${prBody}

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
      await fs.unlink(tempFile).catch(() => {});

      if (!stdout || stdout.trim().length === 0) {
        throw new Error('GitHub Copilot CLI returned empty response');
      }

      return stdout.trim();
    } catch (execError) {
      // Clean up temp file on error
      await fs.unlink(tempFile).catch(() => {});
      throw execError;
    }
  } catch (error) {
    console.error('Error calling GitHub Copilot CLI:', error);
    
    // Fallback to basic summary if Copilot fails
    return generateFallbackSummary(prTitle, packageChanges, usageAnalysis);
  }
}

/**
 * Generate a basic fallback summary when AI is unavailable
 * @param {string} prTitle - PR title
 * @param {Array} packageChanges - Package changes
 * @param {Object} usageAnalysis - Usage analysis
 * @returns {string} Basic summary
 */
function generateFallbackSummary(prTitle, packageChanges, usageAnalysis) {
  const changesList = packageChanges.map(pkg => {
    const usage = usageAnalysis[pkg.name];
    
    // Parse semver properly, handling pre-release versions
    const parseVersion = (ver) => {
      const match = ver.match(/^(\d+)\.(\d+)\.(\d+)/);
      return match ? { major: match[1], minor: match[2], patch: match[3] } : null;
    };
    
    const oldVer = parseVersion(pkg.oldVersion);
    const newVer = parseVersion(pkg.newVersion);
    
    let riskLevel = 'Low Risk';
    if (oldVer && newVer) {
      if (oldVer.major !== newVer.major) {
        riskLevel = 'High Risk (Major version change)';
      } else if (oldVer.minor !== newVer.minor) {
        riskLevel = 'Medium Risk (Minor version change)';
      }
    } else {
      // If we can't parse versions, be conservative
      riskLevel = 'Medium Risk (Version format changed)';
    }
    
    return `- **${pkg.name}**: ${pkg.oldVersion} → ${pkg.newVersion}
  - Risk: ${riskLevel}
  - Usage: ${usage.usageCount} location(s)`;
  }).join('\n\n');

  return `## Release Summary

${prTitle}

## Package Updates

${changesList}

## Recommended Actions

- Review and test the affected areas listed above
- Check for any breaking changes in the package release notes
- Run the test suite to ensure compatibility

*Note: This is a basic summary. GitHub Copilot CLI was unavailable for detailed analysis.*`;
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

main();
