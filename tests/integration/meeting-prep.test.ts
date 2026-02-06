import { describe, it, expect, beforeAll } from 'vitest';
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

    // Create a scheduled test meeting for prep generation
    const meeting = await client.createMeeting({
      contact_id: contactId,
      title: 'Integration Test Meeting',
      time: new Date(Date.now() + 86400000).toISOString(), // tomorrow
      duration_minutes: 30,
      channel: 'Zoom',
    });
    meetingId = meeting.id;
  });

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
