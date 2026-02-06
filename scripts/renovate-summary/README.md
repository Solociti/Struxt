# Renovate PR Summary GitHub Action

This GitHub Action automatically summarizes Renovate pull requests using AI (OpenAI's ChatGPT) and adds an intelligent comment to the PR with:

- Release summary and key changes
- Breaking changes identification
- Impact assessment (Low/Medium/High Risk)
- Usage analysis showing where packages are used
- Recommended testing areas

## Features

- ✅ Automatically runs when Renovate creates or updates a PR
- ✅ Uses AI to analyze release notes and provide meaningful summaries
- ✅ Analyzes codebase to find where packages are used
- ✅ Assesses risk level based on version changes and usage
- ✅ Updates existing comment instead of creating duplicates
- ✅ Provides actionable recommendations for testing

## Setup

### 1. Add OpenAI API Key to GitHub Secrets

1. Go to your repository's Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `OPENAI_API_KEY`
4. Value: Your OpenAI API key (get one from https://platform.openai.com/api-keys)

### 2. Enable GitHub Actions

The workflow file is located at `.github/workflows/renovate-pr-summary.yml` and will automatically run when:
- A pull request is opened by Renovate
- A Renovate pull request is updated (synchronized)

## How It Works

1. **Trigger**: The action runs when a PR is created or updated by the Renovate bot
2. **Analysis**: 
   - Extracts package changes from `package.json` diff
   - Searches the codebase to find where each package is used
   - Counts usage locations and lists affected files
3. **AI Summary**: 
   - Sends package changes, release notes, and usage data to OpenAI
   - Generates a comprehensive summary with risk assessment
4. **Comment**: 
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

### OpenAI API errors
- Verify your `OPENAI_API_KEY` secret is set correctly
- Check your OpenAI account has available credits
- Review the action logs for specific error messages

### Missing dependencies
- The action runs `npm ci` to install dependencies
- Ensure `@octokit/rest` and `openai` are in `package.json`

## Cost Considerations

This action uses OpenAI's API, which has usage costs:
- Model used: `gpt-4o-mini` (cost-effective for summaries)
- Typical cost per PR: ~$0.01-0.05
- Runs only on Renovate PRs (limited frequency)

Monitor your OpenAI usage at https://platform.openai.com/usage

## License

This feature is part of the Struxt project and follows the same license.
