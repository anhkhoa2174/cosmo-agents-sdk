# Tasks Index: Fix Outreach Bugs

Beads Issue Graph Index into the tasks and phases for this feature implementation.
Note: Beads CLI not available — tasks tracked directly in this file.

## Feature Tracking

* **Feature Branch**: `003-fix-outreach-bugs`
* **User Stories Source**: `specs/003-fix-outreach-bugs/spec.md`
* **Research Inputs**: `specs/003-fix-outreach-bugs/research.md`
* **Planning Details**: `specs/003-fix-outreach-bugs/plan.md`
* **Data Model**: `specs/003-fix-outreach-bugs/data-model.md`
* **Quickstart Guide**: `specs/003-fix-outreach-bugs/quickstart.md`

## Convention Summary

| Label | Description |
|-------|-------------|
| `[US1]` | User Story 1: Auto No-Reply After 8 Hours (P1) |
| `[US2]` | User Story 2: Fix Draft Name Placeholder (P1) |
| `[US3]` | User Story 3: Meeting Prep Timeout (P1) |
| `[US4]` | User Story 4: Fix Stage Filter Errors (P2) |
| `[US5]` | User Story 5: Smart Meeting Time Suggestion (P2) |
| `[BE]` | Backend change (cosmo-agents-backend) |
| `[FE]` | Frontend change (cosmo-agents-frontend) |
| `[P]` | Can run in parallel with other `[P]` tasks in same phase |

---

## Phase 1: User Story 2 — Fix Draft Name Placeholder (P1) 🎯 MVP

**Goal**: Eliminate "[Tên bạn]" placeholder from AI-generated draft messages. User's real name appears in signature.

**Independent Test**: Generate a draft for any contact → verify user's real name (not placeholder) in signature.

**Requirements**: FR-004, FR-005, FR-006

### Implementation

- [ ] T001 [US2] [BE] Add name instruction to system prompts in `getSystemPromptForLanguage()`
  - **File**: `cosmo-agents-backend/internal/service/outreach/outreach_service.go` (lines 1050-1115)
  - **What**: Add explicit instruction to both Vietnamese and English system prompts:
    - Vietnamese: Add `"LUÔN ký tên bằng tên người gửi được cung cấp trong context. KHÔNG BAO GIỜ dùng placeholder như [Tên bạn] hay [Your Name]."` to the FORMAT section
    - English: Add `"ALWAYS sign with the sender's name provided in context. NEVER use placeholders like [Your Name] or [Tên bạn]."` to the FORMAT section
  - **Acceptance**: System prompt contains explicit anti-placeholder instruction in both languages

- [ ] T002 [US2] [BE] Add post-processing to replace name placeholders after AI generation
  - **File**: `cosmo-agents-backend/internal/service/outreach/outreach_service.go` (lines 1017-1046)
  - **What**: In `generateDraftWithFullContextAndLanguage()`, after `strings.TrimSpace(response)`, add replacement logic:
    - Replace `[Tên bạn]`, `[Your Name]`, `[Tên của bạn]`, `[tên bạn]`, `[your name]` with `draftCtx.UserName`
    - If `draftCtx.UserName` is empty, replace with empty string (remove placeholder entirely)
  - **Depends on**: T001 (same file, sequential)
  - **Acceptance**: No draft message ever contains bracket-enclosed name placeholders

- [ ] T003 [US2] [BE] Handle edge case: user with no display name and no email
  - **File**: `cosmo-agents-backend/internal/handler/v1/outreach/handler.go` (lines 98-100)
  - **What**: After existing fallback `userName = user.Email`, add: if both Name and Email are empty, set `userName = ""` (the post-processing in T002 will remove placeholders cleanly)
  - **Depends on**: T002
  - **Acceptance**: Draft for user with no name/email has clean sign-off without placeholder or empty brackets

**Checkpoint**: Generate drafts in both VI and EN → no "[Tên bạn]" or "[Your Name]" appears

---

## Phase 2: User Story 3 — Meeting Prep Timeout Increase (P1)

**Goal**: Meeting prep generation has 120s timeout with proper error handling at all layers.

**Independent Test**: Generate meeting prep for contact with extensive history → completes within 2 min or shows clear error.

**Requirements**: FR-007, FR-008, FR-009

### Implementation

- [ ] T004 [P] [US3] [BE] Add context timeout to meeting prep handler
  - **File**: `cosmo-agents-backend/internal/handler/v1/outreach/handler.go` (lines 355-386)
  - **What**: In `GenerateMeetingPrep()` handler, replace `ctx := c.Context()` with:
    ```go
    ctx, cancel := context.WithTimeout(c.Context(), 120*time.Second)
    defer cancel()
    ```
    Add `"time"` to imports if not present. Ensure the ctx with timeout is passed to `h.outreachService.GenerateMeetingPrep(ctx, ...)`.
  - **Acceptance**: Backend returns timeout error after 120s instead of hanging indefinitely

