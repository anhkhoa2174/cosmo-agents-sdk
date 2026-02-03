# Implementation Plan: SDK-Backend API Parity (Outreach Focus)

**Branch**: `001-sdk-backend-parity` | **Date**: 2026-02-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-sdk-backend-parity/spec.md`

## Summary

Enable SDK users to access all outreach capabilities available in the frontend - AI-powered message draft generation with language support (EN/VI), smart outreach suggestions showing which contacts to follow up, outreach state management, meeting prep generation, and conversation history management.

**Key Deliverables:**
1. Add `language` parameter to `generateOutreachDraft()` method
2. Add new `generateMeetingPrep(meetingId, language)` method
3. Add `generate_meeting_prep` tool definition for Claude agent
4. Update `generate_outreach_draft` tool to support language parameter
5. Ensure all existing outreach methods have corresponding agent tools

## Technical Context

**Language/Version**: TypeScript 5.7.3, Node.js (ES Modules)
**Primary Dependencies**: @anthropic-ai/sdk ^0.39.0, axios ^1.6.7, zod ^3.24.2
**Storage**: N/A (SDK is stateless, calls backend API)
**Testing**: Manual testing via CLI, integration tests with backend
**Target Platform**: Node.js (CLI and library), npm package
**Project Type**: Single library project with CLI interface
**Performance Goals**: <3 seconds for draft generation, <5 seconds for meeting prep
**Constraints**: Must maintain backward compatibility, no breaking changes
**Scale/Scope**: 30 functional requirements, 9 user stories

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with principles:

- [x] **Specification-First**: Spec.md complete with 9 prioritized user stories
- [x] **Test-First**: Test strategy defined (CLI integration tests planned)
- [x] **Code Quality**: TypeScript strict mode, ESLint configured
- [x] **UX Consistency**: User flows documented in spec.md acceptance scenarios
- [x] **Performance**: Metrics defined (<3s draft, <5s meeting prep)
- [x] **Observability**: Console logging via chalk, error messages via stderr
- [x] **Issue Tracking**: Feature branch created and linked to spec

**Complexity Violations**: None identified

## Project Structure

### Documentation (this feature)

```text
specs/001-sdk-backend-parity/
├── plan.md              # This file
├── research.md          # Phase 0 output - API analysis
├── data-model.md        # Phase 1 output - TypeScript types
├── quickstart.md        # Phase 1 output - Usage examples
├── contracts/           # Phase 1 output - API contracts
└── tasks.md             # Phase 2 output (via /specledger.tasks)
```

### Source Code (repository root)

```text
src/
├── agents/              # Claude agent configurations
├── tools/
│   ├── cosmo-api.ts     # API client - ADD generateMeetingPrep, UPDATE generateOutreachDraft
│   ├── definitions.ts   # Tool definitions - ADD generate_meeting_prep, UPDATE generate_outreach_draft
│   └── executor.ts      # Tool executor - ADD generateMeetingPrep handler
├── mcp/                 # MCP client for external servers
├── utils/               # Utility functions
├── cli.ts               # CLI entry point
└── index.ts             # Package exports

tests/                   # Test directory (to be created)
├── integration/
│   └── outreach.test.ts # Integration tests for outreach tools
└── unit/
    └── api-client.test.ts
```

**Structure Decision**: Single library project - SDK is a standalone npm package with CLI interface. Source organized by concern (tools, agents, mcp).

## Complexity Tracking

> No violations - straightforward feature additions to existing codebase.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

---

## Phase 0: Research Findings

### Prior Work Analysis

**Existing SDK Implementation (from cosmo-api.ts):**
- `suggestOutreach(type, limit)` - ✅ Already implemented
- `generateOutreachDraft(contactId)` - ⚠️ Missing language parameter
- `updateOutreach(input)` - ✅ Already implemented
- `getOutreachState(contactId)` - ✅ Already implemented
- `getInteractionHistory(contactId, limit)` - ✅ Already implemented
- `addInteraction(contactId, input)` - ✅ Already implemented
- `createMeeting(input)` - ✅ Already implemented
- `updateMeeting(meetingId, input)` - ✅ Already implemented
- `getMeetings(contactId)` - ✅ Already implemented
- `addNote(contactId, content)` - ✅ Already implemented
- `getNotes(contactId, limit)` - ✅ Already implemented
- `updateNote(contactId, noteId, content)` - ✅ Already implemented
- `deleteNote(contactId, noteId)` - ✅ Already implemented
- `generateMeetingPrep(meetingId, language)` - ❌ NOT implemented

**Existing Tool Definitions (from definitions.ts):**
- `suggest_outreach` - ✅ Defined
- `generate_outreach_draft` - ⚠️ Missing language property
- `update_outreach` - ✅ Defined
- `get_outreach_state` - ✅ Defined
- `get_interaction_history` - ✅ Defined
- `add_interaction` - ✅ Defined
- `create_meeting` - ✅ Defined
- `update_meeting` - ✅ Defined
- `get_meetings` - ✅ Defined
- `add_note` - ✅ Defined
- `get_notes` - ✅ Defined
- `update_note` - ✅ Defined
- `delete_note` - ✅ Defined
- `generate_meeting_prep` - ❌ NOT defined

### Gap Analysis

| Feature | API Client | Tool Definition | Executor | Status |
|---------|-----------|-----------------|----------|--------|
| Draft with Language | ❌ No lang param | ❌ No lang property | ❌ Not passed | **NEEDS WORK** |
| Meeting Prep | ❌ Not implemented | ❌ Not defined | ❌ Not handled | **NEEDS WORK** |
| All other outreach | ✅ | ✅ | ✅ | **COMPLETE** |

### Backend API Reference

**Draft Generation (POST /v1/outreach/contacts/:contactId/draft)**
```json
Request: { "language": "en" | "vi" }
Response: {
  "contact_id": "uuid",
  "draft": "string",
  "scenario": "role_based" | "industry_based" | "no_reply_followup" | ...,
  "context_level": "LOW" | "MEDIUM" | "HIGH",
  "state": OutreachState,
  "notes": InteractionLog[]
}
```

**Meeting Prep (POST /v1/outreach/meetings/:meetingId/generate-prep)**
```json
Request: { "language": "en" | "vi" }
Response: Meeting object with meeting_prep field populated
```

### Decision Log

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Language default | 'vi' (Vietnamese) | Match frontend behavior, existing user base | 'en' default, no default |
| Method naming | `generateMeetingPrep` | Match existing SDK conventions | `createMeetingPrep`, `getMeetingPrepDocument` |
| Tool naming | `generate_meeting_prep` | Match existing snake_case tool convention | `generateMeetingPrep`, `meeting_prep` |

---

## Phase 1: Implementation Design

### Changes Required

#### 1. cosmo-api.ts - API Client

**Update `generateOutreachDraft`:**
```typescript
// Before
async generateOutreachDraft(contactId: string): Promise<GenerateDraftResponse>

