---
description: Review comments from Supabase and interactively update spec with Claude askUserQuestion tool
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Purpose

This command fetches review comments for checkpoint(s) from Supabase and guides you through addressing them interactively using Claude's askUserQuestion tool. It uses conversation memories from the most recent `/specledger.commit` to automatically locate the checkpoint and project.

**When to use**:
- After `/specledger.commit` when you need to address review comments
- When team members have added comments to your checkpoint
- To address feedback before merging PR
- When you need to iterate on spec based on reviewer feedback

**Pre-configured**:
- Supabase URL: `https://iituikpbiesgofuraclk.supabase.co`
- All credentials are built-in (no .env file needed)

## Prerequisites

1. Previous `/specledger.commit` command must have been run in this conversation (to have commit SHA in memories)
2. Repository exists in Supabase database
3. Checkpoints have been synced via webhook
4. Comments exist for the checkpoint
5. Node.js installed (for querying Supabase)

## Input Options

### Option 1: Single File (Most Common)
```
/specledger.revise "spec.md"
/specledger.revise "plan.md"
/specledger.revise "data-model.md"
```
→ Fetches comments for the specified file from the most recent commit

### Option 2: Multiple Files
```
/specledger.revise "spec.md,plan.md,data-model.md"
```
→ Fetches comments for all specified files

### Option 3: All Files in Folder
```
/specledger.revise "specs/001-document-collaboration-system"
```
→ Fetches comments for ALL .md files in the folder

**Note**: File names only (not full paths). The command uses memories to determine the full spec path.

## Execution Flow

### 1. Parse Arguments

Check `$ARGUMENTS` for input:

**If empty or invalid**:
```
ERROR: Please specify file(s) to review.

Examples:
- Single file: /specledger.revise "spec.md"
- Multiple files: /specledger.revise "spec.md,plan.md"
- All files in folder: /specledger.revise "specs/001-document-collaboration-system"
```

**If provided**:
```powershell
# Parse input
if ($ARGUMENTS -like "specs/*") {
    # Folder path - find all .md files
    $folderPath = $ARGUMENTS
    $files = Get-ChildItem -Path $folderPath -Filter "*.md" -Recurse | Select-Object -ExpandProperty Name
} elseif ($ARGUMENTS -like "*,*") {
    # Multiple files
    $files = $ARGUMENTS -split "," | ForEach-Object { $_.Trim() }
} else {
    # Single file
    $files = @($ARGUMENTS)
}

Write-Host "📝 Files to review: $($files -join ', ')" -ForegroundColor Cyan
```

### 2. Retrieve Commit Info from Memories

Search conversation history for the most recent `/specledger.commit` execution:

```
CRITICAL: Look back through this conversation for the most recent commit information.

Expected format from /specledger.commit:
- Repository: <owner>/<repo>
- Commit SHA: <full-sha>
- Project: <project-name> (if available)
- Spec Path: specs/<feature-name>/
```

**If found**:
```powershell
# Extract from memories
$repoOwner = "<owner-from-memories>"
$repoName = "<repo-from-memories>"
$commitSHA = "<sha-from-memories>"
$specPath = "<specs-path-from-memories>"  # e.g., "specs/001-document-collaboration-system"

Write-Host "✓ Found recent commit in conversation:" -ForegroundColor Green
Write-Host "  Repository: $repoOwner/$repoName" -ForegroundColor Gray
Write-Host "  Commit: $commitSHA" -ForegroundColor Gray
Write-Host "  Spec Path: $specPath" -ForegroundColor Gray
```

**If NOT found**:
```
❌ ERROR: No recent commit found in conversation history.

Please run /specledger.commit first to push your changes, then use /specledger.revise.

Workflow:
1. /specledger.specify "<feature>"
2. /specledger.plan  (generates files)
3. /specledger.commit  (pushes to GitHub)
4. /specledger.revise "spec.md"  (reviews comments)
```

**STOP and exit**

### 3. Confirm with User

Before querying, confirm the checkpoint details with the user:

