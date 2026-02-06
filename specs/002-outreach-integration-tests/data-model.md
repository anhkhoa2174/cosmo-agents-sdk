# Data Model: SDK Outreach Integration Tests

**Feature**: 002-outreach-integration-tests
**Date**: 2026-02-05

## Test Entities

### TestConfig

Environment configuration loaded from `.env.test` or environment variables.

```typescript
interface TestConfig {
  cosmoBaseUrl: string;     // COSMO_BASE_URL - backend API URL
  cosmoApiKey: string;      // COSMO_API_KEY - JWT auth token
  testContactId: string;    // TEST_CONTACT_ID - existing contact for draft tests
}
```

### TestFixtures

Shared test data created during setup and cleaned up after tests.

```typescript
interface TestFixtures {
  contactId: string;        // Existing contact ID for draft tests
  meetingId: string;        // Created meeting ID for prep tests
  completedMeetingId?: string;  // Meeting marked as completed (for error tests)
}
```

### LanguageAssertions

Helper utilities for language verification.

```typescript
interface LanguageAssertions {
  isVietnamese(text: string): boolean;  // Check for Vietnamese characters
  isEnglish(text: string): boolean;     // Check for English-only (no Vietnamese chars)
  hasContent(text: string): boolean;    // Check non-empty, meaningful content
}
```

## Relationships

```
TestConfig
  └──> CosmoApiClient (authenticated SDK client)
         ├──> generateOutreachDraft(contactId, language?)
         │     └──> GenerateDraftResponse { draft, scenario, state, context_level }
         ├──> generateMeetingPrep(meetingId, language?)
         │     └──> Meeting { meeting_prep }
         ├──> createMeeting(input)
         │     └──> Meeting { id, status: 'scheduled' }
         └──> updateMeeting(id, { status })
               └──> Meeting { status: 'completed' }
```

## State Transitions (Test Scenarios)

```
Meeting States:
  scheduled ──[generateMeetingPrep]--> scheduled (prep field populated)
  completed ──[generateMeetingPrep]--> ERROR (not allowed)
  cancelled ──[generateMeetingPrep]--> ERROR (not allowed)
  non-existent ──[generateMeetingPrep]--> 404 ERROR
```
