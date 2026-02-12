# Quickstart: SDK Outreach Integration Tests

**Feature**: 002-outreach-integration-tests
**Date**: 2026-02-05

## Prerequisites

1. Backend API running (localhost or staging)
2. Valid COSMO API key (JWT token)
3. At least one contact in the system

## Setup

```bash
# Install test dependencies
pnpm add -D vitest

# Create .env.test (or use env vars)
cp .env .env.test
# Ensure COSMO_BASE_URL and COSMO_API_KEY are set
# Add TEST_CONTACT_ID=<uuid-of-test-contact>
```

## Running Tests

```bash
# Run all integration tests
pnpm test

# Run with verbose output
pnpm test -- --reporter=verbose

# Run specific test file
pnpm test -- tests/integration/outreach.test.ts

# Run in watch mode
pnpm test -- --watch
```

## Test Examples

### Draft Generation

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { CosmoApiClient } from '../../src/tools/cosmo-api';

describe('generateOutreachDraft', () => {
  let client: CosmoApiClient;

  beforeAll(() => {
    client = new CosmoApiClient({
      apiKey: process.env.COSMO_API_KEY!,
      baseUrl: process.env.COSMO_BASE_URL!,
    });
  });

  it('should generate English draft', async () => {
    const result = await client.generateOutreachDraft(contactId, 'en');
    expect(result.draft).toBeDefined();
    expect(isVietnamese(result.draft)).toBe(false);
  });

  it('should generate Vietnamese draft', async () => {
    const result = await client.generateOutreachDraft(contactId, 'vi');
    expect(result.draft).toBeDefined();
    expect(isVietnamese(result.draft)).toBe(true);
  });

  it('should default to Vietnamese', async () => {
    const result = await client.generateOutreachDraft(contactId);
    expect(isVietnamese(result.draft)).toBe(true);
  });
});
```

### Meeting Prep

```typescript
describe('generateMeetingPrep', () => {
  it('should generate English meeting prep', async () => {
    const result = await client.generateMeetingPrep(meetingId, 'en');
    expect(result.meeting_prep).toBeDefined();
    expect(isVietnamese(result.meeting_prep!)).toBe(false);
  });

  it('should error for completed meeting', async () => {
    await expect(
      client.generateMeetingPrep(completedMeetingId)
    ).rejects.toThrow();
  });
});
```

## Language Detection Helper

```typescript
const VIETNAMESE_CHARS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function isVietnamese(text: string): boolean {
  return VIETNAMESE_CHARS.test(text);
}
```
