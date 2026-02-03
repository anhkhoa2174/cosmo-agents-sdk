# Feature Specification: SDK-Backend API Parity

**Feature Branch**: `001-sdk-backend-parity`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "Enable SDK users to do everything that the frontend allows users to do - generating message drafts, which contacts to follow up 1st/2nd, which contacts to outreach today, generate meeting prep, manage conversations, etc."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - AI-Powered Message Draft Generation (Priority: P1)

Sales reps need to generate personalized outreach messages through the SDK, with support for multiple languages (English/Vietnamese), based on contact information, conversation history, and current outreach state.

**Why this priority**: This is the core value proposition - AI-assisted message generation that saves time and improves outreach quality. The frontend prominently features this capability.

**Independent Test**: Can be fully tested by generating drafts for contacts in different states (COLD, NO_REPLY, REPLIED) and verifying appropriate content is generated based on context.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client and contact ID, **When** developer calls `generateDraft(contactId)`, **Then** AI-generated message draft is returned with scenario and context level
2. **Given** contact in NO_REPLY state, **When** developer calls `generateDraft(contactId, 'en')`, **Then** English follow-up message is generated referencing previous outreach
3. **Given** contact in REPLIED state, **When** developer calls `generateDraft(contactId, 'vi')`, **Then** Vietnamese message proposing meeting is generated
4. **Given** draft generation request, **When** AI generates content, **Then** draft includes appropriate tone, call-to-action, and references conversation history

---

### User Story 2 - Smart Outreach Suggestions (Priority: P1)

Sales reps need to see which contacts require attention today - who needs initial outreach, who needs follow-up #1 (Day 4-5), who needs follow-up #2 (Day 9-12), sorted by priority.

**Why this priority**: This drives daily sales workflow efficiency. The frontend dashboard shows suggested contacts prominently.

**Independent Test**: Can be tested by querying suggestions and verifying contacts are correctly categorized and prioritized based on their outreach state and timing.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `suggestOutreach('cold', 10)`, **Then** list of cold contacts needing initial outreach is returned
2. **Given** authenticated SDK client, **When** developer calls `suggestOutreach('followup', 10)`, **Then** list of contacts needing follow-up (sorted by urgency) is returned
3. **Given** contact sent message 4 days ago with no reply, **When** suggestions are fetched, **Then** contact appears with `next_step: FOLLOW_UP_1`
4. **Given** contact sent follow-up 5 days ago with no reply, **When** suggestions are fetched, **Then** contact appears with `next_step: FOLLOW_UP_2`
5. **Given** suggestions query, **When** results returned, **Then** each suggestion includes days_since, next_step, and optional pre-generated draft

---

### User Story 3 - Outreach State Management (Priority: P1)

Sales reps need to track and update the outreach state machine as they interact with contacts - marking messages as sent, recording replies, booking meetings, and handling the full outreach lifecycle.

**Why this priority**: State management drives the follow-up logic and suggestion engine. Frontend buttons trigger these state transitions.

**Independent Test**: Can be tested by triggering each state transition and verifying the outreach state machine progresses correctly.

**Acceptance Scenarios**:

1. **Given** contact in COLD state, **When** developer calls `updateOutreach(contactId, 'sent')`, **Then** state transitions to NO_REPLY with next_step WAIT
2. **Given** contact in NO_REPLY state after 4+ days, **When** developer calls `getOutreachState(contactId)`, **Then** next_step is FOLLOW_UP_1
3. **Given** contact in NO_REPLY state, **When** developer calls `updateOutreach(contactId, 'replied')`, **Then** state transitions to REPLIED with next_step SET_MEETING
4. **Given** contact in REPLIED state, **When** developer calls `updateOutreach(contactId, 'meeting_booked')`, **Then** meeting confirmation flow is initiated
5. **Given** contact in any state, **When** developer calls `updateOutreach(contactId, 'drop')`, **Then** state transitions to DROPPED

---

### User Story 4 - Meeting Prep Generation (Priority: P1)

Sales reps need AI-generated meeting preparation documents before scheduled meetings - including talking points, discovery questions, potential objections, and suggested next steps.

**Why this priority**: Meeting prep is a premium feature that differentiates the platform. Frontend has dedicated "Generate Meeting Prep" button.

**Independent Test**: Can be tested by creating a meeting and generating prep, verifying comprehensive preparation document is returned.

**Acceptance Scenarios**:

1. **Given** scheduled meeting, **When** developer calls `generateMeetingPrep(meetingId, 'en')`, **Then** English meeting prep document is generated
2. **Given** scheduled meeting, **When** developer calls `generateMeetingPrep(meetingId, 'vi')`, **Then** Vietnamese meeting prep document is generated
3. **Given** meeting with rich conversation history, **When** prep is generated, **Then** discovery questions reference previous discussions
4. **Given** meeting prep generated, **Then** document includes: meeting objectives, talking points, discovery questions, potential objections, suggested next steps

