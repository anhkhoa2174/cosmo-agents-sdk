# Research: SDK Outreach Integration Tests

**Feature**: 002-outreach-integration-tests
**Date**: 2026-02-05

## Prior Work

- **001-sdk-backend-parity**: Implemented `generateOutreachDraft` with language parameter and `generateMeetingPrep` method. These are the primary features under test.
- **No existing test infrastructure**: SDK has zero tests, no test framework, no test scripts.

## Decision Log

### D1: Test Framework Selection

**Decision**: Vitest
**Rationale**:
- Native ESM support (SDK uses `"type": "module"`)
- TypeScript support out of the box with tsx
- Fast execution, watch mode
- Compatible with existing toolchain (tsx, TypeScript 5.7.3)

**Alternatives Considered**:
| Option | Pros | Cons | Why Rejected |
|--------|------|------|-------------|
| Jest | Mature, large ecosystem | Poor ESM support, needs transform config | ESM compatibility issues with `"type": "module"` |
| Node test runner | Zero dependency | Limited assertions, no TypeScript | Needs too much setup for TS |
| Vitest | Native ESM, TS, fast | Newer | Best fit for project ✅ |

### D2: Test Type - Integration vs Unit

**Decision**: Integration tests against real backend
**Rationale**:
- SDK is a thin API client - mocking defeats the purpose
- AI-generated content cannot be unit tested meaningfully
- Language verification requires actual AI output
- Backend is running locally or on staging

**Alternatives Considered**:
| Option | Pros | Cons | Why Rejected |
|--------|------|------|-------------|
| Unit with mocks | Fast, no backend needed | Can't verify AI content, mocks drift | Doesn't test what matters |
| Integration (real) | Tests actual behavior | Slower, needs backend | Best for this use case ✅ |
| E2E via CLI | Tests full stack | Hard to assert, slow | Overkill for API client tests |

### D3: Language Detection Strategy

**Decision**: Vietnamese character detection heuristic
**Rationale**:
- Vietnamese uses specific Unicode characters (ă, â, đ, ê, ô, ơ, ư and diacritics)
- English-only content lacks these characters
- Simple regex check: `/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i`
- If Vietnamese characters present → Vietnamese content confirmed
- If absent and ASCII-dominant → English content confirmed

**Alternatives Considered**:
| Option | Pros | Cons | Why Rejected |
|--------|------|------|-------------|
| Language detection library | Accurate | Extra dependency | Overkill for 2 languages |
| Check first N words | Simple | Unreliable with names/brands | Too fragile |
| Vietnamese char regex | Simple, accurate for VI/EN | Only works for VI vs EN | Perfect for our 2-language case ✅ |

### D4: Test Data Strategy

**Decision**: Use existing test contact, create meeting in beforeAll
**Rationale**:
- Creating contacts requires enrichment which is slow
- Using a known test contact is sufficient for draft tests
- Meetings can be created/cleaned up quickly

## Resolved Unknowns

| Unknown | Resolution | Source |
|---------|-----------|--------|
| Test framework | Vitest | D1 - ESM compatibility |
| How to verify language | Vietnamese char regex | D3 |
| Test data approach | Existing contact + created meeting | D4 |
| Backend required? | Yes, integration tests | D2 |