```powershell
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📍 Checkpoint Information" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Repository: $repoOwner/$repoName" -ForegroundColor White
Write-Host "Commit SHA: $commitSHA" -ForegroundColor White
Write-Host "Spec Path: $specPath" -ForegroundColor White
Write-Host "Files: $($files -join ', ')" -ForegroundColor White
Write-Host ""
Write-Host "GitHub URL: https://github.com/$repoOwner/$repoName/commit/$commitSHA" -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
```

**Ask user for confirmation using standard output (not askUserQuestion yet)**:
```
Do you want to review comments for this checkpoint? (y/n)
```

**If user responds 'n' or 'no'**:
```
Cancelled. Please specify the correct file(s) or run /specledger.commit again.
```
**Exit**

**If user responds 'y' or 'yes'**: Continue to step 4

### 4. Query Supabase for Checkpoints and Comments

For each file, build the full artifact path and query:

```powershell
$allResults = @()

foreach ($file in $files) {
    # Build full artifact path
    $artifactPath = "$specPath/$file"
    
    Write-Host "`n🔍 Querying checkpoint for: $artifactPath" -ForegroundColor Cyan
    
    # Query using commit SHA + file path
    $result = node scripts\query-checkpoint-comments.js query `
        --commitSHA "$commitSHA" `
        --filePath "$artifactPath" | ConvertFrom-Json
    
    if ($result -and $result.comments.Count -gt 0) {
        $allResults += $result
        Write-Host "  ✓ Found $($result.comments.Count) comment(s)" -ForegroundColor Green
    } else {
        Write-Host "  ℹ No unresolved comments" -ForegroundColor Gray
    }
}

# Check if any comments were found
if ($allResults.Count -eq 0) {
    Write-Host "`n✅ No unresolved comments found for the specified file(s)." -ForegroundColor Green
    Write-Host "All comments have been addressed or no comments exist yet." -ForegroundColor Gray
    exit 0
}

$totalComments = ($allResults | ForEach-Object { $_.comments.Count } | Measure-Object -Sum).Sum

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✓ Found $totalComments unresolved comment(s) across $($allResults.Count) file(s)" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
```

### 5. Display Comments Summary

Show user all comments that will be addressed:

```powershell
Write-Host "`n📝 Unresolved Comments by File:" -ForegroundColor Cyan

