# Testing Guide for Renovate PR Summarizer

This guide explains how to test the Renovate PR summarizer action against actual PRs.

## Prerequisites

Before testing, ensure you have:
- GitHub Copilot subscription (for your user or organization)
- GitHub CLI (`gh`) installed and authenticated
- Node.js 24.x or higher
- Access to a repository with Renovate configured

## Method 1: Test Against a Real Renovate PR (Recommended)

This is the most realistic test as it uses an actual Renovate PR.

### Step 1: Create or Find a Renovate PR

1. **Option A: Wait for Renovate to create a PR**
   - If you have Renovate configured, it will automatically create PRs for dependency updates
   - Look for PRs created by `renovate[bot]`

2. **Option B: Trigger Renovate manually**
   - Go to the Renovate dashboard or configuration
   - Trigger a manual run to create dependency update PRs

### Step 2: Test the Action on the PR

Once you have a Renovate PR:

1. **Automatic test**: The GitHub Action will run automatically when:
   - A Renovate PR is opened
   - A Renovate PR is synchronized (updated)

2. **Check the workflow run**:
   ```bash
   # View recent workflow runs
   gh run list --workflow=renovate-pr-summary.yml
   
   # View details of the latest run
   gh run view --log
   ```

3. **Verify the comment**:
   - Go to the Renovate PR on GitHub
   - Look for a comment with the header "🤖 Renovate Update Summary"
   - The comment should contain:
     - Release summary
     - Breaking changes identification
     - Impact assessment (Low/Medium/High Risk)
     - Usage analysis
     - Recommended testing areas

### Step 3: Test Updates

To test that the action updates existing comments (doesn't spam):

1. Push a new commit to the Renovate PR branch (or wait for Renovate to update it)
2. The action should run again
3. Verify the existing comment is updated (timestamp changes) instead of creating a new comment

## Method 2: Manual Local Testing

Test the script locally without waiting for a Renovate PR.

### Prerequisites
- Install GitHub Copilot CLI extension:
  ```bash
  gh extension install github/gh-copilot
  ```

### Step 1: Find a Renovate PR

```bash
# List recent PRs to find a Renovate one
gh pr list --author renovate[bot]

# Get the PR number from the list
```

### Step 2: Set Environment Variables

```bash
# Set required environment variables
export GITHUB_TOKEN="$(gh auth token)"
export GH_TOKEN="$GITHUB_TOKEN"
export PR_NUMBER="123"  # Replace with actual PR number
export REPOSITORY="owner/repo"  # Replace with your repo
export PR_TITLE="Update dependency axios to v1.13.4"  # Get from PR
export PR_BODY="$(gh pr view $PR_NUMBER --json body -q .body)"
```

### Step 3: Run the Script

```bash
# Navigate to the repository root
cd /path/to/Struxt

# Run the script
node scripts/renovate-summary/summarize-pr.mjs
```

### Step 4: Verify Output

The script should:
1. Log "Processing PR #123 in owner/repo"
2. Log "Found X package changes"
3. Show grep output for package usage analysis
4. Generate AI summary via GitHub Copilot CLI
5. Create or update a comment on the PR

Check the PR on GitHub to verify the comment was added/updated.

## Method 3: Test with Mock Data

Create a test script that simulates a Renovate PR without needing an actual PR.

### Create Test Script

```bash
cd /home/runner/work/Struxt/Struxt/scripts/renovate-summary
cat > test-local.mjs << 'EOF'
#!/usr/bin/env node

/**
 * Local test script for Renovate PR summarizer
 * This simulates the environment without needing an actual PR
 */

// Mock environment variables
process.env.GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'your-token-here';
process.env.GH_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
process.env.PR_NUMBER = process.argv[2] || '130';  // Your test PR number
process.env.REPOSITORY = 'Solociti/Struxt';
process.env.PR_TITLE = 'Update dependency axios to v1.13.4';
process.env.PR_BODY = `
This PR contains the following updates:

| Package | Type | Update | Change |
|---|---|---|---|
| axios | dependencies | patch | ^1.12.0 -> ^1.13.4 |

### Release Notes
...
`;

console.log('Testing with PR:', process.env.PR_NUMBER);
console.log('Repository:', process.env.REPOSITORY);

// Import and run the main script
import('./summarize-pr.mjs');
EOF

chmod +x test-local.mjs
```

### Run the Test

```bash
# Make sure you're authenticated with GitHub CLI
gh auth status

# Run the test script with a PR number
./test-local.mjs 130
```

## Method 4: Test via workflow_dispatch

Add manual trigger capability to test the workflow on demand.

### Step 1: Update Workflow File

Add `workflow_dispatch` to `.github/workflows/renovate-pr-summary.yml`:

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:
    inputs:
      pr_number:
        description: 'PR number to summarize'
        required: true
        type: number
```

Then update the job to handle both triggers:

```yaml
jobs:
  summarize-renovate-pr:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    
    steps:
      - name: Get PR details
        id: pr
        uses: actions/github-script@v7
        with:
          script: |
            const prNumber = context.payload.pull_request?.number || ${{ inputs.pr_number }};
            const pr = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: prNumber
            });
            
            core.setOutput('pr_number', prNumber);
            core.setOutput('pr_title', pr.data.title);
            core.setOutput('pr_body', pr.data.body || '');
            core.setOutput('pr_user', pr.data.user.login);
      
      # Only run if Renovate PR or manually dispatched
      - name: Check if should run
        id: should_run
        run: |
          if [[ "${{ github.event_name }}" == "workflow_dispatch" ]] || \
             [[ "${{ steps.pr.outputs.pr_user }}" == "renovate[bot]" ]] || \
             [[ "${{ steps.pr.outputs.pr_user }}" == "renovate" ]]; then
            echo "should_run=true" >> $GITHUB_OUTPUT
          else
            echo "should_run=false" >> $GITHUB_OUTPUT
          fi
      
      # ... rest of the steps with condition: if: steps.should_run.outputs.should_run == 'true'