- [ ] T005 [P] [US3] [FE] Add per-request timeout to frontend meeting prep API call
  - **File**: `cosmo-agents-frontend/src/network/client/outreach.ts` (lines 298-303)
  - **What**: Add `timeout: 130_000` (130 seconds) to the ky POST options for `generateMeetingPrep`. This is slightly longer than backend 120s to let backend return the error message rather than client-side abort.
    ```typescript
    generateMeetingPrep: async (meetingId: string, language: Language = 'vi') => {
      const data = await kyClient.post(`v1/outreach/meetings/${meetingId}/generate-prep`, {
        json: { language },
        timeout: 130_000,
      });
      return data.json<ApiResponse<Meeting>>();
    },
    ```
  - **Acceptance**: Frontend doesn't abort before backend returns; shows error from backend on timeout

- [ ] T006 [US3] [FE] Add loading hint text during meeting prep generation
  - **File**: `cosmo-agents-frontend/src/components/contacts/contact-outreach.tsx` (lines 499-535)
  - **What**: Below the existing `Loader2` spinner when `generateMeetingPrepMutation.isPending`, add a small text hint:
    - Vietnamese: "Đang tạo... có thể mất đến 2 phút"
    - English: "Generating... may take up to 2 minutes"
    Use the existing `language` variable to pick the right text.
  - **Depends on**: T005 (frontend, same component area)
  - **Acceptance**: User sees informative text during generation wait, not just a spinner

**Checkpoint**: Meeting prep generation with extensive contact history → completes or shows clear timeout error within 2 min

---

## Phase 3: User Story 1 — Auto No-Reply After 8 Hours (P1)

**Goal**: Contacts automatically transition to NO_REPLY outreach stage 8 hours after last outgoing message with no reply.

**Independent Test**: Send message to test contact, simulate 8h passage, verify outreach_stage = NO_REPLY.

**Requirements**: FR-001, FR-002, FR-003

### Implementation

- [ ] T007 [US1] [BE] Add NoReplyHours config field to outreach service Config
  - **File**: `cosmo-agents-backend/internal/service/outreach/outreach_service.go` (lines 18-44)
  - **What**: Add `NoReplyHours int` field to `Config` struct. Set default to `8` in `DefaultConfig()`. This controls the hour threshold for auto NO_REPLY transition.
  - **Acceptance**: Config struct has NoReplyHours field; DefaultConfig() returns 8

- [ ] T008 [US1] [BE] Add 8-hour NO_REPLY check in DetermineConversationState()
  - **File**: `cosmo-agents-backend/internal/service/outreach/outreach_service.go` (lines 251-277)
  - **What**: In the NO_REPLY logic block (where `lastOutgoing != nil && lastIncoming == nil`), calculate `hoursSinceLastOutgoing` using `now.Sub(lastOutgoing.Timestamp).Hours()`. Before the existing `daysSinceLastInteraction` follow-up logic, add:
    - If `hoursSinceLastOutgoing >= float64(s.config.NoReplyHours)` → set `result.State = outreach.StateNoReply` and `result.OutreachStage` to NO_REPLY
    - The `next_step` logic (WAIT vs FOLLOW_UP_1 vs FOLLOW_UP_2) remains unchanged — this only affects the stage label
    - If `hoursSinceLastOutgoing < float64(s.config.NoReplyHours)` → keep state as COLD (not yet 8 hours)
  - **Depends on**: T007 (needs NoReplyHours config)
  - **Acceptance**: Contact shows outreach_stage=NO_REPLY after 8h; follow-up timing (4-day) unchanged; reply still transitions to REPLIED correctly (FR-003)

- [ ] T009 [US1] [BE] Add logging for 8-hour NO_REPLY transitions in worker
  - **File**: `cosmo-agents-backend/internal/worker/outreach/recalculate_worker.go` (lines 97-181)
  - **What**: In `recalculateForUser()`, after `DetermineConversationState()` returns and before updating the contact, add a log line when the outreach_stage changes to NO_REPLY: `fmt.Printf("[RecalculateWorker] Contact %s transitioned to NO_REPLY after 8h\n", contact.ID)`
  - **Depends on**: T008 (needs state machine change to trigger)
  - **Acceptance**: Worker logs show 8-hour transitions for debugging

**Checkpoint**: Send outreach message → wait 8h (or test with config set to lower value) → contact shows NO_REPLY stage

---

## Phase 4: User Story 4 — Fix Stage Filter Errors (P2)

**Goal**: All meeting-related stage filters work correctly on the outreach dashboard.