foreach ($result in $allResults) {
    $fileName = Split-Path $result.artifact.file_path -Leaf
    $commentCount = $result.comments.Count
    
    Write-Host "`n┌─ $fileName ($commentCount comment$(if($commentCount -ne 1){'s'}))" -ForegroundColor Yellow
    
    foreach ($comment in $result.comments) {
        Write-Host "│" -ForegroundColor Gray
        Write-Host "│ Comment #$($comment.id.Substring(0,8))" -ForegroundColor White
        Write-Host "│   Author: $($comment.author_name)" -ForegroundColor Gray
        Write-Host "│   Lines: $($comment.line_start)-$($comment.line_end)" -ForegroundColor Gray
        Write-Host "│   Content: $($comment.content)" -ForegroundColor White
    }
    
    Write-Host "└─" -ForegroundColor Gray
}
```

### 6. Process Each File Interactively

For each file with comments, guide user through addressing them:

```powershell
foreach ($result in $allResults) {
    $fileName = Split-Path $result.artifact.file_path -Leaf
    $filePath = $result.artifact.file_path
    $comments = $result.comments
    $content = $result.content
    
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📄 Processing: $fileName" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    
    # Save content to workspace
    Set-Content -Path $fileName -Value $content -Encoding UTF8
    Write-Host "✓ Loaded content to workspace: $fileName" -ForegroundColor Green
```

**Now present structured prompt to Claude (as context, not as askUserQuestion yet)**:

```markdown
# Comment Review Session: {fileName}

## File Information
- File: {filePath}
- Checkpoint: {checkpointId}
- Commit: {commitSHA}
- Comments: {commentCount}

## Instructions

You are helping the user address review comments on this file. For each comment below:

1. **Read the comment** and its target location in the file
2. **Analyze the feedback** - understand what the reviewer is asking for
3. **Read the current content** at the target lines to understand context
4. **Generate 2-3 distinct options** for how to address the comment:
   - Option A: [Brief description of approach]
   - Option B: [Alternative approach]
   - Option C: [Another alternative, if applicable]
5. **Use askUserQuestion** to present options and get user preference
6. **Wait for user response** before making ANY edits
7. **Apply the chosen edit** to the file
8. **Confirm completion** and show what changed
9. **Move to next comment**

**CRITICAL RULES:**
- MUST use askUserQuestion before making ANY edit
- Present clear, distinct options for each comment
- Apply edits incrementally, one comment at a time
- Show line numbers and affected content after each edit
- After all comments for this file, summarize changes

---

## Comments to Address

{{for each comment}}
### Comment {index}: {comment.id (first 8 chars)}

**Author:** {comment.author_name}  
**Target Lines:** {comment.line_start}-{comment.line_end}  
**Created:** {comment.created_at}

**Feedback:**
> {comment.content}

**Current Content at Lines {line_start}-{line_end}:**
```
{extract lines from content}
```

---
{{end for}}

## Start Processing

Begin with Comment 1. Follow the workflow:
1. Analyze feedback
2. Generate 2-3 distinct options
3. Ask user via askUserQuestion
4. Wait for response
5. Apply edit
6. Confirm and move to next

Ready? Start with Comment 1 for {fileName}.
```

**Let Claude process this naturally - it will use askUserQuestion for each comment**

### 7. After All Comments Processed

After Claude has processed all comments for all files:

```powershell
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ All comments addressed!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green

Write-Host "`nFiles updated:" -ForegroundColor Cyan
foreach ($result in $allResults) {
    $fileName = Split-Path $result.artifact.file_path -Leaf
    Write-Host "  ✓ $fileName" -ForegroundColor White
}
```

### 8. Commit Changes

Guide user to commit the changes:

```powershell
Write-Host "`n📝 Ready to commit changes?" -ForegroundColor Cyan
Write-Host ""
Write-Host "Recommended command:" -ForegroundColor Yellow
Write-Host "/specledger.commit -RepoOwner ""$repoOwner"" -RepoName ""$repoName"" -Branch ""$currentBranch"" -Files ""$specPath"" -Message ""feat: address review comments from $($commitSHA.Substring(0,8))""" -ForegroundColor White
```

**Alternative - Auto-commit (if user confirms)**:
```
Would you like me to automatically commit these changes? (y/n)
```

**If yes**:
```powershell
# Stage files
git add $specPath

# Commit with reference
$commentIds = $allResults | ForEach-Object { $_.comments.id } | Select-Object -First 5
$commitMsg = "feat: address review comments from $($commitSHA.Substring(0,8))

Resolved $totalComments comment(s) across $($allResults.Count) file(s):
$(($allResults | ForEach-Object { "- $(Split-Path $_.artifact.file_path -Leaf): $($_.comments.Count) comment(s)" }) -join "`n")

Comment IDs: $(($commentIds -join ', '))..."

git commit -m $commitMsg

# Push
git push origin HEAD

Write-Host "✓ Changes committed and pushed" -ForegroundColor Green
```

### 9. Mark Comments as Resolved

After successful commit, mark comments in Supabase:

```powershell
# Collect all comment IDs
$commentIds = $allResults | ForEach-Object { 
    $_.comments | ForEach-Object { $_.id } 
}

Write-Host "`n🔄 Marking comments as resolved in Supabase..." -ForegroundColor Cyan

# Call resolve script
node scripts\query-checkpoint-comments.js resolve @commentIds

Write-Host "✓ Marked $($commentIds.Count) comment(s) as resolved" -ForegroundColor Green
```

### 10. Summary Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Comment Review Session Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Repository: {owner}/{repo}
🎯 Original Checkpoint: {sha (8 chars)}
💬 Comments Addressed: {total}
📄 Files Updated: {count}

Files:
{list files with comment counts}

✓ All comments marked as resolved in Supabase
✓ Changes committed and pushed to GitHub
✓ New checkpoint will be created via webhook

Next Steps:
- View changes: git diff HEAD~1
- Check PR in GitHub: https://github.com/{owner}/{repo}/pulls
- Continue with /specledger.implement
```

## Workflow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│ /specledger.specify → /specledger.plan → /specledger.commit  │
│                                                (saves to      │
│                                                 memories)     │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Team adds comments   │
              │ to checkpoint in UI  │
              └──────────┬───────────┘
                         │
                         ▼
           /specledger.revise "spec.md"
                         │
                         ▼
        ┌────────────────────────────────┐
        │ 1. Read memories (commit info) │
        │ 2. Confirm checkpoint with user│
        │ 3. Query Supabase for comments │
        │ 4. Present each comment        │
        │ 5. askUserQuestion for options │
        │ 6. Apply chosen edits          │
        │ 7. Commit changes              │
        │ 8. Mark comments resolved      │
        └────────────────────────────────┘
```

```javascript
// scripts/query-checkpoint-comments.js
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://iituikpbiesgofuraclk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpdHVpa3BiaWVzZ29mdXJhY2xrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDY5NzcxOSwiZXhwIjoyMDgwMjczNzE5fQ.XKzKOrYsxGfgF5ueAlF0KN75vTceYMYkXg8SpG18q6I'

async function queryCheckpointComments(options) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  let checkpoint = null
  
  // Strategy 1: By file path (get latest checkpoint for artifact)
  if (options.filePath) {
    const { data: artifact } = await supabase
      .from('artifacts')
      .select('id, active_checkpoint_id, file_path')
      .eq('file_path', options.filePath)
      .single()
    
    if (!artifact) {
      throw new Error(`Artifact not found: ${options.filePath}`)
    }
    
    // Get the active checkpoint (latest)
    const { data: cp } = await supabase
      .from('checkpoints')
      .select('*')
      .eq('id', artifact.active_checkpoint_id)
      .single()
    
    checkpoint = cp
  }
  
  // Strategy 2: By commit SHA
  else if (options.commitSHA) {
    const { data: cp } = await supabase
      .from('checkpoints')
      .select('*')
      .eq('git_commit_sha', options.commitSHA)
      .single()
    
    checkpoint = cp
  }
  
  if (!checkpoint) {
    throw new Error('Checkpoint not found')
  }
  
  // Fetch comments for this checkpoint
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('checkpoint_id', checkpoint.id)
    .eq('is_resolved', false)
    .order('line_start', { ascending: true })
  
  return {
    checkpoint,
    comments: comments || [],
    artifact_path: options.filePath
  }
}

