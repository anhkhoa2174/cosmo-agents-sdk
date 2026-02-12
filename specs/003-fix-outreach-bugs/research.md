# Research: Fix Outreach Bugs

**Feature**: 003-fix-outreach-bugs
**Date**: 2026-02-06

## Prior Work

- **001-sdk-backend-parity**: Added language support to `generateOutreachDraft` and `generateMeetingPrep` in SDK
- **002-outreach-integration-tests**: Integration test suite for SDK outreach features using Vitest
- **RecalculateWorker**: Background worker that recalculates `next_step` for contacts with `next_step = "WAIT"`
- **Outreach state machine**: Full state transitions (COLD, NO_REPLY, REPLIED, POST_MEETING, DROPPED) with next steps

---

## Bug 1: Auto No-Reply After 8 Hours

### Root Cause Analysis

**Current behavior**: The `DetermineConversationState()` in `outreach_service.go:131-302` transitions to NO_REPLY state when `lastOutgoing != nil && lastIncoming == nil`, but the follow-up timing uses **day-based granularity** (4-5 days for FOLLOW_UP_1). There is no 8-hour transition logic.

**State machine flow**:
1. Contact starts in COLD state with `next_step = SEND`
2. After sending message → `next_step = WAIT`
3. Worker picks up WAIT contacts and calls `DetermineConversationState()`
4. If `lastOutgoing != nil && lastIncoming == nil` → State = NO_REPLY
5. If `daysSinceLastInteraction < 4` → `next_step = WAIT` (stays waiting)
6. If `daysSinceLastInteraction >= 4` → `next_step = FOLLOW_UP_1`

**Problem**: Between steps 4 and 5, the state is technically NO_REPLY but `next_step` stays WAIT for 4 days. The spec requires transitioning `outreach_stage` to NO_REPLY after just 8 hours.

**Decision**: Add an 8-hour check in `DetermineConversationState()` that sets `outreach_stage = NO_REPLY` when hours since last outgoing message >= 8 and no incoming reply exists. This is separate from the follow-up timing.

**Rationale**: The 8-hour transition is about the **stage label** (what the UI shows), not the follow-up action. The contact should show as "No Reply" in the UI after 8 hours, while the follow-up suggestion still respects the 4-day minimum.

**Key files**:
- `cosmo-agents-backend/internal/service/outreach/outreach_service.go:131-302` - State determination
- `cosmo-agents-backend/internal/worker/outreach/recalculate_worker.go:97-181` - Worker loop
- `cosmo-agents-backend/internal/domain/outreach/outreach.go:44-53` - State constants
- Config: `FollowUp1MinDays=4, FollowUp2MinDays=4`

**Alternative considered**: Adding a separate 8-hour timer task. Rejected because modifying existing state machine is simpler and the worker already runs every minute.

---

## Bug 2: Draft Name Placeholder [Tên bạn]

### Root Cause Analysis

**Current flow**:
1. Handler extracts `user.Name` with email fallback (`handler.go:98-100`)
2. Service stores in `DraftContext.UserName` (`outreach_service.go:613`)
3. Prompt builder injects: `"Tên của bạn: {UserName}\n(Dùng tên này khi ký tên tin nhắn)"` (`outreach_service.go:1270`)
4. AI model is expected to use the name naturally in the signature

**Problem**: The system prompt (`outreach_service.go:1050-1115`) tells the AI to output "ONLY THE MESSAGE CONTENT" but does NOT explicitly instruct it to use the provided sender name for sign-off. The hint "(Dùng tên này khi ký tên tin nhắn)" is in the user prompt context, not in the system prompt. The AI sometimes ignores this and generates a placeholder "[Tên bạn]".

**Decision**: Strengthen the AI prompt in two ways:
1. Add explicit instruction in the system prompt: "ALWAYS sign the message with the sender's name provided in the context. NEVER use placeholders like [Tên bạn] or [Your Name]."
2. Add a post-processing step that replaces any remaining `[Tên bạn]` or `[Your Name]` patterns with the actual `DraftContext.UserName`

**Rationale**: Belt-and-suspenders approach. The system prompt change handles 95% of cases; the post-processing catches edge cases.

**Key files**:
- `cosmo-agents-backend/internal/service/outreach/outreach_service.go:1050-1115` - System prompts
- `cosmo-agents-backend/internal/service/outreach/outreach_service.go:1161-1359` - Prompt builder
- `cosmo-agents-backend/internal/service/outreach/outreach_service.go:1017-1046` - AI generation
- `cosmo-agents-backend/internal/handler/v1/outreach/handler.go:98-100` - userName extraction

**Alternative considered**: Only post-processing replacement. Rejected because fixing the prompt is the proper solution; post-processing is the safety net.

---

## Bug 3: Meeting Prep Timeout

### Root Cause Analysis

**Current behavior**: No timeout is configured at any layer:
- Fiber app has no `ReadTimeout`/`WriteTimeout` in config (`cmd/server/app.go:76-79`)
- Meeting prep handler passes `c.Context()` directly without timeout wrapper (`handler.go:355-386`)
- OpenAI client relies entirely on context timeout from caller (`pkg/ai/openai_client.go:52-102`)
- Frontend ky client has no timeout configured (`lib/ky.ts:38-82`)
- React Query mutation has no timeout (`contact-outreach.tsx:166-175`)

**Comparison**: Other handlers (Gmail, HubSpot) use `context.WithTimeout(c.Context(), 30*time.Second)`.