---

### User Story 5 - Conversation History Management (Priority: P1)

Sales reps need to view and add to conversation history - logging outgoing messages, incoming replies, and internal team notes that provide context for AI generation.

**Why this priority**: Conversation history is the foundation for AI personalization. Frontend shows full interaction timeline.

**Independent Test**: Can be tested by adding interactions and notes, then verifying they appear in history and influence draft generation.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `getInteractionHistory(contactId, 20)`, **Then** chronological list of interactions is returned
2. **Given** new outgoing message, **When** developer calls `addInteraction(contactId, {content, role: 'me', channel: 'LinkedIn'})`, **Then** interaction is logged
3. **Given** incoming reply, **When** developer calls `addInteraction(contactId, {content, role: 'client', sentiment: 'positive'})`, **Then** reply is logged with sentiment
4. **Given** internal team context, **When** developer calls `addNote(contactId, content)`, **Then** note is saved for team visibility
5. **Given** notes exist, **When** draft is generated, **Then** AI incorporates note context into personalization

---

### User Story 6 - Meeting Management (Priority: P2)

Sales reps need to create, update, and track meetings with contacts - including scheduling, status updates, and recording meeting outcomes.

**Why this priority**: Meetings are key conversion events in the sales funnel. Frontend has dedicated meeting scheduling UI.

**Independent Test**: Can be tested by creating meetings, updating status, and recording outcomes.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `createMeeting({contact_id, title, time, duration, channel})`, **Then** meeting is created with scheduled status
2. **Given** existing meeting, **When** developer calls `updateMeeting(meetingId, {status: 'completed', outcome})`, **Then** meeting is updated
3. **Given** contact ID, **When** developer calls `getMeetings(contactId)`, **Then** all meetings for contact are returned
4. **Given** completed meeting, **When** developer calls `updateMeeting(meetingId, {meeting_content})`, **Then** meeting notes/transcript is saved

---

### User Story 7 - Contact Notes System (Priority: P2)

Sales reps need to manage internal notes for contacts that serve as team knowledge and AI context - creating, reading, updating, and deleting notes.

**Why this priority**: Notes are critical for team collaboration and AI personalization. Frontend has notes panel in contact details.

**Independent Test**: Can be tested by CRUD operations on notes and verifying they appear in context.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `addNote(contactId, content)`, **Then** note is created with timestamp
2. **Given** existing notes, **When** developer calls `getNotes(contactId, 50)`, **Then** notes are returned in chronological order
3. **Given** existing note, **When** developer calls `updateNote(contactId, noteId, newContent)`, **Then** note content is updated
4. **Given** existing note, **When** developer calls `deleteNote(contactId, noteId)`, **Then** note is removed

---

### User Story 8 - Campaign Management (Priority: P2)

Developers need to manage outreach campaigns programmatically - creating campaigns, assigning contacts, and generating campaign templates.

**Why this priority**: Campaigns enable scaled outreach. Frontend has campaign builder.

**Independent Test**: Can be tested by creating a campaign, adding contacts, and generating templates.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `createCampaign(data)`, **Then** campaign is created
2. **Given** existing campaign, **When** developer calls `generateCampaignTemplates(campaignId)`, **Then** AI templates are generated
3. **Given** existing campaign, **When** developer calls `searchCampaigns(filter)`, **Then** filtered campaigns are returned

---

### User Story 9 - Agent and Template Management (Priority: P3)

Developers need to create and manage AI agents and message templates for automated workflows.

**Why this priority**: Agents and templates support automation. Frontend has agent configuration screens.

**Independent Test**: Can be tested by creating agents and templates, then using them in outreach.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `createAgent(config)`, **Then** agent is created
2. **Given** authenticated SDK client, **When** developer calls `createTemplate(data)`, **Then** template is created
3. **Given** existing agent, **When** developer calls `getAgent(agentId)`, **Then** full configuration is returned

---

### Edge Cases

- What happens when generating draft for contact with no context?
  - SDK returns generic role/industry-based draft with LOW context level
- How does system handle follow-up timing edge cases?
  - Day 4-5: FOLLOW_UP_1, Day 9-12: FOLLOW_UP_2, beyond: consider DROP
- What happens when meeting prep is requested for non-scheduled meeting?
  - SDK returns error - prep only available for scheduled meetings
- How does system handle language parameter for unsupported languages?
  - SDK defaults to Vietnamese ('vi') if language not recognized
- What happens when conversation history is empty?
  - AI generates context-appropriate message using contact profile only

## Requirements *(mandatory)*

### Functional Requirements

