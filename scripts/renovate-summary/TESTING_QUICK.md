# Quick Testing Reference

## Test Against a Real Renovate PR

```bash
# 1. Find a Renovate PR
gh pr list --author renovate[bot]

# 2. Run the test script
cd scripts/renovate-summary
./test-local.mjs <PR_NUMBER>

# Example:
./test-local.mjs 130
```

## Prerequisites Check

```bash
# Check GitHub CLI authentication
gh auth status

# Check GitHub Copilot CLI
gh copilot --version

# If not installed:
gh extension install github/gh-copilot
```

## What to Verify

After running the test, check the PR on GitHub for a comment with:

✅ Release Summary  
✅ Breaking Changes section  
✅ Impact Assessment with Risk Level  
✅ Usage Analysis (where packages are used)  
✅ Recommended Actions  

## Troubleshooting Quick Fixes

### "GITHUB_TOKEN not found"
```bash
gh auth login
```

### "GitHub Copilot CLI not found"
```bash
gh extension install github/gh-copilot
```

### "Permission denied"
Make sure the script is executable:
```bash
chmod +x test-local.mjs
```

### "PR not found"
Verify the PR exists and you have access:
```bash
gh pr view <PR_NUMBER>
```

## Full Documentation

See [TESTING.md](./TESTING.md) for comprehensive testing instructions.
