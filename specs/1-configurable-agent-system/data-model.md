# Data Model: Configurable Agent System

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Tenant    │──────<│    Agent    │>──────│   Persona   │
└─────────────┘   1:N └─────────────┘ N:1   └─────────────┘
                            │
                            │ 1:N
                            ▼
                      ┌─────────────┐
                      │   Session   │
                      └─────────────┘
                            │
                            │ 1:N
                            ▼
                      ┌─────────────┐       ┌─────────────┐
                      │   Output    │──────>│  Approval   │
                      └─────────────┘ 1:1   │   Record    │
                                            └─────────────┘

┌─────────────┐       ┌─────────────┐
│    Skill    │<──────│    Agent    │ (N:M via skill_ids[])
└─────────────┘       └─────────────┘

┌─────────────┐       ┌─────────────┐
│ KnowledgeBase│<─────│    Agent    │ (N:1)
└─────────────┘       └─────────────┘
```

---

## Entities

### Agent

Configured AI agent instance with persona, skills, and memory settings.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| tenant_id | UUID | Yes | Owning organization |
| name | string | Yes | Display name (max 100 chars) |
| description | string | No | Purpose description (max 500 chars) |
| persona_id | UUID | Yes | Reference to Persona |
| system_prompt | string | Yes | Base system prompt template |
| skill_ids | UUID[] | Yes | Array of enabled Skill IDs |
| knowledge_base_id | UUID | No | Reference to KnowledgeBase |
| memory_config | MemoryConfig | Yes | Memory provider settings |
| daily_output_limit | integer | Yes | Max outputs per day (default: 100) |
| webhook_url | string | No | URL for approval notifications |
| webhook_secret | string | No | HMAC secret for webhook signing |
| is_active | boolean | Yes | Whether agent is enabled |
| created_at | timestamp | Yes | Creation time |
| updated_at | timestamp | Yes | Last modification time |

**Validation Rules**:
- name: 1-100 characters, alphanumeric with spaces/hyphens
- system_prompt: 1-10000 characters
- skill_ids: At least one skill required
- daily_output_limit: 1-1000
- webhook_url: Valid HTTPS URL if provided

**Indexes**:
- Primary: `id`
- Unique: `(tenant_id, name)`
- Query: `tenant_id` (for listing tenant's agents)

---

### Persona

Sales representative persona definition that influences agent communication style.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| tenant_id | UUID | Yes | Owning organization |
| name | string | Yes | Persona name (e.g., "Enterprise Sales Rep") |
| role | string | Yes | Role/title (e.g., "Senior Account Executive") |
| communication_style | string | Yes | Style description (e.g., "professional, consultative") |
| tone | string | Yes | Tone (e.g., "friendly but formal") |
| target_audience | string | Yes | Primary audience (e.g., "C-level executives") |
| signature_elements | string[] | No | Distinctive phrases or sign-offs |
| example_messages | string[] | No | Sample messages demonstrating style |
| created_at | timestamp | Yes | Creation time |
| updated_at | timestamp | Yes | Last modification time |

**Validation Rules**:
- name: 1-100 characters
- role, communication_style, tone, target_audience: 1-500 characters each
- signature_elements: Max 10 elements, each max 200 chars
- example_messages: Max 5 examples, each max 1000 chars

**Indexes**:
- Primary: `id`
- Unique: `(tenant_id, name)`
- Query: `tenant_id`

---

### Skill

Tool/capability that can be assigned to agents.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| name | string | Yes | Tool name (matches COSMO_TOOLS) |
| display_name | string | Yes | Human-readable name |
| description | string | Yes | What this skill does |
| category | string | Yes | Grouping (contact, outreach, analytics, etc.) |
| is_automatable | boolean | Yes | Can execute without human action |
| required_config | object | No | Config schema for this skill |
| is_system | boolean | Yes | Built-in vs custom skill |
| created_at | timestamp | Yes | Creation time |

**Validation Rules**:
- name: Must match pattern `[a-z][a-z0-9_]*` (snake_case)
- category: One of predefined categories

**Indexes**:
- Primary: `id`
- Unique: `name`
- Query: `category`, `is_automatable`

**Predefined Categories**:
- `contact` - Contact management operations
- `intelligence` - Enrichment and scoring
- `segment` - Segment operations
- `playbook` - Playbook and automation
- `analytics` - Reporting and metrics
- `external` - Third-party integrations (Apollo, etc.)
- `workflow` - Long-running operations
- `custom` - User-defined skills

---

### KnowledgeBase

Vector database reference for agent knowledge.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| tenant_id | UUID | Yes | Owning organization |
| name | string | Yes | Display name |
| provider | string | Yes | Vector DB provider (pinecone, weaviate, etc.) |
| connection_config | object | Yes | Provider-specific connection settings |
| namespace | string | No | Namespace/index within provider |
| embedding_model | string | Yes | Model used for embeddings |
| last_synced_at | timestamp | No | Last content sync time |
| created_at | timestamp | Yes | Creation time |
| updated_at | timestamp | Yes | Last modification time |

**Validation Rules**:
- provider: One of `pinecone`, `weaviate`, `qdrant`, `chroma`
- connection_config: Must match provider schema

**Indexes**:
- Primary: `id`
- Unique: `(tenant_id, name)`
- Query: `tenant_id`

---

### MemoryConfig (Embedded)

Memory provider configuration embedded in Agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| provider | string | Yes | Memory provider (mem0, in-memory) |
| scope | string | Yes | Scoping strategy |
| retention_days | integer | No | How long to retain memories |
| config | object | No | Provider-specific settings |

**Scope Values**:
- `agent` - Memories shared across all users of this agent
- `user` - Memories scoped to individual users
- `session` - Memories scoped to conversation sessions
- `prospect` - Memories scoped to prospect/contact being discussed

---

### Session

Conversation session with an agent.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| agent_id | UUID | Yes | Parent agent |
| user_id | UUID | Yes | User who started session |
| started_at | timestamp | Yes | Session start time |
| ended_at | timestamp | No | Session end time (null if active) |
| message_count | integer | Yes | Number of messages exchanged |
| output_count | integer | Yes | Number of outputs generated |
| metadata | object | No | Session-specific context |

**Indexes**:
- Primary: `id`
- Query: `agent_id`, `user_id`, `started_at`

---

### Output

Agent-generated content stored in S3.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| tenant_id | UUID | Yes | Owning organization |
| agent_id | UUID | Yes | Generating agent |
| session_id | UUID | Yes | Parent session |
| content_type | string | Yes | Type of content (text, json, file) |
| content_preview | string | No | First 500 chars for display |
| s3_key | string | Yes | S3 object key |
| status | string | Yes | Current status |
| skill_used | string | No | Skill that generated this output |
| is_automatable | boolean | Yes | Can be auto-executed |
| webhook_attempts | integer | Yes | Number of webhook delivery attempts |
| webhook_last_error | string | No | Last webhook error message |
| created_at | timestamp | Yes | Creation time |
| updated_at | timestamp | Yes | Last status change |

**Status Values** (state machine):
```
pending ──┬──> approved ──┬──> executed
          │               └──> manual
          └──> rejected