// CLI interface
const args = process.argv.slice(2)
const options = {}

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace(/^--/, '')
  const value = args[i + 1]
  options[key] = value
}

queryCheckpointComments(options)
  .then(result => {
    console.log(JSON.stringify(result, null, 2))
  })
  .catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
  })
```

**Execute query**:
```powershell
# Query by file path
$result = node scripts\query-checkpoint-comments.js --filePath "$specPath" | ConvertFrom-Json

if (!$result) {
    Write-Host "❌ No checkpoint found for $specPath" -ForegroundColor Red
    exit 1
}

$checkpointId = $result.checkpoint.id
$comments = $result.comments
$commentCount = $comments.Count

Write-Host "✓ Found checkpoint: $checkpointId" -ForegroundColor Green
Write-Host "✓ Found $commentCount unresolved comment(s)" -ForegroundColor Green
```

### 3. Display Comments Summary

Show user what comments will be addressed:

```powershell
Write-Host "`n📝 Unresolved Comments:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

foreach ($comment in $comments) {
    Write-Host "`nComment #$($comment.id.Substring(0,8))" -ForegroundColor Yellow
    Write-Host "  Author: $($comment.author_name)" -ForegroundColor Gray
    Write-Host "  Lines: $($comment.line_start)-$($comment.line_end)" -ForegroundColor Gray
    Write-Host "  Content: $($comment.content)" -ForegroundColor White
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
```

### 4. Read Checkpoint Content

Fetch the checkpoint content from GitHub:

```powershell
$gitRawUrl = $result.checkpoint.git_raw_url
Write-Host "`n📥 Fetching checkpoint content..." -ForegroundColor Cyan

$checkpointContent = Invoke-WebRequest -Uri $gitRawUrl -UseBasicParsing | Select-Object -ExpandProperty Content

# Save to workspace for editing
$workingFile = $specPath
Set-Content -Path $workingFile -Value $checkpointContent -Encoding UTF8

Write-Host "✓ Checkpoint content loaded to: $workingFile" -ForegroundColor Green
```

### 5. Generate Interactive Prompt for Claude

Build a structured prompt for Claude to process comments with askUserQuestion:

```markdown
# Comment Review Session

## File: {FilePath}
## Checkpoint: {CheckpointId}
## Unresolved Comments: {CommentCount}

---

## Instructions

You are helping the user address review comments on their specification. For each comment below:

1. **Read the comment and its target location** in the file
2. **Analyze the feedback** and understand what the reviewer is asking for
3. **Generate 2-3 distinct options** for how to address the comment:
   - Option A: [Brief description]
   - Option B: [Brief description]  
   - Option C: [Brief description] (if applicable)
4. **Use the askUserQuestion tool** to present options and ask for user preference
5. **Wait for user response** before making any edits
6. **Apply the chosen edit** to the file
7. **Move to next comment**

**CRITICAL RULES:**
- ALWAYS use askUserQuestion before making ANY edit
- Present clear, distinct options for each comment
- Apply edits incrementally, one comment at a time
- After all edits, summarize changes made

---

## Comments to Address

{{range $index, $comment := .comments}}
### Comment {{add $index 1}}: {{substr $comment.id 0 8}}

**Author:** {{$comment.author_name}}  
**Target Lines:** {{$comment.line_start}}-{{$comment.line_end}}  
**Created:** {{$comment.created_at}}

**Feedback:**
> {{$comment.content}}

**Current Content at Lines {{$comment.line_start}}-{{$comment.line_end}}:**
```
{{getLines $.checkpoint_content $comment.line_start $comment.line_end}}
```

---
{{end}}

## Workflow

Start with Comment 1. For each comment:

1. Analyze the feedback
2. Generate distinct options (2-3 alternatives)
3. Ask user: "How would you like to address this comment?"
   - Option A: [...]
   - Option B: [...]
   - Option C: [...]
4. Wait for user choice
5. Apply edit to file
6. Confirm completion
7. Move to next comment

When all comments are addressed, create a new checkpoint by committing the changes.

Ready? Begin with Comment 1.
```

**Execute prompt generation**:
```powershell
# Build the prompt
$promptTemplate = Get-Content .claude\templates\revise-prompt.tmpl -Raw

# Inject data
$prompt = $promptTemplate
$prompt = $prompt -replace '\{\{\.checkpoint_id\}\}', $checkpointId
$prompt = $prompt -replace '\{\{\.comment_count\}\}', $commentCount
$prompt = $prompt -replace '\{\{\.file_path\}\}', $specPath

# Add each comment
$commentsSection = ""
for ($i = 0; $i -lt $comments.Count; $i++) {
    $comment = $comments[$i]
    $commentsSection += @"

### Comment $($i + 1): $($comment.id.Substring(0,8))

**Author:** $($comment.author_name)
**Target Lines:** $($comment.line_start)-$($comment.line_end)

**Feedback:**
> $($comment.content)

---
"@
}

$prompt = $prompt -replace '\{\{\.comments_section\}\}', $commentsSection
```

### 6. Interactive Comment Processing

Present the prompt to Claude and facilitate the interactive loop:

```text
Claude will now process each comment and use askUserQuestion to get your preference.

Example interaction:

Claude: "Comment 1 asks to add acceptance criteria for edge cases. 
        How would you like to address this?
        
        A) Add specific acceptance criteria for null/empty inputs
        B) Add acceptance criteria for concurrent access scenarios
        C) Add both A and B with additional error handling criteria"

