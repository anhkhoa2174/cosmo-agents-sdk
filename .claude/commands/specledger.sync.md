---
description: Sync beads issues from Supabase to local .beads/issues.jsonl to get latest team updates.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

This command synchronizes beads issues from the Supabase database to your local `.beads/issues.jsonl` file. This is essential for team collaboration to ensure you have the latest issue status before starting work.

**When to use**:
- Before starting implementation to check latest status
- After pulling latest code from git
- When you need to check what other team members are working on
- Periodically to stay in sync with team updates

**Pre-configured**:
- Supabase URL: `https://iituikpbiesgofuraclk.supabase.co`
- All Supabase credentials are built-in (no .env file needed)

## Prerequisites

Before running this command, ensure:
1. Repository exists in Supabase database (added via UI)
2. `.beads/` directory exists locally
3. Node.js is installed (for running sync script)
4. You have repository owner and name information

## Execution Flow

### 1. Parse Arguments

The command expects the following parameters:

```
/specledger.sync -RepoOwner "<owner>" -RepoName "<repo>" [-Force]
```

**Required Parameters**:
- `RepoOwner`: GitHub repository owner/organization (e.g., "Ne4nf")
- `RepoName`: Repository name (e.g., "Spec", "taxi-app")

**Optional Parameters**:
- `-Force`: Skip confirmation prompt for uncommitted changes

**Pre-configured (built into command)**:
- `SupabaseUrl`: `https://iituikpbiesgofuraclk.supabase.co`
- `SupabaseKey`: Service role key (hardcoded)
- No .env file needed!

### 2. Parameter Validation

Check if all required parameters are provided in `$ARGUMENTS`:

**If `$ARGUMENTS` is empty or missing parameters**:
- List the missing parameters
- Provide examples:
  ```
  Please provide the parameters:

  - RepoOwner: "your-owner" (e.g., "Ne4nf")
  - RepoName: "your-repo" (e.g., "Spec", "taxi-app")

  Example:
  - RepoOwner: "Ne4nf"
  - RepoName: "Spec"
  ```
- **STOP** and wait for user response

**If all parameters are provided**:
- Parse and extract: RepoOwner, RepoName, Force flag
- Validate format:
  - RepoOwner: Non-empty string
  - RepoName: Non-empty string
- If validation fails, show error and ask user to correct
- Proceed to step 3

### 3. Check Local Status

Before syncing, check current local state:

```powershell
# Check if .beads/issues.jsonl exists
$beadsFile = ".beads\issues.jsonl"
if (Test-Path $beadsFile) {
    $localCount = (Get-Content $beadsFile | Measure-Object -Line).Lines
    Write-Host "Current local issues: $localCount" -ForegroundColor Cyan
    
    # Check for uncommitted changes
    git diff --quiet $beadsFile
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  You have uncommitted changes in issues.jsonl" -ForegroundColor Yellow
        Write-Host "   These will be overwritten by sync!" -ForegroundColor Yellow
        
        if (!$Force) {
            $response = Read-Host "Continue? (y/n)"
            if ($response -ne 'y') {
                Write-Host "Sync cancelled" -ForegroundColor Gray
                exit 0
            }
        }
    }
} else {
    Write-Host ".beads/issues.jsonl not found - will be created" -ForegroundColor Yellow
}
```

**Warnings**:
- Uncommitted changes will be overwritten
- Prompt for confirmation unless `-Force` flag is used

### 4. Execute Sync Script

Run the Node.js sync script with parameters:

```powershell
# Ensure node_modules are installed
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Hardcoded Supabase credentials (built into command)
$supabaseUrl = "https://iituikpbiesgofuraclk.supabase.co"
$supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdHVpa3BiaWVzZ29mdXJhY2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY5NzcxOSwiZXhwIjoyMDgwMjczNzE5fQ.XKzKOrYsxGfgF5ueAlF0KN75vTceYMYkXg8SpG18q6I"

# Run sync script with parameters
Write-Host "`n🔄 Syncing from Supabase..." -ForegroundColor Cyan
node scripts\bd-sync-pull.js --repo-owner "$RepoOwner" --repo-name "$RepoName" --supabase-url "$supabaseUrl" --supabase-key "$supabaseKey"
```

**Script behavior**:
- Fetches all issues from Supabase for the specified repository
- Rebuilds `.beads/issues.jsonl` in JSONL format
- Preserves dependencies and comments
- Beads daemon auto-detects changes and reimports to SQLite

### 5. Handle Script Output

Monitor the script execution:

**Success Indicators**:
- "✓ Found project: <owner>/<repo>"
- "✓ Fetched N issues"
- "✓ Fetched N dependencies"
- "✓ Fetched N comments"
- "✅ Successfully wrote N issues to .beads/issues.jsonl"

**Error Handling**:
- **Missing parameters**: Show which parameters are missing and examples
- **Project not found**: 
  - Error: "Project <owner>/<repo> not found in database"
  - Solution: "Ensure project is added via Supabase UI first"
  - Verify RepoOwner and RepoName are correct
- **Network errors**: 
  - Error: "Failed to connect to Supabase"
  - Solution: "Check internet connection and firewall settings"
- **Authentication errors**:
  - Error: "Invalid API key"
  - Solution: "Contact system administrator (credentials are built-in)"
- **Script not found**:
  - Error: "Cannot find scripts/bd-sync-pull.js"
  - Solution: "Ensure you're in the project root directory"

### 6. Verify Sync Results

After successful sync, show what changed:

```powershell
# Count issues by status
$issues = Get-Content .beads\issues.jsonl | ForEach-Object { $_ | ConvertFrom-Json }

