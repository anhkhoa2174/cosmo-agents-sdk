---
description: Automatically commit and push changes to a GitHub repository.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

This command automates the Git workflow: staging files, committing changes, and pushing to a remote GitHub repository. It handles both public and private repositories, with automatic authentication setup.

## Prerequisites

Before running this command, ensure:
1. Git is installed and configured locally
2. The repository is cloned or initialized locally
3. For private repositories: GitHub Personal Access Token with `repo` scope
4. Network connectivity to GitHub

## Execution Flow

### 1. Parse Arguments

The command expects the following parameters:

```
/specledger.commit -RepoOwner "<owner>" -RepoName "<repo>" -Branch "<branch>" -Files "<files>" -Message "<message>" [-GitHubToken "<token>"]
```

**Required Parameters**:
- `RepoOwner`: GitHub repository owner/organization (e.g., "Ne4nf")
- `RepoName`: Repository name (e.g., "taxi-app")
- `Branch`: Branch name to checkout and push (e.g., "main", "feature/new-ui")
- `Files`: Files or folders to add (comma-separated, or "." for all changes)
  - Examples: "src/", "src/,tests/", ".", "*.js"
- `Message`: Commit message (e.g., "feat: add user authentication")

**Optional Parameters**:
- `GitHubToken`: GitHub Personal Access Token (required for private repos)
  - Must have `repo` scope
  - Create at: https://github.com/settings/tokens

### 2. Parameter Validation

Check if all required parameters are provided in `$ARGUMENTS`:

a. If `$ARGUMENTS` is empty or missing required parameters:
   - List the missing parameters
   - Provide examples for each parameter:
     ```
     RepoOwner: The GitHub username or organization (e.g., "Ne4nf")
     RepoName: The repository name (e.g., "taxi-app")
     Branch: Branch to push to (e.g., "main", "feature/auth")
     Files: Files/folders to add - comma-separated or "." for all (e.g., "src/", ".")
     Message: Commit message (e.g., "feat: add new feature")
     GitHubToken: (Optional) Token for private repos - create at https://github.com/settings/tokens
     ```
   - Ask user to provide the missing values in this format (each on a new line with bullet points):
     ```
     Please provide the parameters:

     - RepoOwner: "your-owner"
     - RepoName: "your-repo"
     - Branch: "your-branch"
     - Files: "your-files" (use "." for all changes, or "src/,tests/" for specific folders)
     - Message: "your commit message"
     - GitHubToken: "your-token" (optional, only needed for private repos)

     Example (public repo):
     - RepoOwner: "Ne4nf"
     - RepoName: "taxi-app"
     - Branch: "main"
     - Files: "."
     - Message: "feat: add user authentication"

     Example (private repo):
     - RepoOwner: "Ne4nf"
     - RepoName: "private-project"
     - Branch: "develop"
     - Files: "src/,tests/"
     - Message: "fix: resolve authentication bug"
     - GitHubToken: "ghp_xxxxxxxxxxxxxxxxxxxx"
     ```
   - **STOP** and wait for user response

b. If all required parameters are provided:
   - Parse and extract each parameter value
   - Validate format:
     - RepoOwner: Non-empty string
     - RepoName: Non-empty string
     - Branch: Non-empty string, valid branch name format
     - Files: Non-empty string
     - Message: Non-empty string
     - GitHubToken (if provided): Starts with "ghp_" or "github_pat_"
   - If validation fails, show the error and ask user to correct it
   - Proceed to step 3

### 3. Check Repository Status

Before making changes, verify the current state:

```powershell
# Check if we're in a git repository
git rev-parse --git-dir 2>&1

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD

# Check if there are uncommitted changes
git status --porcelain
```

**Handle different scenarios**:
- Not in a git repository: ERROR "Not in a git repository. Please run this command from within the repository directory."
- Wrong repository: WARN "Current repository doesn't match. Proceeding anyway..."
- Uncommitted changes on different branch: WARN "You have uncommitted changes. They will be included in this commit."

### 4. Fetch and Checkout Branch

```powershell
# Fetch latest from remote
git fetch origin

# Check if branch exists remotely
$remoteBranch = git ls-remote --heads origin $Branch

if ($remoteBranch) {
    # Branch exists remotely, checkout and pull
    git checkout $Branch
    git pull origin $Branch
} else {
    # New branch, create it
    git checkout -b $Branch
}
```

**Error Handling**:
- Merge conflicts: STOP and instruct user to resolve conflicts manually
- Branch checkout fails: Display error and suggest solutions
- Network issues: Retry once, then fail with message

### 5. Stage Files

Parse the Files parameter and add them:

```powershell
# Split by comma if multiple paths
$filePaths = $Files -split ','

foreach ($path in $filePaths) {
    $path = $path.Trim()
    
    # Check if path exists
    if (Test-Path $path) {
        git add $path
        Write-Host "✓ Added: $path" -ForegroundColor Green
    } else {
        Write-Host "⚠ Path not found: $path" -ForegroundColor Yellow
    }
}

# Show what will be committed
git status --short
```