You: "Option C"

Claude: [Applies edits to file]
        "✓ Added acceptance criteria for edge cases (lines 45-52)
         Moving to Comment 2..."
```

**Key behavior**:
- Claude MUST use askUserQuestion for EVERY comment
- User maintains control over all decisions
- Edits are applied incrementally
- User can see changes as they happen

### 7. Create New Checkpoint

After all comments are addressed:

```powershell
Write-Host "`n✅ All comments addressed!" -ForegroundColor Green
Write-Host "📝 Creating new checkpoint..." -ForegroundColor Cyan

# Stage changes
git add $specPath

# Commit with reference to original checkpoint
git commit -m "feat: address review comments from checkpoint $($checkpointId.Substring(0,8))

- Resolved $commentCount comment(s)
- Updated: $specPath
- Original checkpoint: $checkpointId"

# Push to trigger webhook
git push origin HEAD

Write-Host "✓ Checkpoint created and pushed" -ForegroundColor Green
Write-Host "✓ Webhook will sync to Supabase automatically" -ForegroundColor Cyan
```

### 8. Mark Comments as Resolved

Update Supabase to mark comments as resolved:

```javascript
// After successful commit
async function resolveComments(checkpointId, commentIds) {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { error } = await supabase
    .from('comments')
    .update({ 
      is_resolved: true,
      updated_at: new Date().toISOString()
    })
    .in('id', commentIds)
  
  if (error) {
    console.error('Failed to mark comments as resolved:', error)
  } else {
    console.log(`✓ Marked ${commentIds.length} comment(s) as resolved`)
  }
}
```

### 9. Summary Report

Provide completion summary:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Comment Review Session Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 File: specs/001-document-collaboration-system/spec.md
🎯 Checkpoint: abc12345
💬 Comments Addressed: 5
✏️  Lines Changed: 47

✓ All comments marked as resolved
✓ New checkpoint created: def67890
✓ Changes synced to Supabase via webhook

Next Steps:
- Review the changes: git diff HEAD~1
- Continue implementation: /specledger.implement
- Check PR status in Supabase UI
```

