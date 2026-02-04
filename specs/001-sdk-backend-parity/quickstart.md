# Quickstart: SDK Outreach Features

**Feature**: 001-sdk-backend-parity
**Date**: 2026-02-03

## Overview

This guide shows how to use the SDK's outreach features - generating AI-powered message drafts, getting outreach suggestions, managing conversation state, and generating meeting prep documents.

## Setup

```typescript
import { CosmoApiClient } from 'cosmo-agents-sdk';

const client = new CosmoApiClient({
  baseUrl: 'http://localhost:8081',
  apiKey: 'your-api-key',
});
```

## Feature 1: Generate Message Draft

Generate AI-powered outreach messages with language support.

### Basic Usage (Vietnamese - Default)

```typescript
// Generate draft in Vietnamese (default)
const draft = await client.generateOutreachDraft('contact-id');
console.log(draft.draft);
// Output: "Chào anh/chị [Name], Mình là [Your Name] từ [Company]..."
```

### English Mode

```typescript
// Generate draft in English
const englishDraft = await client.generateOutreachDraft('contact-id', 'en');
console.log(englishDraft.draft);
// Output: "Hi [Name], I'm [Your Name] from [Company]..."
```

### Response Structure

```typescript
interface GenerateDraftResponse {
  contact_id: string;
  draft: string;                    // The AI-generated message
  scenario: OutreachScenario;       // e.g., 'role_based', 'no_reply_followup'
  context_level: 'LOW' | 'MEDIUM' | 'HIGH';
  state: OutreachState;             // Current state machine position
  notes?: InteractionLog[];         // Team notes for context
}
```

## Feature 2: Get Outreach Suggestions

Find which contacts need attention today.

### Get Cold Outreach Contacts

```typescript
// Get contacts that need initial outreach
const coldContacts = await client.suggestOutreach('cold', 10);
for (const suggestion of coldContacts) {
  console.log(`${suggestion.contact.name} - ${suggestion.next_step}`);
}
```

### Get Follow-up Contacts

```typescript
// Get contacts needing follow-up (sorted by urgency)
const followups = await client.suggestOutreach('followup', 10);
for (const suggestion of followups) {
  console.log(`${suggestion.contact.name} - Day ${suggestion.days_since} - ${suggestion.next_step}`);
  // Output: "John Doe - Day 5 - FOLLOW_UP_1"
}
```

### Mixed (Both Cold and Follow-up)

```typescript
const mixed = await client.suggestOutreach('mixed', 20);
```

## Feature 3: Manage Outreach State

Track and update where contacts are in the outreach funnel.

### Get Current State

```typescript
const state = await client.getOutreachState('contact-id');
console.log(`State: ${state.conversation_state}`);
console.log(`Next Step: ${state.next_step}`);
console.log(`Days Since: ${state.days_since_last_interaction}`);
```

### Update State After Actions

```typescript
// Mark message as sent
await client.updateOutreach({
  contact_id: 'contact-id',
  event: 'sent',
  channel: 'LinkedIn'
});

// Record that contact replied
await client.updateOutreach({
  contact_id: 'contact-id',
  event: 'replied',
  sentiment: 'positive'
});

// Book a meeting
await client.updateOutreach({
  contact_id: 'contact-id',
  event: 'meeting_booked'
});

// Drop a contact
await client.updateOutreach({
  contact_id: 'contact-id',
  event: 'drop'
});
```

## Feature 4: Generate Meeting Prep

Create AI-generated preparation documents for scheduled meetings.

### Generate Prep (Vietnamese - Default)

```typescript
// First, create or get meeting
const meeting = await client.createMeeting({
  contact_id: 'contact-id',
  title: 'Discovery Call',
  time: '2026-02-04T10:00:00Z',
  duration_minutes: 30,
  channel: 'Zoom'
});

// Generate meeting prep in Vietnamese
const preparedMeeting = await client.generateMeetingPrep(meeting.id);
console.log(preparedMeeting.meeting_prep);
```

### Generate Prep in English