**Decision**: Multi-layer timeout fix:
1. **Backend handler**: Add `context.WithTimeout(c.Context(), 120*time.Second)` for meeting prep
2. **Frontend ky**: Add per-request timeout override for meeting prep: `timeout: 130_000` (130s, slightly longer than backend)
3. **Frontend UI**: Already has `isPending` spinner - add a text hint "This may take up to 2 minutes"

**Rationale**: 120 seconds matches spec requirement (FR-007). Backend timeout ensures resources are freed. Frontend timeout slightly longer to let backend return the error rather than aborting client-side.

**Key files**:
- Backend: `cosmo-agents-backend/internal/handler/v1/outreach/handler.go:355-386`
- Backend: `cosmo-agents-backend/internal/service/outreach/outreach_service.go:2451-2496`
- Frontend: `cosmo-agents-frontend/src/network/client/outreach.ts:298-303`
- Frontend: `cosmo-agents-frontend/src/components/contacts/contact-outreach.tsx:166-175`

**Alternative considered**: Global Fiber timeout. Rejected because meeting prep is uniquely long; other endpoints should stay fast.

---

## Bug 4: Stage Filter Errors

### Root Cause Analysis

**Current flow**:
1. Frontend sends `{next_step: "SET_MEETING"}` via POST `/v1/contacts/search`
2. Backend handler merges filter into `filterMap` (`search.go:27-181`)
3. Filter builder applies `WHERE next_step = 'SET_MEETING'` (`filter_repository.go:48-75`)
4. `isExactMatchField("next_step")` returns true (`contact_repository.go:374-381`)

**Finding**: The filter flow appears correct at the code level. All meeting stages (SET_MEETING, FOLLOW_UP_MEETING_1, FOLLOW_UP_MEETING_2, PREPARE_MEETING) are defined consistently in frontend TypeScript and backend Go constants.

**Potential issues identified**:
1. **No contacts in these stages**: The worker may not be transitioning contacts to meeting stages. `DetermineConversationState()` has meeting stage logic but it requires a meeting to be booked first.
2. **Empty result handling**: Frontend may not distinguish between "no matching contacts" and "API error"
3. **Case sensitivity**: Filter uses exact string match; any case mismatch would fail silently

**Decision**:
1. Investigate further during implementation to identify the exact error
2. Ensure frontend handles empty results gracefully (show "No contacts" message, not error)
3. Add logging to the search handler to trace filter application

**Key files**:
- Frontend: `cosmo-agents-frontend/src/app/(main)/outreach/page.tsx:427-444` - Filter dropdown
- Frontend: `cosmo-agents-frontend/src/app/(main)/outreach/page.tsx:156-168` - Filter API call
- Backend: `cosmo-agents-backend/internal/handler/v1/contact/search.go:27-181` - Search handler
- Backend: `cosmo-agents-backend/internal/repository/filter/filter_repository.go:32-75` - Filter builder

---

## Bug 5: Smart Meeting Time Suggestion

### Root Cause Analysis

**Current behavior**: Meeting creation dialog (`contact-outreach.tsx:395-471`) has a `datetime-local` input with NO default value. `meetingTime` state is initialized as empty string (`contact-outreach.tsx:74`).

**Available data**:
- `getMeetings(contactId)` fetches meetings for a specific contact
- Meeting model has `time: time.Time` and `duration_minutes: int`
- No endpoint to query ALL user meetings across contacts

**Decision**: Implement client-side time suggestion:
1. When dialog opens, calculate default time = 2 days from now at 10:00 AM local time
2. Fetch all user meetings (need new API endpoint or use existing data)
3. Check for overlaps: if `suggestedTime` falls within any existing meeting's time window, shift by 1 hour
4. Repeat overlap check until free slot found or business hours exhausted
5. If no slot on suggested day, shift to next business day

**Implementation approach**:
- **Frontend-driven**: Compute suggestion on client using existing meeting data
- Add a new API endpoint `GET /v1/outreach/meetings?status=scheduled` to fetch all user meetings (not just per-contact)
- Overlap detection logic runs in the frontend utility function

**Rationale**: Client-side suggestion is simpler and avoids backend changes. The overlap data (user's meetings) is small enough to fetch client-side.

**Key files**:
- Frontend: `cosmo-agents-frontend/src/components/contacts/contact-outreach.tsx:72-76` - Meeting state
- Frontend: `cosmo-agents-frontend/src/components/contacts/contact-outreach.tsx:395-471` - Meeting dialog
- Frontend: `cosmo-agents-frontend/src/network/client/outreach.ts:255-269` - Create meeting API
- Backend: `cosmo-agents-backend/internal/handler/v1/outreach/handler.go:411-432` - Get meetings handler
- Backend: `cosmo-agents-backend/internal/repository/outreach/outreach_repository.go:437-449` - Meeting repo

**Alternative considered**: Server-side suggestion endpoint. Rejected because the logic is simple (date math + overlap check) and all meeting data is already available client-side or via a simple query.

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 8-hour transition | Modify existing state machine | Worker already runs frequently; no new infrastructure needed |
| Name placeholder fix | System prompt + post-processing | Belt-and-suspenders reliability |
| Timeout approach | Per-handler context timeout | Precise control; other endpoints unaffected |
| Meeting time suggestion | Client-side computation | Simple logic; avoids new backend endpoint complexity |
| Stage filter fix | Debug + frontend error handling | Root cause needs runtime investigation |