pending ──> notification_failed (remains pending for manual discovery)
```

**Indexes**:
- Primary: `id`
- Query: `(agent_id, status, created_at)` - for pending outputs per agent
- Query: `(tenant_id, created_at)` - for tenant-wide listing
- Query: `s3_key` - for S3 event processing

**DynamoDB Design**:
- PK: `TENANT#{tenant_id}`
- SK: `OUTPUT#{created_at}#{id}`
- GSI1PK: `AGENT#{agent_id}`
- GSI1SK: `STATUS#{status}#{created_at}`

---

### ApprovalRecord

Human decision on an output.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Unique identifier |
| output_id | UUID | Yes | Approved/rejected output |
| decision | string | Yes | approved, rejected |
| decided_by | UUID | Yes | User who made decision |
| decided_at | timestamp | Yes | Decision time |
| notes | string | No | Optional feedback/reason |
| auto_execute | boolean | Yes | Whether to auto-execute on approval |

**Indexes**:
- Primary: `id`
- Unique: `output_id` (only one decision per output)
- Query: `decided_by`, `decided_at`

---

## Rate Limiting

### AgentDailyUsage

Tracks daily output counts for rate limiting.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| agent_id | UUID | Yes | Agent being tracked |
| date | string | Yes | Date in YYYY-MM-DD format |
| output_count | integer | Yes | Outputs generated today |
| limit | integer | Yes | Daily limit (from agent config) |
| reset_at | timestamp | Yes | When counter resets (midnight UTC) |

