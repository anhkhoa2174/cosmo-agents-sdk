# Implementation Tasks: SDK-Backend API Parity

**Feature Branch**: `001-sdk-backend-parity`
**Generated**: 2026-02-03
**Source**: [spec.md](./spec.md) | [plan.md](./plan.md)

## Summary

Based on the gap analysis from plan.md, the SDK already has most outreach methods implemented. The key work needed:

| Component | Current Status | Work Needed |
|-----------|---------------|-------------|
| `generateOutreachDraft` | Missing language param | Add `language: 'en' \| 'vi'` parameter |
| `generateMeetingPrep` | Not implemented | New method implementation |
| Tool definitions | Missing language & meeting prep | Update definitions |
| Executor | Missing handlers | Add meeting prep handler |

---

## Phase 1: Core Implementation (P1 User Stories)

### US1: AI-Powered Message Draft Generation

#### Task 1.1: Update generateOutreachDraft Method Signature
**File**: `src/tools/cosmo-api.ts`
**Priority**: P1
**Estimate**: 15 min
**Dependencies**: None

**Changes**:
```typescript
// Before
async generateOutreachDraft(contactId: string): Promise<GenerateDraftResponse>

// After
async generateOutreachDraft(
  contactId: string,
  language: 'en' | 'vi' = 'vi'
): Promise<GenerateDraftResponse>
```

**Implementation**:
1. Add `language` parameter with default `'vi'`
2. Pass language in request body to POST endpoint
3. Ensure backward compatibility (existing calls without language still work)

**Acceptance Criteria**:
- [ ] Method accepts optional language parameter
- [ ] Default language is 'vi' (Vietnamese)
- [ ] Language is passed to backend API in request body

---

#### Task 1.2: Update generate_outreach_draft Tool Definition
**File**: `src/tools/definitions.ts`
**Priority**: P1
**Estimate**: 10 min
**Dependencies**: Task 1.1

**Changes**:
```typescript
{
  name: 'generate_outreach_draft',
  description: 'Generate an AI-powered message draft for a contact based on their profile, conversation history, and outreach state.',
  input_schema: {
    type: 'object',
    properties: {
      contact_id: {
        type: 'string',
        description: 'The contact ID to generate a draft for'
      },
      language: {
        type: 'string',
        enum: ['en', 'vi'],
        description: 'Language for the generated draft. en=English, vi=Vietnamese. Default: vi'
      }
    },
    required: ['contact_id'],
  },
}
```

**Acceptance Criteria**:
- [ ] Tool definition includes `language` property with enum
- [ ] Language property has clear description
- [ ] Only `contact_id` is required (language optional)

---

#### Task 1.3: Update generate_outreach_draft Executor Handler
**File**: `src/tools/executor.ts`
**Priority**: P1
**Estimate**: 10 min
**Dependencies**: Task 1.1, Task 1.2

**Changes**:
```typescript
case 'generate_outreach_draft':
  return await this.client.generateOutreachDraft(
    args.contact_id,
    args.language || 'vi'
  );
```

**Acceptance Criteria**:
- [ ] Executor passes language parameter to API client
- [ ] Defaults to 'vi' if language not provided

---

### US4: Meeting Prep Generation

#### Task 4.1: Add generateMeetingPrep Method
**File**: `src/tools/cosmo-api.ts`
**Priority**: P1
**Estimate**: 20 min
**Dependencies**: None

**Implementation**:
```typescript
/**
 * Generate AI meeting preparation document
 * @param meetingId - The meeting ID to generate prep for
 * @param language - Language for the prep (en/vi), defaults to 'vi'
 * @returns Meeting object with meeting_prep field populated
 */
async generateMeetingPrep(
  meetingId: string,
  language: 'en' | 'vi' = 'vi'
): Promise<Meeting> {
  const response = await this.client.post<ApiResponse<Meeting>>(
    `/v1/outreach/meetings/${meetingId}/generate-prep`,
    { language }
  );
  return response.data.data;
}
```

**Acceptance Criteria**:
- [ ] Method calls correct endpoint: POST /v1/outreach/meetings/:meetingId/generate-prep
- [ ] Language parameter is passed in request body
- [ ] Returns Meeting object with meeting_prep field
- [ ] Default language is 'vi'

---

#### Task 4.2: Add generate_meeting_prep Tool Definition
**File**: `src/tools/definitions.ts`
**Priority**: P1
**Estimate**: 15 min
**Dependencies**: Task 4.1

**Implementation**:
```typescript
{
  name: 'generate_meeting_prep',
  description: 'Generate an AI meeting preparation document with talking points, discovery questions, potential objections, and suggested next steps. Only works for scheduled meetings.',
  input_schema: {
    type: 'object',
    properties: {
      meeting_id: {
        type: 'string',
        description: 'The meeting ID to generate prep for'
      },
      language: {
        type: 'string',
        enum: ['en', 'vi'],
        description: 'Language for the meeting prep. en=English, vi=Vietnamese. Default: vi'
      }
    },
    required: ['meeting_id'],
  },
}
```

