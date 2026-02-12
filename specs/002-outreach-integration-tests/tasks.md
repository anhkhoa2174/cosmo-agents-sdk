# Tasks Index: SDK Outreach Integration Tests

Beads Issue Graph Index for the integration test suite feature implementation.

## Feature Tracking

* **Feature Branch**: `002-outreach-integration-tests`
* **User Stories Source**: `specs/002-outreach-integration-tests/spec.md`
* **Research Inputs**: `specs/002-outreach-integration-tests/research.md`
* **Planning Details**: `specs/002-outreach-integration-tests/plan.md`
* **Data Model**: `specs/002-outreach-integration-tests/data-model.md`

## Labels

| Label | Purpose |
|-------|---------|
| `spec:002-outreach-integration-tests` | All tasks in this feature |
| `phase:setup` | Test infrastructure setup |
| `phase:us1` | Draft language tests |
| `phase:us2` | Meeting prep language tests |
| `phase:us3` | Error handling tests |
| `phase:us4` | Test infra (merged into setup) |
| `component:test-infra` | Test framework and config |
| `component:test-helpers` | Shared test utilities |
| `component:test-integration` | Integration test files |

---

## Phase 1: Setup (Test Infrastructure) — US4

**Purpose**: Install Vitest, configure test environment, create shared helpers

### T001 - Install Vitest and add test scripts
**Priority**: P1 | **Labels**: `phase:setup`, `component:test-infra`
**File**: `package.json`

**Description**: Add Vitest as dev dependency and configure test scripts.

**Design**:
```bash
pnpm add -D vitest
```
Update package.json scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Acceptance**: `pnpm test` command exists and Vitest runs (even with 0 tests).

---

### T002 - Create vitest.config.ts
**Priority**: P1 | **Labels**: `phase:setup`, `component:test-infra`
**File**: `vitest.config.ts` (NEW)
**Depends on**: T001

**Description**: Configure Vitest for integration tests with appropriate timeouts for AI-powered endpoints.

**Design**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,  // 30s per test (AI generation is slow)
    hookTimeout: 30000,
  },
});
```

**Acceptance**: Vitest discovers test files in `tests/` directory.

---

### T003 - Update tsconfig.json to include tests/
**Priority**: P1 | **Labels**: `phase:setup`, `component:test-infra`
**File**: `tsconfig.json`

**Description**: Ensure TypeScript includes test files for type checking.

**Design**: Add `"tests/**/*"` to the `include` array. Consider creating a separate `tsconfig.test.json` that extends base config if needed.

**Acceptance**: TypeScript recognizes test files without errors.

---

### T004 - Create tests/helpers/language.ts
**Priority**: P1 | **Labels**: `phase:setup`, `component:test-helpers`
**File**: `tests/helpers/language.ts` (NEW)

**Description**: Language detection utilities for verifying AI-generated content language.

**Design**:
```typescript
const VIETNAMESE_CHARS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

export function isVietnamese(text: string): boolean {
  return VIETNAMESE_CHARS.test(text);
}

export function isEnglish(text: string): boolean {
  return !VIETNAMESE_CHARS.test(text) && text.length > 0;
}

export function hasContent(text: string): boolean {
  return text.trim().length > 20;
}
```

**Acceptance**: Functions correctly identify Vietnamese vs English text.

---

### T005 - Create tests/helpers/client.ts
**Priority**: P1 | **Labels**: `phase:setup`, `component:test-helpers`
**File**: `tests/helpers/client.ts` (NEW)

**Description**: Shared SDK client factory for test files. Loads credentials from `.env.test` or `.env`.

**Design**:
```typescript
import { CosmoApiClient } from '../../src/tools/cosmo-api.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env' });

export function createTestClient(): CosmoApiClient {
  const apiKey = process.env.COSMO_API_KEY;
  const baseUrl = process.env.COSMO_BASE_URL || 'http://localhost:8081';
  if (!apiKey) throw new Error('COSMO_API_KEY required. Set in .env.test or environment.');
  return new CosmoApiClient({ apiKey, baseUrl });
}

