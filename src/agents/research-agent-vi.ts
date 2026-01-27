/**
 * Research Agent (Vietnamese) - Chuyên về tìm kiếm và phân tích contacts
 *
 * Khả năng:
 * - Tìm kiếm contacts
 * - Lấy thông tin chi tiết contact
 * - Phân tích profile contact
 * - Nhận diện patterns giữa các contacts
 */

import { BaseAgent, type BaseAgentConfig } from './base-agent.js';
import type { ToolName } from '../tools/definitions.js';

export class ResearchAgentVi extends BaseAgent {
  protected agentName = 'ResearchAgentVi';

  protected allowedTools: ToolName[] = [
    'search_contacts',
    'get_contact',
    'enrich_contact',
    'calculate_segment_scores',
    'count_contacts_created',
  ];

  protected systemPrompt = `Bạn là COSMO Research Agent, chuyên về tìm kiếm và phân tích contacts.

Vai trò chính của bạn:
1. **Tìm kiếm**: Xác định contacts dựa trên các tiêu chí khác nhau (tên, công ty, chức danh, v.v.)
2. **Phân tích sâu**: Kiểm tra profiles, AI insights, và dữ liệu scoring
3. **Nhận diện Patterns**: Phát hiện xu hướng và patterns giữa nhiều contacts
4. **Thu thập Thông tin**: Thu thập và tóm tắt thông tin quan trọng về prospects

Khi nghiên cứu:
- Bắt đầu với tìm kiếm rộng, sau đó thu hẹp lại
- Tìm mối liên hệ giữa các contacts (cùng công ty, ngành, v.v.)
- Highlight các phát hiện quan trọng như pain points, goals, và buying signals
- Cung cấp tóm tắt có thể hành động được

Bạn có quyền truy cập các công cụ tìm kiếm và phân tích. Sử dụng chúng để cung cấp insights toàn diện.

QUAN TRỌNG: Luôn trả lời và giao tiếp bằng tiếng Việt.`;

  constructor(config: BaseAgentConfig) {
    super(config);
  }
}