```typescript
const englishPrep = await client.generateMeetingPrep(meeting.id, 'en');
console.log(englishPrep.meeting_prep);
```

### Meeting Prep Content

The generated prep includes:
1. **Meeting Objectives** - 2-3 specific goals
2. **Talking Points** - 5-7 key discussion items
3. **Discovery Questions** - 7-10 targeted questions
4. **Potential Objections** - 3-5 objections with responses
5. **Suggested Next Steps** - Follow-up actions

## Feature 5: Conversation History

Log and retrieve all interactions with contacts.

### Add Outgoing Message

```typescript
await client.addInteraction('contact-id', {
  content: 'Hi John, following up on our previous conversation...',
  role: 'me',
  channel: 'LinkedIn'
});
```

### Add Incoming Reply

```typescript
await client.addInteraction('contact-id', {
  content: 'Thanks for reaching out! I would love to learn more.',
  role: 'client',
  channel: 'LinkedIn',
  sentiment: 'positive'
});
```

### Get History

```typescript
const history = await client.getInteractionHistory('contact-id', 20);
for (const interaction of history) {
  const direction = interaction.direction === 'outgoing' ? '→' : '←';
  console.log(`${direction} [${interaction.channel}] ${interaction.content}`);
}
```

## Feature 6: Team Notes

Manage internal notes that provide context for AI generation.

### Add Note

```typescript
await client.addNote('contact-id', 'Spoke with their CEO last week. Very interested in enterprise features.');
```

### Get Notes

```typescript
const notes = await client.getNotes('contact-id', 50);
for (const note of notes) {
  console.log(`[${note.timestamp}] ${note.content}`);
}
```

### Update Note

```typescript
await client.updateNote('contact-id', 'note-id', 'Updated: CEO confirmed budget approval.');
```

### Delete Note

```typescript
await client.deleteNote('contact-id', 'note-id');
```

## Complete Workflow Example

```typescript
import { CosmoApiClient } from 'cosmo-agents-sdk';

async function dailyOutreach() {
  const client = new CosmoApiClient({
    baseUrl: process.env.API_URL,
    apiKey: process.env.API_KEY,
  });

  // 1. Get today's suggestions
  const suggestions = await client.suggestOutreach('mixed', 20);

  for (const suggestion of suggestions) {
    const contactId = suggestion.contact.id;

    // 2. Generate personalized draft
    const draft = await client.generateOutreachDraft(contactId, 'en');
    console.log(`\n--- ${suggestion.contact.name} (${suggestion.next_step}) ---`);
    console.log(draft.draft);

    // 3. If you sent the message, update state
    // await client.updateOutreach({ contact_id: contactId, event: 'sent', channel: 'LinkedIn' });

    // 4. If meeting scheduled, create meeting and generate prep
    if (suggestion.next_step === 'SET_MEETING') {
      // const meeting = await client.createMeeting({ ... });
      // const prep = await client.generateMeetingPrep(meeting.id, 'en');
      // console.log(prep.meeting_prep);
    }
  }
}

dailyOutreach();
```

## CLI Usage

The SDK also provides CLI access to these features:

```bash
# Start interactive chat
pnpm cli chat

# In chat, use tools:
> suggest_outreach type=followup limit=10
> generate_outreach_draft contact_id=xxx language=en
> get_outreach_state contact_id=xxx
> update_outreach contact_id=xxx event=sent channel=LinkedIn
> create_meeting contact_id=xxx title="Call" time="2026-02-04T10:00:00Z" duration_minutes=30 channel=Zoom
> generate_meeting_prep meeting_id=yyy language=en
> add_note contact_id=xxx content="Interested in enterprise features"
> get_notes contact_id=xxx limit=10
```

## Error Handling

```typescript
try {
  const prep = await client.generateMeetingPrep('meeting-id', 'en');
} catch (error) {
  if (error.message.includes('scheduled')) {
    console.error('Meeting prep only works for scheduled meetings');
  }
  // Handle other errors
}
```