export function getTestContactId(): string {
  const id = process.env.TEST_CONTACT_ID;
  if (!id) throw new Error('TEST_CONTACT_ID required. Set in .env.test or environment.');
  return id;
}
```

**Acceptance**: `createTestClient()` returns authenticated client. `getTestContactId()` returns valid UUID.

---

### T006 - Add .env.test to .gitignore
**Priority**: P2 | **Labels**: `phase:setup`, `component:test-infra`
**File**: `.gitignore`

**Description**: Ensure test credentials are not committed.

**Design**: Append `.env.test` to `.gitignore`.

**Acceptance**: `.env.test` is ignored by git.

---

**Checkpoint**: Test infrastructure ready. `pnpm test` runs Vitest. Helpers available.

---

## Phase 2: User Story 1 — Draft Generation Language Tests (P1) 🎯 MVP

**Goal**: Verify `generateOutreachDraft` correctly generates drafts in EN/VI and defaults to VI.

**Independent Test**: Run `pnpm test tests/integration/outreach-draft.test.ts`

### T007 - Create outreach-draft.test.ts
**Priority**: P1 | **Labels**: `phase:us1`, `story:US1`, `component:test-integration`, `requirement:FR-004,FR-005,FR-006,FR-007`
**File**: `tests/integration/outreach-draft.test.ts` (NEW)
**Depends on**: T001, T002, T004, T005

**Description**: Integration tests for `generateOutreachDraft` with language support.

**Design**:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createTestClient, getTestContactId } from '../helpers/client.js';
import { isVietnamese, isEnglish, hasContent } from '../helpers/language.js';
import type { CosmoApiClient } from '../../src/tools/cosmo-api.js';

describe('generateOutreachDraft', () => {
  let client: CosmoApiClient;
  let contactId: string;

  beforeAll(() => {
    client = createTestClient();
    contactId = getTestContactId();
  });

  it('should generate English draft with language=en', async () => {
    const result = await client.generateOutreachDraft(contactId, 'en');
    expect(result.draft).toBeDefined();
    expect(hasContent(result.draft)).toBe(true);
    expect(isEnglish(result.draft)).toBe(true);
    // Verify response structure
    expect(result.scenario).toBeDefined();
    expect(result.state).toBeDefined();
  });

  it('should generate Vietnamese draft with language=vi', async () => {
    const result = await client.generateOutreachDraft(contactId, 'vi');
    expect(result.draft).toBeDefined();
    expect(hasContent(result.draft)).toBe(true);
    expect(isVietnamese(result.draft)).toBe(true);
  });

  it('should default to Vietnamese when no language specified', async () => {
    const result = await client.generateOutreachDraft(contactId);
    expect(result.draft).toBeDefined();
    expect(isVietnamese(result.draft)).toBe(true);
  });
});
```

**Acceptance**:
- 3 tests pass
- EN draft has no Vietnamese characters
- VI draft has Vietnamese characters
- Default draft matches Vietnamese
- Response includes `draft`, `scenario`, `state` fields

---

**Checkpoint**: US1 complete. Draft language support verified.

---

## Phase 3: User Story 2 — Meeting Prep Language Tests (P1)

**Goal**: Verify `generateMeetingPrep` correctly generates prep docs in EN/VI.

**Independent Test**: Run `pnpm test tests/integration/meeting-prep.test.ts`

### T008 - Create meeting-prep.test.ts
**Priority**: P1 | **Labels**: `phase:us2`, `story:US2,US3`, `component:test-integration`, `requirement:FR-008,FR-009,FR-010,FR-011,FR-012`
**File**: `tests/integration/meeting-prep.test.ts` (NEW)
**Depends on**: T001, T002, T004, T005

**Description**: Integration tests for `generateMeetingPrep` with language support and error handling. Combines US2 (language tests) and US3 (error handling) since they share the same test file and setup.

**Design**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient, getTestContactId } from '../helpers/client.js';
import { isVietnamese, isEnglish, hasContent } from '../helpers/language.js';
import type { CosmoApiClient } from '../../src/tools/cosmo-api.js';

