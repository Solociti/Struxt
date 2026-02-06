#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const COMMENT_HEADER = '<!-- RENOVATE_SUMMARY_COMMENT -->';

/**
 * Main function to summarize renovate PR
 */
async function main() {
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const prNumber = parseInt(process.env.PR_NUMBER);
    const repository = process.env.REPOSITORY;
    const prTitle = process.env.PR_TITLE;
    const prBody = process.env.PR_BODY || '';

    if (!githubToken || !openaiApiKey || !prNumber || !repository) {
      throw new Error('Missing required environment variables');
    }

    const [owner, repo] = repository.split('/');

    const octokit = new Octokit({ auth: githubToken });
    const openai = new OpenAI({ apiKey: openaiApiKey });

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

    // Generate AI summary
    const summary = await generateSummary(openai, prTitle, prBody, packageChanges, usageAnalysis);

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
      // Look for version changes in dependencies
      const match = line.match(/^[\+\-]\s+"(@?[\w\-\/]+)":\s+"[\^~]?([\d\.]+)"/);
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
      // Search for imports/requires of this package
      const searchPatterns = [
        `from '${pkg.name}'`,
        `from "${pkg.name}"`,
        `require('${pkg.name}')`,
        `require("${pkg.name}")`,
        `import('${pkg.name}')`,
        `import("${pkg.name}")`,
      ];

      const locations = new Set();

      for (const pattern of searchPatterns) {
        try {
          const { stdout } = await execAsync(
            `grep -r "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.mjs" --exclude-dir=node_modules --exclude-dir=build --exclude-dir=dist . || true`,
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
 * Generate AI summary using OpenAI
 * @param {OpenAI} openai - OpenAI client
 * @param {string} prTitle - PR title
 * @param {string} prBody - PR body
 * @param {Array} packageChanges - Package changes
 * @param {Object} usageAnalysis - Usage analysis
 * @returns {string} Generated summary
 */
async function generateSummary(openai, prTitle, prBody, packageChanges, usageAnalysis) {
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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that analyzes dependency updates and provides actionable summaries for software engineers.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
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

main();
