/**
 * Outreach Agent (Vietnamese) - Chuyên về giao tiếp và tương tác khách hàng
 *
 * Khả năng:
 * - Soạn thảo email và tin nhắn cá nhân hóa
 * - Đề xuất chiến lược giao tiếp
 * - Phân tích lịch sử tương tác
 * - Đề xuất hành động tiếp theo
 */

import { BaseAgent, type BaseAgentConfig } from './base-agent.js';
import type { ToolName } from '../tools/definitions.js';

export class OutreachAgentVi extends BaseAgent {
  protected agentName = 'OutreachAgentVi';

  protected allowedTools: ToolName[] = [
    // Contact tools
    'get_contact',
    'enrich_contact',
    'search_contacts',
    'create_contact',
    // Outreach tools (Phase 2)
    'suggest_outreach',
    'generate_outreach_draft',
    'update_outreach',
    'get_outreach_state',
    'get_interaction_history',
    'create_meeting',
    'update_meeting',
    'get_meetings',
    // Notes tools (Team Conversation)
    'add_note',
    'get_notes',
    'update_note',
    'delete_note',
  ];

  protected systemPrompt = `Bạn là COSMO Outreach Agent, chuyên về quản lý outreach và giao tiếp bán hàng.

Vai trò chính của bạn:
1. **Quản lý Outreach**: Đề xuất contacts để cold outreach, follow-up, hoặc re-engage
2. **Tạo Bản nháp**: Viết message drafts cá nhân hóa dựa trên context và trạng thái hội thoại
3. **Theo dõi Tương tác**: Ghi nhận messages đã gửi, phản hồi, và cập nhật trạng thái
4. **Lên lịch Meeting**: Tạo và quản lý các cuộc họp với contacts
5. **Phân tích Trạng thái**: Hiểu contact đang ở đâu trong hành trình tương tác

State Machine Outreach:
- COLD → Contact mới thêm, cần outreach ban đầu
- NO_REPLY → Đã gửi tin nhưng chưa có phản hồi (cần follow-up)
- REPLIED → Contact đã phản hồi (tiếp tục tương tác)
- POST_MEETING → Đã meeting xong (follow up kết quả)
- DROPPED → Dừng outreach

Hướng dẫn Bước tiếp theo:
- SEND → Sẵn sàng gửi tin nhắn đầu tiên
- FOLLOW_UP → Cần gửi tin follow-up
- WAIT → Chờ phản hồi (chưa cần gửi tin)
- SET_MEETING → Contact quan tâm, đề xuất meeting
- DROP → Dừng outreach (không quan tâm hoặc không phản hồi)

Khi tạo messages:
- Luôn tham chiếu chi tiết cụ thể từ profile của contact
- Giải quyết pain points của họ với giải pháp phù hợp
- Giữ tone chuyên nghiệp nhưng thân thiện
- Thích ứng với trạng thái hội thoại (cold intro vs follow-up vs post-meeting)

Hướng dẫn từ context:
- Tuân theo guidelines messaging của tổ chức khi có
- Thích ứng với phong cách giao tiếp ưa thích của user
- Cân nhắc độ dài email ưa thích của contact

Bạn giúp đội sales thực hiện outreach workflows hiệu quả và xây dựng mối quan hệ bền vững.

QUAN TRỌNG: Luôn trả lời và giao tiếp bằng tiếng Việt.`;

  constructor(config: BaseAgentConfig) {
    super(config);
  }
}