describe('generateMeetingPrep', () => {
  let client: CosmoApiClient;
  let contactId: string;
  let meetingId: string;

  beforeAll(async () => {
    client = createTestClient();
    contactId = getTestContactId();

    // Create a test meeting for prep generation
    const meeting = await client.createMeeting({
      contact_id: contactId,
      title: 'Integration Test Meeting',
      time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      duration_minutes: 30,
      channel: 'Zoom',
    });
    meetingId = meeting.id;
  });

  // US2: Language Tests
  describe('language support', () => {
    it('should generate English meeting prep with language=en', async () => {
      const result = await client.generateMeetingPrep(meetingId, 'en');
      expect(result.meeting_prep).toBeDefined();
      expect(hasContent(result.meeting_prep!)).toBe(true);
      expect(isEnglish(result.meeting_prep!)).toBe(true);
    });

    it('should generate Vietnamese meeting prep with language=vi', async () => {
      const result = await client.generateMeetingPrep(meetingId, 'vi');
      expect(result.meeting_prep).toBeDefined();
      expect(hasContent(result.meeting_prep!)).toBe(true);
      expect(isVietnamese(result.meeting_prep!)).toBe(true);
    });

    it('should default to Vietnamese when no language specified', async () => {
      const result = await client.generateMeetingPrep(meetingId);
      expect(result.meeting_prep).toBeDefined();
      expect(isVietnamese(result.meeting_prep!)).toBe(true);
    });
  });

  // US3: Error Handling
  describe('error handling', () => {
    it('should error for non-existent meeting', async () => {
      await expect(
        client.generateMeetingPrep('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow();
    });

    it('should error for completed meeting', async () => {
      // Update meeting to completed status
      await client.updateMeeting({
        meeting_id: meetingId,
        status: 'completed',
        outcome: 'Test completed',
      });

      await expect(
        client.generateMeetingPrep(meetingId)
      ).rejects.toThrow();
    });
  });
});
```

**Acceptance**:
- 5 tests pass
- EN prep has no Vietnamese characters
- VI prep has Vietnamese characters
- Non-existent meeting throws error
- Completed meeting throws error

---

**Checkpoint**: US2 + US3 complete. Meeting prep language and error handling verified.

---

## Phase 4: Polish & Validation

**Purpose**: Final cleanup and full suite validation

### T009 - Run full test suite and validate
**Priority**: P1 | **Labels**: `phase:polish`, `component:test-infra`
**Depends on**: T007, T008

**Description**: Run complete test suite, verify all tests pass, check execution time.

**Design**:
```bash
pnpm test -- --reporter=verbose
```

**Acceptance**:
- All 8 tests pass (3 draft + 5 meeting prep)
- Total execution time < 60 seconds
- No flaky tests on repeated runs

---

### T010 - Verify TypeScript build still works
**Priority**: P1 | **Labels**: `phase:polish`, `component:test-infra`
**Depends on**: T003

**Description**: Ensure test files don't break the main build.

**Design**:
```bash
pnpm build
```

**Acceptance**: `pnpm build` succeeds without errors.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (T001-T006)
  ├── T001 Install Vitest
  │   └── T002 vitest.config.ts (depends on T001)
  ├── T003 Update tsconfig.json
  ├── T004 language.ts helpers (parallel)
  ├── T005 client.ts helpers (parallel)
  └── T006 .gitignore (parallel)
      │
Phase 2: US1 Draft Tests (T007)
  └── T007 outreach-draft.test.ts (depends on T001,T002,T004,T005)
      │
Phase 3: US2+US3 Meeting Prep Tests (T008)
  └── T008 meeting-prep.test.ts (depends on T001,T002,T004,T005)
      │
Phase 4: Polish (T009-T010)
  ├── T009 Full suite validation (depends on T007,T008)
  └── T010 Build verification (depends on T003)
```

### Parallel Opportunities

- **T004, T005, T006**: All helpers can be created in parallel
- **T007, T008**: Draft tests and meeting prep tests can be written in parallel (different files)
- **T009, T010**: Validation tasks run sequentially

### MVP Scope

**MVP = Phase 1 + Phase 2 (US1)**: Setup + Draft language tests. This verifies the core language feature works with minimal setup.

---

## Implementation Strategy

1. **Setup first** (T001-T006): ~15 min
2. **Draft tests** (T007): ~15 min — delivers MVP
3. **Meeting prep tests** (T008): ~20 min — completes coverage
4. **Validation** (T009-T010): ~10 min

**Total**: ~60 min estimated
**Total tasks**: 10