**Independent Test**: Select each meeting stage filter → contacts list updates correctly or shows empty state.

**Requirements**: FR-010, FR-011, FR-012

### Implementation

- [ ] T010 [US4] [FE] Debug and trace stage filter API call
  - **File**: `cosmo-agents-frontend/src/app/(main)/outreach/page.tsx` (lines 156-168)
  - **What**:
    1. Read the contacts query and filter logic carefully
    2. Check if the `useQuery` for contacts has proper error handling
    3. Verify the filter payload format: `{filter: {next_step: "SET_MEETING"}}` matches backend expectation
    4. Check if React Query's `isError` state is being displayed to the user or silently swallowed
    5. Add `onError` callback or check `isError` state in the query result
  - **Acceptance**: Clear understanding of what error occurs; error is visible in console

- [ ] T011 [US4] [FE] Add graceful empty state handling for stage filters
  - **File**: `cosmo-agents-frontend/src/app/(main)/outreach/page.tsx`
  - **What**: When `contacts?.data` is empty array (not error) and a filter is active, show a message like:
    - "No contacts in this stage" (or Vietnamese equivalent based on language)
    - instead of empty table or error state
    - Check if the current rendering already handles `contacts?.data?.length === 0` or if it falls through to an error
  - **Depends on**: T010 (needs debug findings first)
  - **Acceptance**: Selecting any stage filter with no matching contacts shows "No contacts" message, not error

- [ ] T012 [US4] [FE] Verify and fix filter for all meeting stages
  - **File**: `cosmo-agents-frontend/src/app/(main)/outreach/page.tsx` (lines 427-444)
  - **What**: Test each of the 4 meeting stages: SET_MEETING, FOLLOW_UP_MEETING_1, FOLLOW_UP_MEETING_2, PREPARE_MEETING. If any specific stage filter causes an error:
    - Check if the value matches the backend NextStepAction constant exactly
    - Check if the filter is being correctly added to the POST body
    - Fix any mismatches or encoding issues
  - **Depends on**: T010 (needs debug findings)
  - **Acceptance**: All 4 meeting stage filters return correct results without errors (SC-004, SC-006)

**Checkpoint**: Select each meeting stage filter → either correct contacts shown or clean empty state

---

## Phase 5: User Story 5 — Smart Meeting Time Suggestion (P2)

**Goal**: Meeting creation form auto-suggests time 2 days ahead with overlap detection.

**Independent Test**: Open meeting form → default time is 2 days ahead. Book meeting at that time → next suggestion shifts 1 hour.

**Requirements**: FR-013, FR-014, FR-015, FR-016

### Implementation

- [ ] T013 [P] [US5] [BE] Add endpoint to fetch all user meetings (not per-contact)
  - **File**: `cosmo-agents-backend/internal/handler/v1/outreach/handler.go`
  - **What**: Add a new handler `GetAllUserMeetings` for `GET /v1/outreach/meetings` that:
    - Gets userID from auth context
    - Accepts optional query params: `status` (default: "scheduled"), `from_date`, `to_date`
    - Calls a new service method to fetch meetings by user (not contact-specific)
    - Register route in `cmd/server/routes_v1.go`
  - **Also modify**: `cosmo-agents-backend/internal/repository/outreach/outreach_repository.go` — add `FindByUserID(ctx, userID, status)` method
  - **Also modify**: `cosmo-agents-backend/internal/service/outreach/outreach_service.go` — add `GetUserMeetings(ctx, userID, status)` wrapper
  - **Acceptance**: `GET /v1/outreach/meetings` returns all scheduled meetings for the authenticated user

- [ ] T014 [P] [US5] [FE] Create meeting time suggestion utility function
  - **File**: `cosmo-agents-frontend/src/lib/meeting-utils.ts` (NEW FILE)
  - **What**: Create utility function `suggestMeetingTime(existingMeetings: Meeting[]): string`:
    1. Calculate `suggestedTime = now + 2 days, at 10:00 AM local`
    2. If `suggestedTime` falls on weekend → shift to next Monday
    3. For each hour from 10:00 to 17:00 on suggested day:
       - Check if any existing meeting overlaps (meeting.time to meeting.time + meeting.duration_minutes)
       - If no overlap → return this time as ISO string for `datetime-local` input
       - If overlap → try next hour
    4. If no slot found on day → shift to next business day at 10:00 AM, repeat
    5. Return formatted string compatible with `<input type="datetime-local">`
    - Business hours: 9:00-18:00 (slots 10:00-17:00 for 1-hour meetings)
    - Import `Meeting` type from `network/client/outreach.ts`
  - **Acceptance**: Given empty meetings → returns 2 days ahead at 10AM. Given meeting at 10AM → returns 11AM. Given all hours booked → returns next business day 10AM.