**Special Cases**:
- `Files = "."`: Stage all changes in current directory
- `Files = "-A"` or `Files = "--all"`: Stage all changes in repository
- Specific patterns: `Files = "*.js,*.ts"`: Stage matching files

**Validation**:
- If no files were staged: ERROR "No files to commit. Check your file paths."

### 6. Create Commit

```powershell
# Commit with provided message
git commit -m "$Message"

# Show commit details
git log -1 --oneline
git show --stat HEAD
```

**Success Indicators**:
- Commit hash is displayed
- Files changed summary shown
- No errors in output

### 7. Configure Remote Authentication (if token provided)

If GitHubToken is provided, configure remote URL with authentication:

```powershell
# Get current remote URL
$currentRemote = git remote get-url origin

# Parse and rebuild URL with token
if ($GitHubToken) {
    $newRemote = "https://${GitHubToken}@github.com/${RepoOwner}/${RepoName}.git"
    git remote set-url origin $newRemote
    Write-Host "✓ Configured authentication for private repository" -ForegroundColor Green
}
```

**Security Note**: This temporarily adds the token to the remote URL. It will be removed after push.

### 8. Push to Remote

```powershell
# Push to remote branch
if ($remoteBranch) {
    # Branch exists, push to it
    git push origin $Branch
} else {
    # New branch, set upstream
    git push -u origin $Branch
}
```

**Error Handling**:
- **Authentication failed**: 
  - For private repos without token: "Authentication failed. Please provide GitHubToken parameter."
  - For invalid token: "Invalid token. Please check your GitHub token and ensure it has 'repo' scope."
- **Push rejected** (non-fast-forward):
  - "Push rejected. Remote has changes. Run `git pull origin $Branch` to merge, then try again."
- **No permission**:
  - "Permission denied. Ensure you have write access to this repository."

### 9. Cleanup and Report

```powershell
# If token was used, remove it from remote URL for security
if ($GitHubToken) {
    $cleanRemote = "https://github.com/${RepoOwner}/${RepoName}.git"
    git remote set-url origin $cleanRemote
    Write-Host "✓ Removed token from remote URL" -ForegroundColor Green
}

# Get commit info
$commitHash = git rev-parse HEAD
$commitShort = git rev-parse --short HEAD
```

Provide a summary:

```
✅ Commit and Push Complete

Repository: <owner>/<repo>
Branch: <branch>
Commit: <short-hash>
Message: <message>

Files Changed:
<list of staged files>

View on GitHub:
https://github.com/<owner>/<repo>/commit/<full-hash>

Next Steps:
- View commit details: https://github.com/<owner>/<repo>/commit/<hash>
- Create pull request (if not main branch): https://github.com/<owner>/<repo>/compare/<branch>
- Continue with `/specledger.adopt` to track feature progress
```

## Commit Message Guidelines

Follow conventional commit format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples**:
- `feat: add user authentication module`
- `fix: resolve payment processing timeout`
- `docs: update API documentation`
- `refactor: simplify database queries`

## Security Reminders

- **Never commit tokens or secrets to the repository**
- Token is only used temporarily for push, then removed from remote URL
- For private repos, always provide GitHubToken parameter
- Use personal access tokens with minimal required scopes
- Rotate tokens regularly
- Revoke tokens immediately if compromised

## Common Issues

### Issue: "Authentication failed"
**Solution**: 
- For private repos: Provide GitHubToken parameter
- Check token has `repo` scope
- Verify token is not expired

### Issue: "Push rejected (non-fast-forward)"
**Solution**: 
```powershell
git pull origin <branch>
# Resolve any conflicts
git push origin <branch>
```

### Issue: "No files to commit"
**Solution**: 
- Check file paths are correct
- Verify files have actual changes: `git status`
- Ensure you're in the correct directory

### Issue: "Permission denied"
**Solution**: 
- Verify you have write access to the repository
- For organization repos: Check team permissions
- Ensure token has required scopes

## Example Usage

**Public repository (all changes)**:
```
/specledger.commit -RepoOwner "Ne4nf" -RepoName "taxi-app" -Branch "main" -Files "." -Message "feat: add user authentication"
```

**Public repository (specific folders)**:
```
/specledger.commit -RepoOwner "Ne4nf" -RepoName "taxi-app" -Branch "feature/new-ui" -Files "src/,tests/" -Message "refactor: improve UI components"
```

**Private repository**:
```
/specledger.commit -RepoOwner "Ne4nf" -RepoName "private-project" -Branch "develop" -Files "." -Message "fix: resolve authentication bug" -GitHubToken "ghp_xxxxxxxxxxxxxxxxxxxx"
```

This will:
1. Checkout the specified branch
2. Stage the specified files
3. Create a commit with the message
4. Configure authentication (if token provided)
5. Push to remote
6. Clean up and provide next steps
