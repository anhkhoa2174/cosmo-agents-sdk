# Quickstart: Fix Outreach Bugs

**Feature**: 003-fix-outreach-bugs
**Date**: 2026-02-06

## Overview

This feature fixes 5 outreach bugs across backend and frontend:

| Bug | Priority | Scope | Change Type |
|-----|----------|-------|-------------|
| Auto No-Reply after 8h | P1 | Backend | State machine logic |
| Draft name placeholder | P1 | Backend | AI prompt + post-processing |
| Meeting prep timeout | P1 | Backend + Frontend | Timeout config |
| Stage filter errors | P2 | Frontend | Error handling + debug |
| Meeting time suggestion | P2 | Frontend + Backend | New feature |

## Bug 1: Auto No-Reply (Backend)

### What to change

**File**: `internal/service/outreach/outreach_service.go`

1. Add `NoReplyHours: 8` to `Config` struct and `DefaultConfig()`
2. In `DetermineConversationState()`, add 8-hour check before the day-based follow-up logic:
   - Calculate `hoursSinceLastInteraction` from `lastOutgoing.Timestamp`
   - If `hoursSinceLastInteraction >= 8` and `lastIncoming == nil` → set `outreach_stage = NO_REPLY`
   - Keep existing day-based follow-up logic unchanged

### Verification

```bash
# Unit test: state transitions to NO_REPLY after 8 hours
go test ./internal/service/outreach/ -run TestNoReplyAfter8Hours

# Integration: send message, check status after 8h simulation
```

## Bug 2: Draft Name Placeholder (Backend)

### What to change

**File**: `internal/service/outreach/outreach_service.go`

1. **System prompt** (`getSystemPromptForLanguage()`): Add instruction:
   - Vietnamese: "LUÔN ký tên bằng tên người gửi được cung cấp. KHÔNG BAO GIỜ sử dụng placeholder như [Tên bạn]."
   - English: "ALWAYS sign with the sender's name provided. NEVER use placeholders like [Your Name]."

2. **Post-processing** (`generateDraftWithFullContextAndLanguage()`): After AI returns, replace:
   - `[Tên bạn]` → `DraftContext.UserName`
   - `[Your Name]` → `DraftContext.UserName`
   - `[Tên của bạn]` → `DraftContext.UserName`

### Verification

```bash
# Generate draft and check for placeholder absence
curl -X POST /v1/outreach/contacts/{id}/draft -d '{"language":"vi"}'
# Verify response.data.draft contains actual user name, not [Tên bạn]
```

## Bug 3: Meeting Prep Timeout (Backend + Frontend)

### What to change

**Backend** (`internal/handler/v1/outreach/handler.go`):
```go
// In GenerateMeetingPrep handler, wrap context with timeout:
ctx, cancel := context.WithTimeout(c.Context(), 120*time.Second)
defer cancel()
```

**Frontend** (`src/network/client/outreach.ts`):
```typescript
// Add timeout to generateMeetingPrep call:
generateMeetingPrep: async (meetingId: string, language: Language = 'vi') => {
  const data = await kyClient.post(`v1/outreach/meetings/${meetingId}/generate-prep`, {
    json: { language },
    timeout: 130_000, // 130 seconds (slightly longer than backend 120s)
  });
  return data.json<ApiResponse<Meeting>>();
},
```

**Frontend** (`src/components/contacts/contact-outreach.tsx`):
- Add timeout hint text below spinner during `isPending`

### Verification

```bash
# Test with contact that has extensive history
# Verify completion within 2 minutes or clear error message
```

## Bug 4: Stage Filter Errors (Frontend)

### What to change

**File**: `src/app/(main)/outreach/page.tsx`

1. Add error handling to the contacts query for filter
2. Handle empty results gracefully (show "No contacts in this stage" message)
3. Debug: Add console logging when filter is applied to trace issues

### Verification

```bash
# Select each meeting stage filter and verify:
# - SET_MEETING, FOLLOW_UP_MEETING_1, FOLLOW_UP_MEETING_2, PREPARE_MEETING
# - No errors, correct results or empty state message
```

## Bug 5: Meeting Time Suggestion (Frontend + Backend)

### What to change

**Backend** - New endpoint `GET /v1/outreach/meetings`:
- Returns all user's scheduled meetings (not contact-specific)
- Used by frontend for overlap detection

**Frontend** (`src/components/contacts/contact-outreach.tsx`):

1. Add utility function `suggestMeetingTime(existingMeetings)`:
   - Default: 2 days from now at 10:00 AM
   - If overlap: shift +1 hour until free slot
   - If no slot on day: next business day at 10:00 AM

2. When meeting dialog opens, auto-set `meetingTime` to suggested time

3. Fetch all user meetings for overlap detection

### Verification

```bash
# Open meeting dialog → verify default time is 2 days ahead
# Book a meeting at 10:00 AM → open dialog → verify suggestion is 11:00 AM
# Book consecutive hours → verify it finds next free slot
```

## Development Order

1. Bug 2 (Draft name) - Simplest fix, immediate user impact
2. Bug 3 (Timeout) - Simple config change, immediate reliability improvement
3. Bug 1 (Auto No-Reply) - State machine change, needs careful testing
4. Bug 4 (Stage filter) - Needs runtime debugging
5. Bug 5 (Meeting time) - New feature, most complex
