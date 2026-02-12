# Feature Specification: Fix Outreach Bugs

**Feature Branch**: `003-fix-outreach-bugs`
**Created**: 2026-02-06
**Status**: Draft
**Input**: User description: "Fix 5 outreach bugs: auto no-reply after 8 hours, filter errors for meeting stages, meeting prep timeout, draft name placeholder [Tên bạn], meeting time suggestion with overlap handling"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Auto No-Reply Status After 8 Hours (Priority: P1)

After a sales rep sends a message to a contact, the system should automatically update the contact's outreach status to "No Reply" if 8 hours pass without a response. Currently the system only has day-based transitions (4-5 days for follow-ups) but no short-term automatic status change after sending.

**Why this priority**: Without this automation, sales reps must manually track which contacts haven't replied. This is the most impactful workflow improvement as it drives the entire follow-up suggestion engine.

**Independent Test**: Send a message to a test contact, wait 8 hours (or simulate time), verify status automatically changes to NO_REPLY.

**Acceptance Scenarios**:

1. **Given** a contact in COLD state and the user sends an outreach message, **When** 8 hours pass without a reply, **Then** the system automatically updates the contact's status to NO_REPLY
2. **Given** a contact whose message was sent 8+ hours ago, **When** the background worker runs, **Then** the contact appears in the "needs follow-up" list
3. **Given** a contact in NO_REPLY state after auto-transition, **When** the contact replies within the same day, **Then** the status updates to REPLIED normally

---

### User Story 2 - Fix Draft Message Name Placeholder (Priority: P1)

When generating outreach draft messages, the system sometimes inserts "[Tên bạn]" (literally "Your Name") instead of the sales rep's actual name. The user's real name should appear in the draft signature. Currently the user name is passed to the service but the AI prompt does not include an instruction to use it in the signature.

**Why this priority**: This directly impacts message quality. Sending a message with "[Tên bạn]" looks unprofessional and erodes trust with contacts.

**Independent Test**: Generate a draft for any contact and verify the user's real name (not a placeholder) appears in the signature.

**Acceptance Scenarios**:

1. **Given** a user with display name "Nguyen Van A" generates a draft, **When** the AI creates the message, **Then** the signature includes "Nguyen Van A" instead of "[Tên bạn]"
2. **Given** a user with display name set, **When** generating an English draft, **Then** the signature includes the user's real name
3. **Given** a user with no display name (only email), **When** generating a draft, **Then** the system uses the email as fallback in the signature

---

### User Story 3 - Meeting Prep Timeout Increase (Priority: P1)

Meeting prep generation sometimes takes longer than expected for contacts with rich conversation history, causing the request to timeout or hang indefinitely. The system needs a longer timeout and proper loading feedback.

**Why this priority**: Failed meeting prep generation wastes sales reps' time and blocks pre-meeting preparation workflow.

**Independent Test**: Generate meeting prep for a contact with extensive conversation history, verify it completes within the allowed time or shows a clear timeout message.

**Acceptance Scenarios**:

1. **Given** a scheduled meeting with a contact that has extensive history, **When** generating meeting prep, **Then** the system allows sufficient time (up to 2 minutes) for AI generation
2. **Given** a meeting prep generation that exceeds the timeout, **When** the timeout is reached, **Then** the user receives a clear error message suggesting to retry
3. **Given** meeting prep generation in progress, **When** the user is waiting, **Then** a loading indicator shows the generation is ongoing

---

### User Story 4 - Fix Stage Filter Errors (Priority: P2)

The outreach filter feature for stages like "Set Meeting", "Meeting Booked", and related meeting stages is producing errors. Users cannot filter contacts by these meeting-related stages correctly.

**Why this priority**: Filtering is important for workflow management but the core outreach flow can work without it temporarily.

**Independent Test**: Select each meeting-related stage filter and verify the contact list updates correctly without errors.

**Acceptance Scenarios**:

1. **Given** the outreach dashboard with contacts in various stages, **When** user selects "Set Meeting" filter, **Then** only contacts with next_step SET_MEETING are shown
2. **Given** the outreach dashboard, **When** user selects "Confirm #1" or "Confirm #2" filter, **Then** only contacts with matching meeting confirmation stages are shown
3. **Given** the outreach dashboard, **When** user selects "Prepare Meeting" filter, **Then** only contacts with next_step PREPARE_MEETING are shown
4. **Given** any stage filter selected, **When** no contacts match that stage, **Then** an empty state message is shown (not an error)

---

### User Story 5 - Smart Meeting Time Suggestion (Priority: P2)

When creating a meeting, the system should suggest a default time 2 days from the current date. If the suggested time overlaps with an already-booked meeting, the system should automatically shift the suggested time by 1 hour until a free slot is found.