- [ ] T015 [US5] [FE] Add API client method to fetch all user meetings
  - **File**: `cosmo-agents-frontend/src/network/client/outreach.ts`
  - **What**: Add method:
    ```typescript
    getAllUserMeetings: async (status?: string) => {
      const params = status ? { status } : {};
      const data = await kyClient.get('v1/outreach/meetings', { searchParams: params });
      return data.json<ApiResponse<Meeting[]>>();
    },
    ```
  - **Depends on**: T013 (backend endpoint must exist)
  - **Acceptance**: Frontend can fetch all user meetings via API

- [ ] T016 [US5] [FE] Integrate time suggestion into meeting creation dialog
  - **File**: `cosmo-agents-frontend/src/components/contacts/contact-outreach.tsx` (lines 72-76, 395-471)
  - **What**:
    1. Add `useQuery` hook to fetch all user meetings: `queryKey: ['all-user-meetings'], queryFn: () => OutreachApi.getAllUserMeetings('scheduled')`
    2. Import `suggestMeetingTime` from `lib/meeting-utils.ts`
    3. When `meetingDialogOpen` becomes true (or in a `useEffect` on dialog open), calculate `suggestedTime = suggestMeetingTime(allUserMeetings)`
    4. Set `setMeetingTime(suggestedTime)` as default
    5. User can still manually change the time; suggestion is just the default
  - **Depends on**: T014 (utility function), T015 (API client)
  - **Acceptance**: Opening meeting dialog → time field pre-filled with conflict-free suggestion 2 days ahead

**Checkpoint**: Open meeting form → 10AM 2 days ahead. Book at that time → next form shows 11AM.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T017 [P] Build and verify both repos compile cleanly
  - Backend: `cd cosmo-agents-backend && go build ./...`
  - Frontend: `cd cosmo-agents-frontend && pnpm build`
  - **Acceptance**: Zero build errors in both repos

- [ ] T018 [P] Run quickstart.md validation steps for each bug
  - Follow verification steps from `specs/003-fix-outreach-bugs/quickstart.md` for each bug
  - **Acceptance**: All 5 bugs verified as fixed per quickstart guide

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (US2: Draft Name)     ← No dependencies, start immediately
Phase 2 (US3: Timeout)        ← No dependencies, can run parallel with Phase 1
Phase 3 (US1: Auto No-Reply)  ← No dependencies, can run parallel with Phase 1-2
Phase 4 (US4: Stage Filter)   ← No dependencies, can run parallel
Phase 5 (US5: Meeting Time)   ← T013 (backend) blocks T015-T016 (frontend)
Phase 6 (Polish)               ← All phases complete
```

### Parallel Execution Opportunities

**Maximum parallelism** (4 tracks):
- Track A: T001 → T002 → T003 (US2 Draft Name - Backend)
- Track B: T004 (US3 Timeout - Backend) + T007 → T008 → T009 (US1 No-Reply - Backend)
- Track C: T005 → T006 (US3 Timeout - Frontend) + T010 → T011 → T012 (US4 Filter - Frontend)
- Track D: T013 (US5 Backend) + T014 (US5 Utility) → T015 → T016 (US5 Integration)

### Within-Phase Dependencies

| Task | Depends On | Reason |
|------|------------|--------|
| T002 | T001 | Same file (outreach_service.go), sequential edits |
| T003 | T002 | Needs post-processing in place first |
| T006 | T005 | Same component area, test after API timeout set |
| T008 | T007 | Needs NoReplyHours config |
| T009 | T008 | Needs state machine change |
| T011 | T010 | Needs debug findings |
| T012 | T010 | Needs debug findings |
| T015 | T013 | Backend endpoint must exist |
| T016 | T014, T015 | Needs utility + API client |

## Implementation Strategy

### MVP (Minimum Viable Product)

**Phase 1 (US2)**: Fix draft name placeholder — simplest fix, highest user-visible impact.

### Incremental Delivery

1. **P1 bugs first** (Phases 1-3): US2 → US3 → US1 — all backend-heavy, can be deployed together
2. **P2 bugs second** (Phases 4-5): US4 → US5 — frontend-heavy, can be deployed together
3. **Polish** (Phase 6): Build verification and end-to-end validation

### Total: 18 tasks across 6 phases
- Phase 1 (US2): 3 tasks — Backend only
- Phase 2 (US3): 3 tasks — Backend + Frontend
- Phase 3 (US1): 3 tasks — Backend only
- Phase 4 (US4): 3 tasks — Frontend only
- Phase 5 (US5): 4 tasks — Backend + Frontend
- Phase 6 (Polish): 2 tasks — Cross-cutting