## Comparison: Old vs New Approach

| Aspect | Old Approach | New Memories-Based Approach |
|--------|-------------|----------------------------|
| **Input** | Full file path or auto-detect | Simple filename only |
| **Checkpoint ID** | Manual or query by path | Automatic from memories |
| **Project ID** | Manual or query | Automatic from memories |
| **Confirmation** | None | User confirms checkpoint |
| **Multi-file** | One at a time | Support folder or list |
| **Memories** | Not used | Core to workflow |

## Example Usage

### Scenario 1: Review single file (after /specledger.commit)
```
User: /specledger.revise "spec.md"

Claude: 
✓ Found recent commit in conversation:
  Repository: Ne4nf/Spec
  Commit: 0879598a2fb9435ca0d87bc19bc1b33f
  Spec Path: specs/001-document-collaboration-system

📍 Checkpoint Information
Repository: Ne4nf/Spec
Commit SHA: 0879598a2fb9435ca0d87bc19bc1b33f
Spec Path: specs/001-document-collaboration-system
Files: spec.md

GitHub URL: https://github.com/Ne4nf/Spec/commit/0879598a2fb9435ca0d87bc19bc1b33f

Do you want to review comments for this checkpoint? (y/n)

User: y

Claude:
🔍 Querying checkpoint for: specs/001-document-collaboration-system/spec.md
  ✓ Found 3 comment(s)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Found 3 unresolved comment(s) across 1 file(s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Then Claude processes each comment with askUserQuestion...]
```

### Scenario 2: Review multiple files
```
User: /specledger.revise "spec.md,plan.md,data-model.md"

Claude:
[Confirms checkpoint]
[Queries all 3 files]
✓ Found 8 unresolved comment(s) across 3 file(s)

[Processes spec.md comments first, then plan.md, then data-model.md]
```

