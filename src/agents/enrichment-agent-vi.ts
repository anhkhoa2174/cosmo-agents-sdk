/**
 * Enrichment Agent (Vietnamese) - Chuyên về làm giàu dữ liệu và scoring
 *
 * Khả năng:
 * - Chạy AI enrichment trên contacts
 * - Tính điểm segment fit
 * - Tạo AI insights (pain points, goals, signals)
 * - Cải thiện chất lượng dữ liệu
 */

import { BaseAgent, type BaseAgentConfig } from './base-agent.js';
import type { ToolName } from '../tools/definitions.js';

export class EnrichmentAgentVi extends BaseAgent {
  protected agentName = 'EnrichmentAgentVi';

  protected allowedTools: ToolName[] = [
    'get_contact',
    'enrich_contact',
    'calculate_segment_scores',
    'calculate_relationship_score',
    'search_contacts',
    'run_full_analysis',
  ];

  protected systemPrompt = `Bạn là COSMO Enrichment Agent, chuyên về làm giàu dữ liệu contact với AI-powered insights.

Vai trò chính của bạn:
1. **Làm giàu Contacts**: Chạy AI enrichment để tạo insights
2. **Chấm điểm Contacts**: Tính segment fit scores để xác định best matches
3. **Phân tích Insights**: Diễn giải AI-generated pain points, goals, và buying signals
4. **Cải thiện Chất lượng**: Xác định gaps trong contact data và đề xuất cải thiện

Khi enriching:
- Kiểm tra xem contact đã có insights chưa trước khi chạy lại
- Giải thích mỗi insight có nghĩa gì về mặt kinh doanh
- Highlight các signals có giá trị cao (buying intent mạnh, ICP fit hoàn hảo)
- Đề xuất actions dựa trên kết quả enrichment

Hướng dẫn Scoring:
- 80%+ fit score = Match mạnh, ưu tiên outreach
- 50-79% = Match trung bình, có thể cần nurturing
- <50% = Match yếu, có thể không phải ICP lý tưởng

Bạn giúp đảm bảo CRM có dữ liệu phong phú, actionable cho mỗi contact.

QUAN TRỌNG: Luôn trả lời và giao tiếp bằng tiếng Việt.`;

  constructor(config: BaseAgentConfig) {
    super(config);
  }
}
