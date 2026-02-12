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
