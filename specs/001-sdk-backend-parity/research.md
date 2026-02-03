# Research: SDK-Backend API Parity

**Feature**: 001-sdk-backend-parity
**Date**: 2026-02-03

## Prior Work Summary

### Existing SDK Implementation

The SDK already implements most outreach methods. Analysis of `src/tools/cosmo-api.ts` reveals:

| Method | Status | Notes |
|--------|--------|-------|
| `suggestOutreach(type, limit)` | ✅ Complete | Returns prioritized contacts |
| `generateOutreachDraft(contactId)` | ⚠️ Needs Update | Missing language parameter |
| `updateOutreach(input)` | ✅ Complete | Handles all state transitions |
| `getOutreachState(contactId)` | ✅ Complete | Returns current state machine position |
| `getInteractionHistory(contactId, limit)` | ✅ Complete | Returns conversation history |
| `addInteraction(contactId, input)` | ✅ Complete | Logs messages with channel/sentiment |
| `createMeeting(input)` | ✅ Complete | Creates scheduled meetings |
| `updateMeeting(meetingId, input)` | ✅ Complete | Updates status/outcome |
| `getMeetings(contactId)` | ✅ Complete | Lists contact's meetings |
| `deleteMeeting(meetingId)` | ✅ Complete | Removes meeting |
| `addNote(contactId, content)` | ✅ Complete | Creates team notes |
| `getNotes(contactId, limit)` | ✅ Complete | Lists notes |
| `updateNote(contactId, noteId, content)` | ✅ Complete | Edits note |
| `deleteNote(contactId, noteId)` | ✅ Complete | Removes note |
| `generateMeetingPrep(meetingId, language)` | ❌ Missing | **NEW: Must implement** |

### Existing Tool Definitions

Analysis of `src/tools/definitions.ts` shows all outreach tools are defined except `generate_meeting_prep`. The `generate_outreach_draft` tool needs a `language` property added.

## Technology Decisions

### Decision 1: Language Parameter Implementation

**Decision**: Add optional `language` parameter with default 'vi'

**Rationale**:
- Maintains backward compatibility (existing code without language still works)
- Matches frontend behavior where Vietnamese is the default
- Consistent with existing backend API contract

**Alternatives Rejected**:
- Required language parameter: Would break existing integrations
- Language config at client level: Less flexible for per-request language

### Decision 2: Meeting Prep Method Name

**Decision**: `generateMeetingPrep(meetingId, language)`

**Rationale**:
- Follows existing SDK naming convention (`generateOutreachDraft`)
- Clear action-noun pattern
- Matches backend endpoint naming

**Alternatives Rejected**:
- `createMeetingPrep`: Implies creation, but it's generation
- `getMeetingPrepDocument`: Too verbose

### Decision 3: Tool Definition Pattern

**Decision**: Add `generate_meeting_prep` with same structure as other outreach tools

**Rationale**:
- Consistent with existing tool definitions
- Uses snake_case for tool names (SDK convention)
- Input schema matches backend API contract

## Backend API Analysis

### Draft Generation Endpoint

```
POST /v1/outreach/contacts/:contactId/draft
```

**Request Body:**
```json
{
  "language": "en" | "vi"  // Optional, defaults to "vi"
}
```

**Response:**
```json
{
  "data": {
    "contact_id": "uuid",
    "draft": "AI-generated message content",
    "scenario": "role_based" | "industry_based" | "no_reply_followup" | "post_reply" | "post_meeting" | "re_engage",
    "context_level": "LOW" | "MEDIUM" | "HIGH",
    "state": {
      "conversation_state": "COLD" | "NO_REPLY" | "REPLIED" | "POST_MEETING" | "DROPPED",
      "next_step": "SEND" | "FOLLOW_UP_1" | "FOLLOW_UP_2" | "SET_MEETING" | "PREPARE_MEETING" | "WAIT" | "DROP",
      "followup_count": 0,
      "days_since_last_interaction": 0
    },
    "notes": [/* InteractionLog[] */]
  }
}
```

### Meeting Prep Endpoint

```
POST /v1/outreach/meetings/:meetingId/generate-prep
```

**Request Body:**
```json
{
  "language": "en" | "vi"  // Optional, defaults to "vi"
}
```

**Response:**
```json
{
  "data": {
    "id": "meeting-uuid",
    "contact_id": "contact-uuid",
    "title": "Meeting Title",
    "time": "2026-02-04T10:00:00Z",
    "status": "scheduled",
    "meeting_prep": "# Meeting Prep\n\n## Objectives\n...\n## Talking Points\n...\n## Discovery Questions\n...\n## Potential Objections\n...\n## Next Steps\n..."
  }
}
```

**Constraints:**
- Meeting must be in "scheduled" status
- Returns error for completed/cancelled meetings

## Dependencies

### Runtime Dependencies (unchanged)
- `axios`: HTTP client for backend API calls
- `@anthropic-ai/sdk`: Claude agent integration
- `zod`: Schema validation (if adding input validation)

### Development Dependencies (unchanged)
- `typescript`: Type checking
- `tsx`: TypeScript execution for CLI

## Testing Strategy

### Unit Tests (Future)
- Mock API responses to test method logic
- Test language parameter handling
- Test error cases (invalid meeting status)

### Integration Tests
- Test against running backend
- Verify draft content matches requested language
- Verify meeting prep includes all sections

### CLI Manual Testing
```bash
# Draft generation
pnpm cli chat
> generate_outreach_draft contact_id=xxx language=en

# Meeting prep
> create_meeting contact_id=xxx title="Call" time="2026-02-04T10:00:00Z" duration_minutes=30 channel="Zoom"
> generate_meeting_prep meeting_id=yyy language=en
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend API changes | High | Document expected API contract, add version checks |
| Performance degradation | Medium | Set timeout limits, add retry logic |
| Language detection issues | Low | Always pass explicit language, don't auto-detect |
