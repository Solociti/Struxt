# Renovate PR Summary GitHub Action

This GitHub Action automatically summarizes Renovate pull requests using AI (GitHub Copilot CLI) and adds an intelligent comment to the PR with:

- Release summary and key changes
- Breaking changes identification
- Impact assessment (Low/Medium/High Risk)
- Usage analysis showing where packages are used
- Recommended testing areas

## Features

- ✅ Automatically runs when Renovate creates or updates a PR
- ✅ Uses GitHub Copilot CLI to analyze release notes and provide meaningful summaries
- ✅ Analyzes codebase to find where packages are used
- ✅ Assesses risk level based on version changes and usage
- ✅ Updates existing comment instead of creating duplicates
- ✅ Provides actionable recommendations for testing
- ✅ **Zero npm dependencies** - leverages dynamic ESM imports for lightweight deployment

## Setup

### 1. Enable GitHub Copilot

This action uses GitHub Copilot CLI, which requires:
- GitHub Copilot subscription for your organization or user account
- The action will automatically install and configure GitHub Copilot CLI

No additional API keys or secrets are required! The action uses the `GITHUB_TOKEN` that's automatically provided by GitHub Actions.

### 2. Enable GitHub Actions

The workflow file is located at `.github/workflows/renovate-pr-summary.yml` and will automatically run when:
- A pull request is opened by Renovate
- A Renovate pull request is updated (synchronized)

## How It Works

1. **Trigger**: The action runs when a PR is created or updated by the Renovate bot
2. **Setup**:
   - Uses preinstalled GitHub CLI on GitHub runners
   - Installs GitHub Copilot CLI extension
   - Loads @octokit/rest via ESM dynamic import for zero npm dependencies
3. **Analysis**: 
   - Determines package changes by fetching and comparing `package.json` at the base and head commits
   - Searches the codebase to find where each package is used
   - Counts usage locations and lists affected files
4. **AI Summary**: 
   - Sends package changes and full PR context to GitHub Copilot CLI
   - Generates a comprehensive summary with risk assessment
   - Fails the action if Copilot is unavailable (Renovate already provides basic details)
5. **Comment**: 
   - Creates a comment on the PR with the summary
   - Updates the existing comment on subsequent runs (no spam!)

## Example Output

The action will create a comment like this:

```markdown
🤖 Renovate Update Summary

## Release Summary
This update includes minor version bumps for React and related packages...

## Breaking Changes
No breaking changes identified in this update.

## Impact Assessment
**Risk Level: Low Risk**

The changes are primarily bug fixes and minor improvements...

## Recommended Actions
- Review components in `client/src/components/` that use React hooks
- Test form handling in authentication flows
- Verify SSR functionality if applicable

---
*This summary was automatically generated using AI. Last updated: 2024-01-15T10:30:00.000Z*
```

## Permissions

The workflow requires:
- `pull-requests: write` - To create/update comments
- `contents: read` - To read repository files

These are automatically provided by GitHub Actions.

## Customization

You can customize the action by editing:
- `.github/workflows/renovate-pr-summary.yml` - Workflow triggers and configuration
- `scripts/renovate-summary/summarize-pr.mjs` - Analysis logic and AI prompts

## Troubleshooting

### Action doesn't run
- Verify the PR is created by `renovate[bot]`
- Check that GitHub Actions are enabled for your repository

### GitHub Copilot CLI errors
- Verify your organization/account has GitHub Copilot enabled
- Check the action logs for specific error messages
- The action will fail if Copilot is unavailable (Renovate PR already contains basic package information)

### Missing dependencies
- No npm dependencies required - the script uses ESM dynamic imports
- GitHub CLI is preinstalled on GitHub runners
- Copilot CLI extension is installed automatically by the workflow

## Cost Considerations

This action uses GitHub Copilot CLI, which is included in your GitHub Copilot subscription:
- No additional API costs beyond your Copilot subscription
- Runs only on Renovate PRs (limited frequency)

## License

This feature is part of the Struxt project and follows the same license.