// After
async generateOutreachDraft(contactId: string, language: 'en' | 'vi' = 'vi'): Promise<GenerateDraftResponse>
```

**Add `generateMeetingPrep`:**
```typescript
async generateMeetingPrep(meetingId: string, language: 'en' | 'vi' = 'vi'): Promise<Meeting>
```

#### 2. definitions.ts - Tool Definitions

**Update `generate_outreach_draft`:**
```typescript
{
  name: 'generate_outreach_draft',
  description: 'Generate a message draft for a contact...',
  input_schema: {
    type: 'object',
    properties: {
      contact_id: { type: 'string', description: 'Contact ID' },
      language: {
        type: 'string',
        enum: ['en', 'vi'],
        description: 'Language for the draft (en=English, vi=Vietnamese). Default: vi'
      }
    },
    required: ['contact_id'],
  },
}
```

**Add `generate_meeting_prep`:**
```typescript
{
  name: 'generate_meeting_prep',
  description: 'Generate AI meeting preparation document with talking points, discovery questions, potential objections, and suggested next steps. Only works for scheduled meetings.',
  input_schema: {
    type: 'object',
    properties: {
      meeting_id: { type: 'string', description: 'Meeting ID' },
      language: {
        type: 'string',
        enum: ['en', 'vi'],
        description: 'Language for the prep (en=English, vi=Vietnamese). Default: vi'
      }
    },
    required: ['meeting_id'],
  },
}
```

#### 3. executor.ts - Tool Executor

**Update `generate_outreach_draft` handler:**
```typescript
case 'generate_outreach_draft':
  return await this.client.generateOutreachDraft(
    args.contact_id,
    args.language || 'vi'
  );
```

**Add `generate_meeting_prep` handler:**
```typescript
case 'generate_meeting_prep':
  return await this.client.generateMeetingPrep(
    args.meeting_id,
    args.language || 'vi'
  );
```

#### 4. Type Definitions

**Add to types (in cosmo-api.ts or separate types.ts):**
```typescript
type Language = 'en' | 'vi';

interface GenerateDraftResponse {
  contact_id: string;
  draft: string;
  scenario: OutreachScenario;
  context_level: ContextLevel;
  state: OutreachState;
  notes?: InteractionLog[];
  language?: Language;
}
```

---

## Files to Modify

| File | Changes | Priority |
|------|---------|----------|
| `src/tools/cosmo-api.ts` | Add generateMeetingPrep, update generateOutreachDraft signature | P1 |
| `src/tools/definitions.ts` | Add generate_meeting_prep tool, update generate_outreach_draft | P1 |
| `src/tools/executor.ts` | Add generate_meeting_prep case, update generate_outreach_draft | P1 |
| `src/index.ts` | Export new types if needed | P2 |

---

## Testing Strategy

### Integration Tests

1. **Draft Generation with Language:**
   - Generate draft with `language: 'en'` → verify English content
   - Generate draft with `language: 'vi'` → verify Vietnamese content
   - Generate draft without language → verify defaults to Vietnamese

2. **Meeting Prep Generation:**
   - Create meeting → generate prep with `language: 'en'` → verify English content
   - Generate prep for non-scheduled meeting → verify error
   - Verify prep includes all 5 sections (objectives, talking points, questions, objections, next steps)

### CLI Validation

```bash
# Test draft generation
pnpm cli chat
> generate_outreach_draft contact_id=xxx language=en
> generate_outreach_draft contact_id=xxx language=vi

# Test meeting prep
> create_meeting contact_id=xxx title="Discovery Call" time="2026-02-04T10:00:00Z" duration_minutes=30 channel="Zoom"
> generate_meeting_prep meeting_id=yyy language=en
```

---

## Ready for Phase 2

This plan is ready for `/specledger.tasks` to generate the implementation tasks.

**Artifacts Generated:**
- [x] plan.md (this file)
- [ ] research.md (inline above)
- [ ] data-model.md (to be created)
- [ ] quickstart.md (to be created)
- [ ] contracts/ (N/A - using existing backend API)
