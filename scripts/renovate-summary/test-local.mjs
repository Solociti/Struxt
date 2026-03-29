#!/usr/bin/env node

/**
 * Local test script for Renovate PR summarizer
 * 
 * Usage:
 *   ./test-local.mjs <pr_number>
 * 
 * Example:
 *   ./test-local.mjs 130
 * 
 * Prerequisites:
 * - GitHub CLI authenticated: gh auth login
 * - GitHub Copilot CLI installed: gh extension install github/gh-copilot
 * - Node.js 24.x or higher
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const prNumber = process.argv[2];
const repository = process.argv[3] || 'Solociti/Struxt';

if (!prNumber) {
  console.error('Usage: ./test-local.mjs <pr_number> [repository]');
  console.error('Example: ./test-local.mjs 130 Solociti/Struxt');
  process.exit(1);
}

// Verify GitHub CLI is authenticated
try {
  const { execSync } = await import('child_process');
  execSync('gh auth status', { stdio: 'pipe' });
  console.log('✓ GitHub CLI is authenticated');
} catch (error) {
  console.error('✗ GitHub CLI is not authenticated. Run: gh auth login');
  process.exit(1);
}

// Verify GitHub Copilot CLI is installed
try {
  const { execSync } = await import('child_process');
  execSync('gh copilot --version', { stdio: 'pipe' });
  console.log('✓ GitHub Copilot CLI is installed');
} catch (error) {
  console.error('✗ GitHub Copilot CLI is not installed. Run: gh extension install github/gh-copilot');
  process.exit(1);
}

// Get GitHub token
let githubToken;
try {
  const { execSync } = await import('child_process');
  githubToken = execSync('gh auth token', { encoding: 'utf-8' }).trim();
  console.log('✓ GitHub token obtained');
} catch (error) {
  console.error('✗ Failed to get GitHub token');
  process.exit(1);
}

// Fetch PR details
let prData;
try {
  const { execSync } = await import('child_process');
  const [owner, repo] = repository.split('/');
  const prJson = execSync(`gh pr view ${prNumber} --repo ${repository} --json title,body`, {
    encoding: 'utf-8'
  });
  prData = JSON.parse(prJson);
  console.log('✓ PR details fetched');
  console.log(`  Title: ${prData.title}`);
} catch (error) {
  console.error(`✗ Failed to fetch PR #${prNumber} from ${repository}`);
  console.error('  Make sure the PR exists and you have access to the repository');
  process.exit(1);
}

// Set environment variables
process.env.GITHUB_TOKEN = githubToken;
process.env.GH_TOKEN = githubToken;
process.env.PR_NUMBER = prNumber;
process.env.REPOSITORY = repository;
process.env.PR_TITLE = prData.title;
process.env.PR_BODY = prData.body || '';

console.log('\n' + '='.repeat(60));
console.log('Starting PR summarizer test...');
console.log('='.repeat(60) + '\n');

console.log('Environment:');
console.log(`  PR Number: ${prNumber}`);
console.log(`  Repository: ${repository}`);
console.log(`  PR Title: ${prData.title}`);
console.log(`  PR Body length: ${prData.body?.length || 0} characters`);
console.log('');

// Import and run the main script
try {
  await import('./summarize-pr.mjs');
  console.log('\n' + '='.repeat(60));
  console.log('✓ Test completed successfully!');
  console.log('='.repeat(60));
  console.log(`\nCheck the PR comment at: https://github.com/${repository}/pull/${prNumber}`);
} catch (error) {
  console.error('\n' + '='.repeat(60));
  console.error('✗ Test failed with error:');
  console.error('='.repeat(60));
  console.error(error);
  process.exit(1);
}
