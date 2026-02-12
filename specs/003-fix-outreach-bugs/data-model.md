# Data Model: Fix Outreach Bugs

**Feature**: 003-fix-outreach-bugs
**Date**: 2026-02-06

## Entities Affected

### 1. Contact (existing - no schema change)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| next_step | string | Current next action (SEND, FOLLOW_UP_1, SET_MEETING, WAIT, etc.) |
| outreach_stage | string | Current outreach stage (COLD, NO_REPLY, REPLIED, POST_MEETING, DROPPED) |
| scenario | string | Current scenario type for draft generation |
| followup_count | int | Number of follow-ups sent |
| last_outcome | string | Last interaction outcome |

**Bug 1 impact**: `outreach_stage` transitions to NO_REPLY after 8 hours (currently only after 4 days when follow-up is due)

### 2. OutreachState (existing - no schema change)

| Field | Type | Description |
|-------|------|-------------|
| conversation_state | string | Computed state (COLD, NO_REPLY, REPLIED, etc.) |
| last_interaction_at | *time.Time | Timestamp of last interaction |
| days_since_last_interaction | int | Days since last interaction |
| next_step | string | Recommended next action |
| followup_count | int | Follow-up count |

**Bug 1 impact**: State calculation now considers hours (not just days) for 8-hour NO_REPLY transition

### 3. DraftContext (existing - no schema change)

| Field | Type | Description |
|-------|------|-------------|
| Contact | *Contact | Contact entity |
| State | *ConversationStateResult | Computed state result |
| LastOutgoing | *InteractionLog | Last outgoing message |
| LastIncoming | *InteractionLog | Last incoming message |
| Notes | []*InteractionLog | Team notes |
| UserName | string | BD user's display name for signature |

**Bug 2 impact**: `UserName` is already in the struct. Fix is in the AI prompt and post-processing, not data model.

### 4. Meeting (existing - no schema change)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner user ID |
| contact_id | UUID | Associated contact |
| time | time.Time | Meeting scheduled time |
| duration_minutes | int | Meeting duration (default 30) |
| status | string | scheduled, completed, cancelled, no_show |
| meeting_prep | *string | AI-generated meeting prep document |

**Bug 3 impact**: No model change. Timeout is infrastructure config.
**Bug 5 impact**: `time` and `duration_minutes` used for overlap detection. `status = 'scheduled'` used to filter active meetings.

### 5. Outreach Config (existing - modified)

| Field | Type | Current | Proposed |
|-------|------|---------|----------|
| FollowUp1MinDays | int | 4 | 4 (unchanged) |
| FollowUp1MaxDays | int | 5 | 5 (unchanged) |
| NoReplyHours | int | N/A | **8** (new) |

**Bug 1 impact**: New config field `NoReplyHours` to control 8-hour threshold.

## State Transitions

### Outreach Stage Transitions (updated with 8-hour rule)

```
COLD ──[send message]──> COLD (next_step=WAIT)
                              │
                              ├──[8 hours, no reply]──> NO_REPLY (next_step=WAIT)
                              │                              │
                              │                              ├──[4 days]──> NO_REPLY (next_step=FOLLOW_UP_1)
                              │                              │
                              │                              ├──[reply received]──> REPLIED
                              │                              │
                              │                              └──[2 follow-ups done]──> DROPPED
                              │
                              └──[reply received]──> REPLIED
                                                        │
                                                        ├──> SET_MEETING
                                                        ├──> FOLLOW_UP_MEETING_1
                                                        ├──> FOLLOW_UP_MEETING_2
                                                        └──> PREPARE_MEETING ──> POST_MEETING
```

### Meeting Time Suggestion Algorithm

```
Input: currentDate, existingMeetings[]
Output: suggestedTime

1. suggestedTime = currentDate + 2 days at 10:00 AM local
2. FOR each hour from 10:00 to 17:00:
     IF no overlap with existingMeetings:
       RETURN suggestedTime
     ELSE:
       suggestedTime += 1 hour
3. IF no slot found on day:
     suggestedTime = next business day at 10:00 AM
     GOTO step 2
4. RETURN suggestedTime
```

## No New Database Migrations Required

All fixes operate on existing schema. The only structural change is adding `NoReplyHours` to the in-memory `Config` struct (Go code, not database).
