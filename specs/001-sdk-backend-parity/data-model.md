# Data Model: SDK-Backend API Parity

**Feature**: 001-sdk-backend-parity
**Date**: 2026-02-03

## Type Definitions

### Language Type

```typescript
/**
 * Supported languages for AI generation
 */
type Language = 'en' | 'vi';
```

### Outreach State Types

```typescript
/**
 * Contact's position in the outreach state machine
 */
type ConversationState = 'COLD' | 'NO_REPLY' | 'REPLIED' | 'POST_MEETING' | 'DROPPED';

/**
 * Recommended next action for the contact
 */
type NextStep =
  | 'SEND'              // Send initial message
  | 'FOLLOW_UP_1'       // Follow-up #1 (Day 4-5)
  | 'FOLLOW_UP_2'       // Follow-up #2 (Day 9-12)
  | 'SET_MEETING'       // Propose meeting
  | 'FOLLOW_UP_MEETING_1' // Meeting confirmation follow-up #1
  | 'FOLLOW_UP_MEETING_2' // Meeting confirmation follow-up #2
  | 'PREPARE_MEETING'   // Prepare meeting materials
  | 'WAIT'              // Wait for response
  | 'FOLLOW_UP'         // Post-meeting follow-up
  | 'DROP';             // Drop contact

/**
 * Draft generation scenario
 */
type OutreachScenario =
  | 'role_based'
  | 'industry_based'
  | 'no_reply_followup'
  | 'post_reply'
  | 'post_meeting'
  | 're_engage';

/**
 * Context richness level
 */
type ContextLevel = 'LOW' | 'MEDIUM' | 'HIGH';
```

### Outreach State Entity

```typescript
/**
 * Current outreach state for a contact
 */
interface OutreachState {
  id: string;
  user_id: string;
  contact_id: string;
  conversation_state: ConversationState;
  context_level: ContextLevel;
  outreach_intent: 'INTRO' | 'FOLLOW_UP' | 'RE_ENGAGE' | 'POST_MEETING';
  scenario: OutreachScenario;
  message_draft?: string;
  last_outcome: 'none' | 'sent' | 'no_reply' | 'replied' | 'meeting_booked' | 'meeting_done' | 'dropped';
  next_step: NextStep;
  last_interaction_at?: string;
  days_since_last_interaction: number;
  followup_count: number;
  max_followups: number;
  created_at: string;
  updated_at: string;
}
```

### Draft Generation Types

```typescript
/**
 * Response from draft generation
 */
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

### Interaction Types

```typescript
/**
 * Communication channel
 */
type InteractionChannel = 'LinkedIn' | 'Email' | 'Call' | 'Meeting' | 'Note';

/**
 * Message direction
 */
type Direction = 'outgoing' | 'incoming' | 'internal';

/**
 * Sentiment analysis result
 */
type Sentiment = 'positive' | 'neutral' | 'negative';

/**
 * Conversation history entry
 */
interface InteractionLog {
  id: string;
  user_id: string;
  contact_id: string;
  channel: InteractionChannel;
  direction: Direction;
  content: string;
  subject?: string;
  url?: string;
  attachments?: unknown[];
  sentiment?: Sentiment;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input for adding interaction
 */
interface AddInteractionInput {
  content: string;
  role: 'me' | 'client';  // me=outgoing, client=incoming
  channel?: InteractionChannel;
  sentiment?: Sentiment;
}
```

### Meeting Types

```typescript
/**
 * Meeting status
 */
type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

/**
 * Meeting entity
 */
interface Meeting {
  id: string;
  user_id: string;
  contact_id: string;
  title?: string;
  time: string;
  duration_minutes: number;
  channel: string;
  location?: string;
  meeting_url?: string;
  status: MeetingStatus;
  note?: string;
  outcome?: string;
  next_steps?: string;
  meeting_content?: string;
  meeting_prep?: string;  // AI-generated prep document
  participants?: unknown[];
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating meeting
 */
interface CreateMeetingInput {
  contact_id: string;
  title?: string;
  time: string;
  duration_minutes?: number;
  channel?: string;
  location?: string;
  meeting_url?: string;
  note?: string;
}

/**
 * Input for updating meeting
 */
interface UpdateMeetingInput {
  status?: MeetingStatus;
  note?: string;
  outcome?: string;
  next_steps?: string;
  meeting_content?: string;
}
```

### Suggestion Types

```typescript
/**
 * Contact summary for suggestions
 */
interface ContactSummary {
  id: string;
  name?: string;
  email?: string;
  company?: string;
  job_title?: string;
  linkedin_url?: string;
}

/**
 * Outreach suggestion
 */
interface OutreachSuggestion {
  contact: ContactSummary;
  state?: OutreachState;
  type: 'cold' | 'followup';
  next_step: NextStep;
  days_since: number;
  message_draft?: string;
}
```

## Method Signatures

### API Client Methods (to be updated/added)

```typescript
class CosmoApiClient {
  // UPDATED: Add language parameter
  async generateOutreachDraft(
    contactId: string,
    language: Language = 'vi'
  ): Promise<GenerateDraftResponse>;

  // NEW: Meeting prep generation
  async generateMeetingPrep(
    meetingId: string,
    language: Language = 'vi'
  ): Promise<Meeting>;

  // Existing methods (unchanged)
  async suggestOutreach(type: string, limit?: number): Promise<OutreachSuggestion[]>;
  async updateOutreach(input: UpdateOutreachInput): Promise<UpdateOutreachResponse>;
  async getOutreachState(contactId: string): Promise<OutreachState>;
  async getInteractionHistory(contactId: string, limit?: number): Promise<InteractionLog[]>;
  async addInteraction(contactId: string, input: AddInteractionInput): Promise<InteractionLog>;
  async createMeeting(input: CreateMeetingInput): Promise<Meeting>;
  async updateMeeting(meetingId: string, input: UpdateMeetingInput): Promise<Meeting>;
  async getMeetings(contactId: string): Promise<Meeting[]>;
  async deleteMeeting(meetingId: string): Promise<void>;
  async addNote(contactId: string, content: string): Promise<InteractionLog>;
  async getNotes(contactId: string, limit?: number): Promise<InteractionLog[]>;
  async updateNote(contactId: string, noteId: string, content: string): Promise<InteractionLog>;
  async deleteNote(contactId: string, noteId: string): Promise<void>;
}
```

## State Machine

```
                    ┌─────────┐
                    │  COLD   │
                    └────┬────┘
                         │ sent
                         ▼
                    ┌─────────┐
            ┌──────►│NO_REPLY │◄──────┐
            │       └────┬────┘       │
            │            │            │
      no_reply     replied      drop
            │            │            │
            │            ▼            │
            │       ┌─────────┐       │
            │       │ REPLIED │       │
            │       └────┬────┘       │
            │            │            │
            │     meeting_booked      │
            │            │            │
            │            ▼            │
            │       ┌─────────┐       │
            │       │POST_MTG │       │
            │       └────┬────┘       │
            │            │            │
            │           drop          │
            │            │            │
            └────────────┼────────────┘
                         ▼
                    ┌─────────┐
                    │ DROPPED │
                    └─────────┘
```

## Validation Rules

| Field | Rule |
|-------|------|
| `language` | Must be 'en' or 'vi', defaults to 'vi' |
| `meeting_id` for prep | Meeting must be in 'scheduled' status |
| `contact_id` | Must be valid UUID |
| `channel` | Must be one of: LinkedIn, Email, Call, Meeting, Note |
| `sentiment` | Must be one of: positive, neutral, negative |