### Scenario 3: Review all files in folder
```
User: /specledger.revise "specs/001-document-collaboration-system"

Claude:
📝 Files to review: spec.md, plan.md, data-model.md, quickstart.md

[Confirms checkpoint]
[Queries all .md files in folder]
✓ Found 12 unresolved comment(s) across 4 file(s)

[Processes each file's comments]
```

### Scenario 4: No recent commit in memories
```
User: /specledger.revise "spec.md"

Claude:
❌ ERROR: No recent commit found in conversation history.

Please run /specledger.commit first to push your changes, then use /specledger.revise.

Workflow:
1. /specledger.specify "<feature>"
2. /specledger.plan  (generates files)
3. /specledger.commit  (pushes to GitHub)
4. /specledger.revise "spec.md"  (reviews comments)
```

## Error Handling

### No commit in memories
**Error:** "No recent commit found in conversation history"
**Solution:** 
- Run `/specledger.commit` first to push changes
- Ensure the commit executed successfully in this conversation
- Check that commit SHA was displayed in output

### No checkpoint found
**Error:** "Artifact not found: specs/001-doc/spec.md"
**Solution:** 
- Ensure file was included in the commit
- Wait 1-2 minutes for webhook to process
- Check Supabase artifacts table in UI
- Verify file path matches exactly

### No comments found
**Message:** "No unresolved comments for the specified file(s)"
**Meaning:**
- All comments have been resolved
- No comments exist yet
- Team hasn't added feedback yet

### Invalid file name
**Error:** "File not found in spec path"
**Solution:**
- Check file name spelling (case-sensitive)
- Ensure file exists in the spec folder
- Use just the filename, not full path

### User cancels confirmation
**Message:** "Cancelled. Please specify the correct file(s)"
**Action:** Review the checkpoint info and try again with correct parameters

## Integration with askUserQuestion

This command is designed around Claude's askUserQuestion tool for interactive review:

**Workflow per comment:**

1. **Claude reads comment**: "Reviewer asks to add error handling for edge cases"

2. **Claude analyzes context**: Reads the target lines and surrounding code

3. **Claude generates options**: 
   ```
   Comment 1 asks to add error handling for edge cases.
   How would you like to address this?
   
   A) Add try-catch blocks around database operations
   B) Add input validation with early returns
   C) Add both try-catch and input validation with detailed error messages
   ```

4. **User chooses**: "C"

5. **Claude applies edit**: Updates the file at specified lines

6. **Claude confirms**: 
   ```
   ✓ Added error handling (lines 45-67):
     - Input validation with early returns
     - Try-catch around DB operations  
     - Detailed error messages
   
   Moving to Comment 2...
   ```

7. **Repeat** for all comments across all files

**Key principles:**
- **One comment at a time** - User sees and approves each change
- **Clear options** - Each option is distinct and actionable
- **Immediate feedback** - User sees what changed after each edit
- **Natural flow** - Conversation-like interaction, not rigid forms

This is the "Human <> Agent interaction" workflow Vincent mentioned!

## Integration with /specledger.commit

The `/specledger.commit` command MUST save to memories:

```powershell
# At end of /specledger.commit
Write-Host "`n💾 Saving commit info for /specledger.revise..." -ForegroundColor Cyan

# This information becomes available in conversation memories:
# - Repository: $RepoOwner/$RepoName
# - Commit SHA: $commitHash
# - Spec Path: (derived from Files parameter)
# - Project: (if known)

Write-Host "✓ Commit info saved to conversation" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Use /specledger.revise ""spec.md"" to address review comments" -ForegroundColor Yellow
```

**Critical**: The commit command should explicitly state these values so Claude can retrieve them from memories.

## Memory Retrieval Pattern

When executing `/specledger.revise`, Claude should search backwards in the conversation for patterns like:

```
Looking for:
- "Repository: <owner>/<repo>"
- "Commit: <sha>" or "Commit SHA: <sha>"
- "Spec Path: specs/<feature-name>/"
- "Branch: <branch-name>"

From commands:
- /specledger.commit output
- Manual git commit messages
- Webhook sync notifications
```

If multiple commits found, use the **most recent** one.