```

### Step 2: Trigger Manually

```bash
# Trigger the workflow for a specific PR
gh workflow run renovate-pr-summary.yml -f pr_number=130
```

## Verification Checklist

When testing, verify the following:

- [ ] Script detects package changes correctly
- [ ] Package usage analysis finds where packages are used
- [ ] AI summary is generated via GitHub Copilot CLI
- [ ] Comment is created on the PR with proper formatting
- [ ] Comment includes all expected sections:
  - [ ] Release Summary
  - [ ] Breaking Changes
  - [ ] Impact Assessment (Risk Level)
  - [ ] Usage Analysis
  - [ ] Recommended Actions
- [ ] Subsequent runs update the existing comment (check timestamp)
- [ ] The action fails gracefully if Copilot is unavailable
- [ ] The action handles edge cases:
  - [ ] No package.json changes
  - [ ] Multiple package changes
  - [ ] Scoped packages (@types/node)
  - [ ] Packages with periods in names

## Troubleshooting

### Issue: "GITHUB_TOKEN not found"

**Solution**: Ensure you're authenticated with GitHub CLI:
```bash
gh auth login
gh auth status
```

### Issue: "GitHub Copilot CLI not found"

**Solution**: Install the extension:
```bash
gh extension install github/gh-copilot
gh extension list
```

### Issue: "Permission denied" when creating comments

**Solution**: Ensure the token has `pull-requests: write` permission. For local testing, create a Personal Access Token with appropriate permissions.

### Issue: "Package changes not detected"

**Solution**: 
- Verify the PR actually modifies `package.json`
- Check the PR files with: `gh pr view <number> --json files`
- Look at the script output to see what files it detected

### Issue: "Copilot fails to generate summary"

**Solution**:
- Verify you have GitHub Copilot access
- Check Copilot CLI status: `gh copilot explain "test"`
- Look at the workflow logs for specific error messages
- The action will fail by design if Copilot is unavailable

### Issue: "Cannot find package usage in codebase"

**Solution**:
- This is expected if the package isn't imported anywhere yet
- The grep search looks for import/require statements
- Check if the package is actually used in the codebase

## Advanced Testing

### Test with Different Package Scenarios

Create test PRs that modify package.json with:

1. **Single dependency update**: Update one package version
2. **Multiple dependencies**: Update several packages at once
3. **Scoped packages**: Update @types/node or similar
4. **Major version change**: Change from 1.x to 2.x
5. **Pre-release versions**: Update to beta/rc versions
6. **New package additions**: Add a new dependency
7. **Package removals**: Remove a dependency

### Monitor Performance

Time the execution to ensure it completes within reasonable time:

```bash
time node scripts/renovate-summary/summarize-pr.mjs
```

Expected execution time: 10-30 seconds (depending on codebase size and AI response time)

### Test Error Handling

Test how the script handles errors:

1. **Missing environment variable**: Unset `GITHUB_TOKEN` and verify error message
2. **Invalid PR number**: Use a non-existent PR number
3. **Network issues**: Test with network disconnected (should fail gracefully)
4. **Copilot unavailable**: Test when Copilot CLI is not installed

## Contributing

If you find issues during testing:

1. Check the workflow logs in GitHub Actions
2. Run locally with verbose logging
3. Create an issue with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Logs and error messages

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Copilot CLI](https://docs.github.com/en/copilot/github-copilot-in-the-cli)
- [Renovate Documentation](https://docs.renovatebot.com/)
