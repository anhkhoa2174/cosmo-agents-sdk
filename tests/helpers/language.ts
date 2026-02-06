/**
 * Language detection utilities for verifying AI-generated content.
 * Uses Vietnamese character heuristic to distinguish EN vs VI.
 */

const VIETNAMESE_CHARS =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

export function isVietnamese(text: string): boolean {
  return VIETNAMESE_CHARS.test(text);
}

export function isEnglish(text: string): boolean {
  return !VIETNAMESE_CHARS.test(text) && text.length > 0;
}

export function hasContent(text: string): boolean {
  return text.trim().length > 20;
}
