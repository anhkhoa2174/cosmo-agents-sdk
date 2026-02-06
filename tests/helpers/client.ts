/**
 * Shared SDK client factory for integration tests.
 * Loads credentials from .env.test or .env.
 */

import { CosmoApiClient } from '../../src/tools/cosmo-api.js';
import dotenv from 'dotenv';

// Load test env first, then fallback to main .env
dotenv.config({ path: '.env.test' });
dotenv.config({ path: '.env' });

export function createTestClient(): CosmoApiClient {
  const apiKey = process.env.COSMO_API_KEY;
  const baseUrl = process.env.COSMO_BASE_URL || 'http://localhost:8081';

  if (!apiKey) {
    throw new Error(
      'COSMO_API_KEY required. Set in .env.test or environment variables.'
    );
  }

  return new CosmoApiClient({ apiKey, baseUrl });
}

export function getTestContactId(): string {
  const id = process.env.TEST_CONTACT_ID;
  if (!id) {
    throw new Error(
      'TEST_CONTACT_ID required. Set in .env.test or environment variables.'
    );
  }
  return id;
}
