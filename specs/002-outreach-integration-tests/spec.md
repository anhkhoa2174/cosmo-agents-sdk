# Feature Specification: SDK Outreach Integration Tests

**Feature Branch**: `002-outreach-integration-tests`
**Created**: 2026-02-05
**Status**: Draft
**Input**: User description: "Create integration test suite for SDK outreach features. Tests should verify language support for draft generation and meeting prep, plus error handling for invalid meeting states."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Draft Generation Language Tests (Priority: P1)

Developers need automated tests to verify that the `generateOutreachDraft` method correctly generates drafts in both English and Vietnamese, and defaults to Vietnamese when no language is specified.

**Why this priority**: Language support is the core feature added in spec 001. Verifying this works correctly prevents production issues with AI-generated content in wrong language.

**Independent Test**: Can be fully tested by running test suite against a real contact with known data and verifying draft content language matches request.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client and valid contact ID, **When** developer calls `generateOutreachDraft(contactId, 'en')`, **Then** returned draft content is in English
2. **Given** authenticated SDK client and valid contact ID, **When** developer calls `generateOutreachDraft(contactId, 'vi')`, **Then** returned draft content is in Vietnamese
3. **Given** authenticated SDK client and valid contact ID, **When** developer calls `generateOutreachDraft(contactId)` without language parameter, **Then** returned draft content defaults to Vietnamese

---

### User Story 2 - Meeting Prep Language Tests (Priority: P1)

Developers need automated tests to verify that the `generateMeetingPrep` method correctly generates meeting preparation documents in both English and Vietnamese.

**Why this priority**: Meeting prep is a premium feature. Incorrect language output directly impacts user experience and professional appearance.

**Independent Test**: Can be fully tested by creating a test meeting, generating prep in each language, and verifying content language.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client and scheduled meeting, **When** developer calls `generateMeetingPrep(meetingId, 'en')`, **Then** returned meeting_prep content is in English
2. **Given** authenticated SDK client and scheduled meeting, **When** developer calls `generateMeetingPrep(meetingId, 'vi')`, **Then** returned meeting_prep content is in Vietnamese
3. **Given** authenticated SDK client and scheduled meeting, **When** developer calls `generateMeetingPrep(meetingId)` without language parameter, **Then** returned meeting_prep content defaults to Vietnamese

---

### User Story 3 - Meeting Prep Error Handling (Priority: P2)

Developers need automated tests to verify that the `generateMeetingPrep` method correctly handles error cases, such as generating prep for non-scheduled meetings.

**Why this priority**: Error handling ensures graceful degradation and clear error messages for developers integrating the SDK.

**Independent Test**: Can be fully tested by attempting to generate prep for meetings in various invalid states.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client and completed meeting, **When** developer calls `generateMeetingPrep(meetingId)`, **Then** appropriate error is returned
2. **Given** authenticated SDK client and cancelled meeting, **When** developer calls `generateMeetingPrep(meetingId)`, **Then** appropriate error is returned
3. **Given** authenticated SDK client and non-existent meeting ID, **When** developer calls `generateMeetingPrep(invalidId)`, **Then** 404 or appropriate error is returned

---

### User Story 4 - Test Infrastructure Setup (Priority: P1)

Developers need a properly configured test environment with test framework, test credentials management, and CI/CD integration.

**Why this priority**: Without test infrastructure, individual tests cannot run. This is foundational.

**Independent Test**: Can be verified by running `pnpm test` and seeing test runner output.

**Acceptance Scenarios**:

1. **Given** test framework configured, **When** developer runs `pnpm test`, **Then** test runner executes and reports results
2. **Given** test environment, **When** tests run, **Then** they use test credentials from environment variables
3. **Given** test suite, **When** a test fails, **Then** clear error message indicates what failed and why

---

### Edge Cases

- What happens when backend is unreachable during tests?
  - Tests should timeout with clear error message, not hang indefinitely
- What happens when test credentials are invalid or expired?
  - Tests should fail fast with authentication error, not proceed with 401 responses
- What happens when contact has no conversation history?
  - Draft generation should still work with minimal context (LOW context_level)
- How does system handle rate limiting during test execution?
  - Tests should include appropriate delays or retry logic

## Requirements *(mandatory)*

### Functional Requirements

**Test Framework:**
- **FR-001**: Test suite MUST use Vitest as the test framework
- **FR-002**: Tests MUST be runnable via `pnpm test` command
- **FR-003**: Test configuration MUST support environment variable injection for credentials

**Draft Generation Tests:**
- **FR-004**: Tests MUST verify `generateOutreachDraft` returns English content when `language='en'`
- **FR-005**: Tests MUST verify `generateOutreachDraft` returns Vietnamese content when `language='vi'`
- **FR-006**: Tests MUST verify `generateOutreachDraft` defaults to Vietnamese when language not specified
- **FR-007**: Tests MUST verify response includes `draft`, `scenario`, `state`, and `context_level` fields

**Meeting Prep Tests:**
- **FR-008**: Tests MUST verify `generateMeetingPrep` returns English content when `language='en'`
- **FR-009**: Tests MUST verify `generateMeetingPrep` returns Vietnamese content when `language='vi'`
- **FR-010**: Tests MUST verify `generateMeetingPrep` defaults to Vietnamese when language not specified
- **FR-011**: Tests MUST verify meeting prep includes 5 sections (objectives, talking points, questions, objections, next steps)
- **FR-012**: Tests MUST verify error handling for non-scheduled meetings

**Test Data Management:**
- **FR-013**: Tests MUST use real backend API with test credentials
- **FR-014**: Tests MUST create necessary test data (contacts, meetings) during setup
- **FR-015**: Tests MUST clean up test data after execution (or use dedicated test account)

**Reporting:**
- **FR-016**: Test results MUST include pass/fail status for each test case
- **FR-017**: Test output MUST show elapsed time for performance monitoring

### Key Entities

- **TestContact**: A contact created for testing with known attributes (name, email, company)
- **TestMeeting**: A meeting created for testing with scheduled status
- **TestCredentials**: API credentials for test environment (COSMO_API_KEY, COSMO_BASE_URL)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 6 core test cases pass consistently (100% pass rate)
- **SC-002**: Test suite completes execution in under 60 seconds
- **SC-003**: Tests can be run repeatedly without manual intervention
- **SC-004**: Test failures produce actionable error messages within 5 seconds
- **SC-005**: Test suite can detect language mismatch (English requested but Vietnamese returned, and vice versa)
- **SC-006**: Test coverage includes all new methods added in spec 001

### Assumptions

- Test environment has access to backend API (localhost or staging)
- Test credentials are provided via environment variables
- Backend API supports the same language parameter interface as SDK
- AI-generated content can be verified for language using simple heuristics (Vietnamese characters vs English-only characters)

### Previous work

### Related Features

- **001-sdk-backend-parity**: SDK implementation of outreach features with language support - this test suite validates that implementation