$statusCounts = $issues | Group-Object status | ForEach-Object {
    [PSCustomObject]@{
        Status = $_.Name
        Count = $_.Count
    }
}

Write-Host "`n📊 Issue Status Summary:" -ForegroundColor Cyan
$statusCounts | Format-Table -AutoSize

# Show recently updated issues (last 24 hours)
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
$recentIssues = $issues | Where-Object { 
    $_.updated_at -gt $yesterday 
} | Select-Object -First 10

if ($recentIssues.Count -gt 0) {
    Write-Host "`n📝 Recently Updated Issues:" -ForegroundColor Cyan
    $recentIssues | ForEach-Object {
        Write-Host "  $($_.id): $($_.title) [$($_.status)]" -ForegroundColor Gray
    }
}
```

### 7. Report Completion

Provide a summary and next steps:

```
✅ Sync Complete

Issues Synced: <count>
- Open: <count>
- In Progress: <count>
- Closed: <count>

Recent Updates: <count> issues updated in last 24h

Next Steps:
- Run `bd ready` to see available tasks
- Run `bd list --status in_progress` to see what others are working on
- Run `/specledger.implement` to start implementing tasks

Tip: Run `/specledger.sync` regularly to stay in sync with team updates
```

## Integration with Other Commands

### Auto-sync in /specledger.implement

The `/specledger.implement` command should automatically run sync before starting:

```markdown
1. **Auto-sync before implementation**:
   - Detect RepoOwner and RepoName from git remote
   - Run sync script with detected parameters
   - Prevents working on issues that others have started
   - Ensures you see latest task assignments

2. Proceed with implementation...
```

### Recommended Workflow

```bash
# Pull latest code
git pull origin main

# Sync issues from Supabase (specify your repo)
/specledger.sync -RepoOwner "Ne4nf" -RepoName "Spec"

# Check what's available
bd ready

# Start implementing (auto-syncs with detected repo)
/specledger.implement
```

## Security Notes

- Supabase credentials are hardcoded in the command for convenience
- This is acceptable because the service role key is project-specific
- No sensitive user data or secrets need to be configured
- Repository information is public (owner/name)

## Common Issues

### Issue: "Project not found"
**Solution**: 
- Ensure project is added in Supabase UI
- Verify GITHUB_REPO_OWNER and GITHUB_REPO_NAME match exactly
- Check projects table in Supabase dashboard

### Issue: "Cannot find module @supabase/supabase-js"
**Solution**: 
```bash
npm install @supabase/supabase-js dotenv
```

### Issue: "Uncommitted changes will be lost"
**Solution**: 
- Commit your current changes first: `git add .beads/issues.jsonl && git commit -m "Update issues"`
- Or use `-Force` to override (not recommended if you have local changes)

### Issue: "Network timeout"
**Solution**: 
- Check internet connection
- Verify Supabase URL is accessible
- Check firewall settings

### Issue: "Issues out of sync after sync"
**Solution**: 
- Beads daemon may not have reimported yet (waits 5s)
- Check daemon status: `bd status` or `bd list` to trigger reimport
- Restart beads daemon if needed

## Example Usage

**Basic sync**:
```
/specledger.sync -RepoOwner "Ne4nf" -RepoName "Spec"
```

**Different repository**:
```
/specledger.sync -RepoOwner "Ne4nf" -RepoName "taxi-app"
```

**Force sync without confirmation**:
```
/specledger.sync -RepoOwner "Ne4nf" -RepoName "Spec" -Force
```

**Manual script execution** (alternative):
```powershell
node scripts\bd-sync-pull.js --repo-owner "Ne4nf" --repo-name "Spec" --supabase-url "https://iituikpbiesgofuraclk.supabase.co" --supabase-key "<key>"
```

This command ensures your local issue state stays synchronized with the team's work in Supabase!