**DynamoDB Design**:
- PK: `AGENT#{agent_id}`
- SK: `DATE#{date}`
- TTL: `reset_at` + 1 day (auto-cleanup)

---

## Zod Schemas

```typescript
// Agent Definition Schema
const AgentSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  persona_id: z.string().uuid(),
  system_prompt: z.string().min(1).max(10000),
  skill_ids: z.array(z.string().uuid()).min(1),
  knowledge_base_id: z.string().uuid().optional(),
  memory_config: MemoryConfigSchema,
  daily_output_limit: z.number().int().min(1).max(1000).default(100),
  webhook_url: z.string().url().startsWith('https://').optional(),
  webhook_secret: z.string().min(32).optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Persona Schema
const PersonaSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(500),
  communication_style: z.string().min(1).max(500),
  tone: z.string().min(1).max(500),
  target_audience: z.string().min(1).max(500),
  signature_elements: z.array(z.string().max(200)).max(10).optional(),
  example_messages: z.array(z.string().max(1000)).max(5).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Output Schema
const OutputSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  agent_id: z.string().uuid(),
  session_id: z.string().uuid(),
  content_type: z.enum(['text', 'json', 'file']),
  content_preview: z.string().max(500).optional(),
  s3_key: z.string(),
  status: z.enum(['pending', 'approved', 'rejected', 'executed', 'manual', 'notification_failed']),
  skill_used: z.string().optional(),
  is_automatable: z.boolean(),
  webhook_attempts: z.number().int().min(0).default(0),
  webhook_last_error: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Memory Config Schema
const MemoryConfigSchema = z.object({
  provider: z.enum(['mem0', 'in-memory']).default('mem0'),
  scope: z.enum(['agent', 'user', 'session', 'prospect']).default('user'),
  retention_days: z.number().int().min(1).max(365).optional(),
  config: z.record(z.unknown()).optional(),
});
```

---

## State Transitions

### Output Status

```
┌─────────┐
│ pending │◄───────────────────────────────────┐
└────┬────┘                                    │
     │                                         │
     ├──────────────┬──────────────┐          │
     │              │              │          │
     ▼              ▼              ▼          │
┌─────────┐   ┌──────────┐   ┌─────────────┐  │
│approved │   │ rejected │   │notification_│  │
└────┬────┘   └──────────┘   │   failed    │──┘
     │                       └─────────────┘
     │                       (still queryable,
     ├──────────────┐         awaits manual check)
     │              │
     ▼              ▼
┌─────────┐   ┌────────┐
│executed │   │ manual │
└─────────┘   └────────┘
```

**Transition Rules**:
1. `pending → approved`: User approves output
2. `pending → rejected`: User rejects output
3. `pending → notification_failed`: Webhook exhausts retries (status remains pending)
4. `approved → executed`: Auto-execute succeeds
5. `approved → manual`: Output marked for manual human action
6. All terminal states are immutable