**Acceptance Criteria**:
- [ ] Tool definition added to tools array
- [ ] Description mentions 5 sections: objectives, talking points, questions, objections, next steps
- [ ] Description notes only scheduled meetings are supported
- [ ] Only meeting_id is required

---

#### Task 4.3: Add generate_meeting_prep Executor Handler
**File**: `src/tools/executor.ts`
**Priority**: P1
**Estimate**: 10 min
**Dependencies**: Task 4.1, Task 4.2

**Implementation**:
```typescript
case 'generate_meeting_prep':
  return await this.client.generateMeetingPrep(
    args.meeting_id,
    args.language || 'vi'
  );
```

**Acceptance Criteria**:
- [ ] Case added to switch statement
- [ ] Language defaults to 'vi' if not provided
- [ ] Returns result from API client

---

## Phase 2: Type Definitions

#### Task 2.1: Add Language Type
**File**: `src/tools/cosmo-api.ts` (or separate types.ts)
**Priority**: P1
**Estimate**: 5 min
**Dependencies**: None

**Implementation**:
```typescript
/**
 * Supported languages for AI generation
 */
export type Language = 'en' | 'vi';
```

**Acceptance Criteria**:
- [ ] Language type is exported
- [ ] Type is used in method signatures

---

#### Task 2.2: Update GenerateDraftResponse Type
**File**: `src/tools/cosmo-api.ts`
**Priority**: P2
**Estimate**: 5 min
**Dependencies**: Task 2.1

**Implementation**:
```typescript
interface GenerateDraftResponse {
  contact_id: string;
  draft: string;
  scenario: OutreachScenario;
  context_level: ContextLevel;
  state: OutreachState;
  notes?: InteractionLog[];
  language?: Language;  // Add this field
}
```

**Acceptance Criteria**:
- [ ] Language field added to response type
- [ ] Field is optional (backend may not always return it)

---

## Phase 3: Testing & Validation

#### Task 3.1: Manual CLI Testing - Draft Generation
**Priority**: P1
**Estimate**: 15 min
**Dependencies**: Tasks 1.1-1.3

**Test Commands**:
```bash
pnpm cli chat
> generate_outreach_draft contact_id=<contact-uuid>
> generate_outreach_draft contact_id=<contact-uuid> language=en
> generate_outreach_draft contact_id=<contact-uuid> language=vi
```

**Acceptance Criteria**:
- [ ] Draft without language returns Vietnamese content
- [ ] Draft with language=en returns English content
- [ ] Draft with language=vi returns Vietnamese content

---

#### Task 3.2: Manual CLI Testing - Meeting Prep
**Priority**: P1
**Estimate**: 20 min
**Dependencies**: Tasks 4.1-4.3

**Test Commands**:
```bash
pnpm cli chat
> create_meeting contact_id=<contact-uuid> title="Discovery Call" time="2026-02-04T10:00:00Z" duration_minutes=30 channel="Zoom"
> generate_meeting_prep meeting_id=<meeting-uuid>
> generate_meeting_prep meeting_id=<meeting-uuid> language=en
```

**Acceptance Criteria**:
- [ ] Meeting prep without language returns Vietnamese content
- [ ] Meeting prep with language=en returns English content
- [ ] Prep includes all 5 sections (objectives, talking points, questions, objections, next steps)
- [ ] Error returned for non-scheduled meetings

---

## Task Dependency Graph

```
Phase 1: Core Implementation
├── Task 1.1 (generateOutreachDraft signature)
│   └── Task 1.2 (tool definition)
│       └── Task 1.3 (executor handler)
│
├── Task 4.1 (generateMeetingPrep method)
│   └── Task 4.2 (tool definition)
│       └── Task 4.3 (executor handler)

Phase 2: Types
├── Task 2.1 (Language type) ← Can start in parallel
└── Task 2.2 (Response type update)

Phase 3: Testing
├── Task 3.1 (Draft testing) ← After 1.1-1.3
└── Task 3.2 (Meeting prep testing) ← After 4.1-4.3
```

---

## Files Summary

| File | Tasks | Changes |
|------|-------|---------|
| `src/tools/cosmo-api.ts` | 1.1, 4.1, 2.1, 2.2 | Add language param, add generateMeetingPrep, add types |
| `src/tools/definitions.ts` | 1.2, 4.2 | Update generate_outreach_draft, add generate_meeting_prep |
| `src/tools/executor.ts` | 1.3, 4.3 | Update handler, add new case |

---

## Estimated Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | 1.1-1.3, 4.1-4.3 | 80 min |
| Phase 2 | 2.1-2.2 | 10 min |
| Phase 3 | 3.1-3.2 | 35 min |
| **Total** | **10 tasks** | **~2 hours** |

---

## Notes

- All existing SDK methods for outreach (suggestOutreach, updateOutreach, getOutreachState, etc.) are already implemented and don't need changes
- Campaign management (US8) and Agent/Template management (US9) are lower priority (P2/P3) and can be addressed in future iterations
- Backend API endpoints are already implemented and support the language parameter