**Why this priority**: Saves time in meeting scheduling but is a convenience feature, not a blocker.

**Independent Test**: Create a meeting and verify the default suggested time is 2 days ahead. Create another meeting at the same time and verify the suggestion shifts by 1 hour.

**Acceptance Scenarios**:

1. **Given** the meeting creation form, **When** the user opens it, **Then** the default meeting time is pre-filled with 2 days from now at a reasonable business hour (e.g., 10:00 AM)
2. **Given** a meeting already booked at 10:00 AM two days from now, **When** the user opens the meeting creation form for another contact, **Then** the suggested time shifts to 11:00 AM
3. **Given** multiple meetings already booked at consecutive hours, **When** the user opens the meeting creation form, **Then** the suggested time finds the next available 1-hour slot
4. **Given** no existing meetings, **When** the user opens the meeting creation form, **Then** the suggested time defaults to 2 days from now at 10:00 AM

---

### Edge Cases

- What happens if a contact replies exactly at the 8-hour mark?
  - The reply takes precedence; status changes to REPLIED, not NO_REPLY
- What happens if the user has no display name AND no email?
  - Use a generic professional sign-off without a name
- What if all business hours are booked for the suggested meeting day?
  - Shift to the next business day at 10:00 AM
- What happens if meeting prep timeout occurs mid-generation?
  - Show error message with retry button; previous partial generation is discarded
- What happens if the worker crashes during status update?
  - The next worker run picks up missed contacts; no status is permanently stuck

## Requirements *(mandatory)*

### Functional Requirements

**Auto No-Reply (US1):**
- **FR-001**: System MUST automatically transition contact status from COLD/SENT to NO_REPLY after 8 hours without a reply
- **FR-002**: The background worker MUST check for contacts needing NO_REPLY transition on each run cycle
- **FR-003**: If a reply arrives after NO_REPLY auto-transition, the system MUST correctly update to REPLIED state

**Draft Name Fix (US2):**
- **FR-004**: Draft generation MUST include the user's display name in the message signature
- **FR-005**: The AI prompt MUST instruct the model to use the provided user name (not a placeholder) in the sign-off
- **FR-006**: If user has no display name, the system MUST use their email as fallback for the signature

**Meeting Prep Timeout (US3):**
- **FR-007**: Meeting prep generation MUST have a timeout of at least 120 seconds
- **FR-008**: If generation exceeds the timeout, the system MUST return a clear error message
- **FR-009**: The frontend MUST show a loading indicator during meeting prep generation

**Stage Filter Fix (US4):**
- **FR-010**: All meeting-related stage filters MUST correctly query the backend and return matching contacts
- **FR-011**: Stage filter MUST handle empty result sets gracefully (show empty state, not error)
- **FR-012**: Stage filter MUST support: SET_MEETING, FOLLOW_UP_MEETING_1, FOLLOW_UP_MEETING_2, PREPARE_MEETING

**Meeting Time Suggestion (US5):**
- **FR-013**: Default meeting time MUST be pre-filled at 2 days from current date, at 10:00 AM user's local time
- **FR-014**: System MUST check for overlapping meetings when suggesting times
- **FR-015**: If overlap detected, system MUST shift suggestion by 1 hour until a free slot is found
- **FR-016**: If no slot available on the suggested day, system MUST shift to the next business day

### Key Entities

- **Contact Outreach State**: Current position in outreach state machine with timestamps for each transition
- **Worker Task**: Background job that periodically checks and updates contact statuses
- **Meeting Slot**: A time window with overlap detection against existing meetings
- **Draft Context**: Container for AI prompt context including user name, contact info, and conversation history

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of contacts with no reply after 8 hours are automatically transitioned to NO_REPLY status
- **SC-002**: 0% of generated draft messages contain "[Tên bạn]" or any name placeholder
- **SC-003**: Meeting prep generation completes successfully for 95% of contacts within 2 minutes
- **SC-004**: All stage filters return correct results with zero errors
- **SC-005**: Meeting time suggestions are conflict-free in 100% of cases
- **SC-006**: Users can filter contacts by any stage without encountering errors

### Assumptions

- Business hours for meeting suggestions are 9:00 AM to 6:00 PM local time
- The 8-hour no-reply timer starts when the outreach message is marked as "sent" in the system
- The background worker runs at a frequency of at least once per hour
- User display name is available from the authentication/user profile system
- Meeting overlap detection only checks meetings for the same user, not the contact

### Previous work

### Related Features

- **001-sdk-backend-parity**: SDK outreach feature implementation with language support
- **Outreach state machine**: Existing state transitions (COLD, NO_REPLY, REPLIED, POST_MEETING, DROPPED)
- **RecalculateWorker**: Existing background worker for outreach state recalculation