**Core Outreach Features:**
- **FR-001**: SDK MUST provide `generateDraft(contactId, language?)` method returning AI-generated message draft
- **FR-002**: SDK MUST support both English ('en') and Vietnamese ('vi') for draft generation
- **FR-003**: SDK MUST provide `suggestOutreach(type, limit)` method returning prioritized contact suggestions
- **FR-004**: SDK MUST return contacts categorized by next_step: SEND, FOLLOW_UP_1, FOLLOW_UP_2, SET_MEETING, etc.
- **FR-005**: SDK MUST include days_since_last_interaction in suggestion results

**Outreach State Management:**
- **FR-006**: SDK MUST provide `getOutreachState(contactId)` method returning current state machine position
- **FR-007**: SDK MUST provide `updateOutreach(contactId, event, options?)` method for state transitions
- **FR-008**: SDK MUST support all events: sent, replied, no_reply, meeting_booked, meeting_confirmed, no_confirmation, meeting_done, drop
- **FR-009**: SDK MUST track followup_count and enforce max_followups limit

**Meeting Prep:**
- **FR-010**: SDK MUST provide `generateMeetingPrep(meetingId, language?)` method for AI meeting preparation
- **FR-011**: SDK MUST include meeting objectives, talking points, discovery questions, objections, and next steps in prep
- **FR-012**: Meeting prep MUST incorporate conversation history and contact context

**Conversation History:**
- **FR-013**: SDK MUST provide `getInteractionHistory(contactId, limit)` method
- **FR-014**: SDK MUST provide `addInteraction(contactId, input)` method for logging messages
- **FR-015**: SDK MUST support interaction roles: 'me' (outgoing), 'client' (incoming)
- **FR-016**: SDK MUST support channels: LinkedIn, Email, Call, Meeting, Note
- **FR-017**: SDK MUST support sentiment tracking: positive, neutral, negative

**Notes Management:**
- **FR-018**: SDK MUST provide `addNote(contactId, content)` method
- **FR-019**: SDK MUST provide `getNotes(contactId, limit)` method
- **FR-020**: SDK MUST provide `updateNote(contactId, noteId, content)` method
- **FR-021**: SDK MUST provide `deleteNote(contactId, noteId)` method

**Meeting Management:**
- **FR-022**: SDK MUST provide `createMeeting(input)` method with contact_id, title, time, duration, channel
- **FR-023**: SDK MUST provide `updateMeeting(meetingId, input)` method for status/outcome updates
- **FR-024**: SDK MUST provide `getMeetings(contactId)` method
- **FR-025**: SDK MUST provide `deleteMeeting(meetingId)` method
- **FR-026**: SDK MUST support meeting statuses: scheduled, completed, cancelled, no_show

**Campaign Management:**
- **FR-027**: SDK MUST provide methods for campaign CRUD operations
- **FR-028**: SDK MUST provide `generateCampaignTemplates(campaignId)` method

**Agent and Template Management:**
- **FR-029**: SDK MUST provide methods for agent CRUD operations
- **FR-030**: SDK MUST provide methods for template CRUD operations

### Key Entities

- **OutreachState**: Current position in outreach state machine (COLD, NO_REPLY, REPLIED, POST_MEETING, DROPPED)
- **NextStep**: Recommended action (SEND, FOLLOW_UP_1, FOLLOW_UP_2, SET_MEETING, PREPARE_MEETING, WAIT, DROP)
- **Draft**: AI-generated message with scenario, context_level, and language
- **InteractionLog**: Conversation history entry with channel, direction, content, sentiment
- **Meeting**: Scheduled meeting with status, prep document, and outcome
- **Note**: Internal team note for context and collaboration
- **Suggestion**: Prioritized outreach recommendation with contact, state, and days_since

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: SDK users can generate drafts in under 3 seconds per request
- **SC-002**: 100% of frontend outreach features have corresponding SDK methods
- **SC-003**: Suggested contacts accurately reflect state machine timing (Day 4-5 for FU#1, Day 9-12 for FU#2)
- **SC-004**: Meeting prep generation includes all 5 required sections (objectives, talking points, questions, objections, next steps)
- **SC-005**: All SDK methods support both English and Vietnamese where applicable
- **SC-006**: Conversation history correctly influences draft personalization
- **SC-007**: State machine transitions match frontend behavior exactly
- **SC-008**: Zero breaking changes to existing SDK public interface

### Assumptions

- Language defaults to Vietnamese ('vi') when not specified
- Follow-up timing: Day 4-5 for first follow-up, Day 9-12 for second follow-up
- Maximum 2 follow-ups before contact is considered for drop
- Meeting prep only available for scheduled (not completed/cancelled) meetings
- Notes are visible to all team members in the same organization

### Previous work

### Related Features

- **001-tools-integration**: Initial SDK tools integration - provides foundation patterns
- **1-configurable-agent-system**: Configurable agent system - establishes agent architecture
