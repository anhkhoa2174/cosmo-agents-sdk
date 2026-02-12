# Implementation Plan: SDK Outreach Integration Tests

**Branch**: `002-outreach-integration-tests` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-outreach-integration-tests/spec.md`

## Summary

Create integration test suite for SDK outreach features using Vitest. Tests verify language support (EN/VI) for `generateOutreachDraft` and `generateMeetingPrep`, response structure validation, and error handling for invalid meeting states. Tests run against real backend API.

**Key Deliverables:**
1. Install and configure Vitest test framework
2. Create test helper utilities (language detection, client setup)
3. Write draft generation language tests (3 cases)
4. Write meeting prep language tests (3 cases)
5. Write meeting prep error handling tests (3 cases)
6. Add `pnpm test` script to package.json

## Technical Context

**Language/Version**: TypeScript 5.7.3, Node.js (ES Modules)
**Primary Dependencies**: vitest (new), @anthropic-ai/sdk, axios
**Storage**: N/A (tests call backend API)
**Testing**: Vitest (integration tests against real backend)
**Target Platform**: Node.js, developer workstations, CI/CD
**Project Type**: Single library project with CLI interface
**Performance Goals**: Test suite completes in <60 seconds
**Constraints**: Requires running backend, real API credentials, existing test contact
**Scale/Scope**: 9 test cases across 2 test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Specification-First**: Spec.md complete with 4 prioritized user stories
- [x] **Test-First**: This IS the test feature - test strategy is the deliverable
- [x] **Code Quality**: TypeScript strict mode, Vitest for testing
- [x] **UX Consistency**: Test scenarios documented with Given/When/Then
- [x] **Performance**: <60s test suite execution target
- [x] **Observability**: Vitest reporter with verbose output, elapsed time per test
- [x] **Issue Tracking**: Feature branch created and linked to spec

**Complexity Violations**: None identified

## Project Structure

### Documentation (this feature)

```text
specs/002-outreach-integration-tests/
├── plan.md              # This file
├── research.md          # Phase 0 output - framework decisions
├── data-model.md        # Phase 1 output - test entities
├── quickstart.md        # Phase 1 output - usage examples
└── tasks.md             # Phase 2 output (via /specledger.tasks)
```

### Source Code (repository root)

```text
tests/
├── integration/
│   ├── outreach-draft.test.ts    # Draft generation language tests
│   └── meeting-prep.test.ts      # Meeting prep language + error tests
├── helpers/
│   ├── client.ts                 # Shared SDK client setup
│   └── language.ts               # Vietnamese/English detection utils
└── setup.ts                      # Global test setup (env loading)

# Config files (repository root)
vitest.config.ts                  # Vitest configuration
.env.test                         # Test environment variables (gitignored)
```

**Structure Decision**: Tests in `tests/` directory at root level, separate from `src/`. Integration tests in `tests/integration/`, shared helpers in `tests/helpers/`.

## Complexity Tracking

> No violations - straightforward test infrastructure setup.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

---

## Phase 0: Research Findings

### Prior Work

- **001-sdk-backend-parity**: Implemented the features under test (language param, meeting prep)
- **No existing test framework**: SDK has no tests, no Vitest/Jest, no test scripts

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Test framework | Vitest | Native ESM support, TypeScript out-of-box |
| Test type | Integration (real backend) | SDK is thin client, mocks would miss real issues |
| Language detection | Vietnamese char regex | Simple, accurate for VI vs EN |
| Test data | Existing contact + created meeting | Fast setup, minimal side effects |

See [research.md](./research.md) for full decision log.

---

## Phase 1: Implementation Design

### Changes Required

#### 1. Install Vitest

```bash
pnpm add -D vitest
```

Update `package.json`:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

#### 2. vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
```

#### 3. tests/helpers/language.ts

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

#### 4. tests/helpers/client.ts

```typescript
import { CosmoApiClient } from '../../src/tools/cosmo-api.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env' });

export function createTestClient(): CosmoApiClient {
  const apiKey = process.env.COSMO_API_KEY;
  const baseUrl = process.env.COSMO_BASE_URL || 'http://localhost:8081';

  if (!apiKey) {
    throw new Error('COSMO_API_KEY required.');
  }

  return new CosmoApiClient({ apiKey, baseUrl });
}

export function getTestContactId(): string {
  const id = process.env.TEST_CONTACT_ID;
  if (!id) throw new Error('TEST_CONTACT_ID required.');
  return id;
}
```

#### 5. tests/integration/outreach-draft.test.ts

3 test cases:
- `generateOutreachDraft(contactId, 'en')` → English content
- `generateOutreachDraft(contactId, 'vi')` → Vietnamese content
- `generateOutreachDraft(contactId)` → defaults to Vietnamese
- Bonus: verify response structure (draft, scenario, state, context_level)

#### 6. tests/integration/meeting-prep.test.ts

6 test cases:
- `generateMeetingPrep(meetingId, 'en')` → English content
- `generateMeetingPrep(meetingId, 'vi')` → Vietnamese content
- `generateMeetingPrep(meetingId)` → defaults to Vietnamese
- `generateMeetingPrep(completedMeetingId)` → error
- `generateMeetingPrep(cancelledMeetingId)` → error
- `generateMeetingPrep('non-existent-id')` → 404 error

---

## Files to Create/Modify

| File | Action | Priority |
|------|--------|----------|
| `package.json` | Add vitest dep + test scripts | P1 |
| `vitest.config.ts` | Create - test configuration | P1 |
| `tests/helpers/language.ts` | Create - language detection utils | P1 |
| `tests/helpers/client.ts` | Create - shared client setup | P1 |
| `tests/integration/outreach-draft.test.ts` | Create - draft tests | P1 |
| `tests/integration/meeting-prep.test.ts` | Create - meeting prep tests | P1 |
| `tsconfig.json` | Update include to add tests/ | P1 |
| `.gitignore` | Add .env.test if not present | P2 |

---

## Testing Strategy

These ARE the tests. Validation = tests pass.

```bash
# Full test suite
pnpm test

# Expected output
✓ outreach-draft.test.ts (3 tests)
  ✓ generates English draft with language=en
  ✓ generates Vietnamese draft with language=vi
  ✓ defaults to Vietnamese when no language specified

✓ meeting-prep.test.ts (6 tests)
  ✓ generates English meeting prep with language=en
  ✓ generates Vietnamese meeting prep with language=vi
  ✓ defaults to Vietnamese when no language specified
  ✓ errors for completed meeting
  ✓ errors for cancelled meeting
  ✓ errors for non-existent meeting
```

---

## Ready for Phase 2

This plan is ready for `/specledger.tasks` to generate the implementation tasks.

**Artifacts Generated:**
- [x] plan.md (this file)
- [x] research.md
- [x] data-model.md
- [x] quickstart.md
- [ ] contracts/ (N/A - testing existing API)
