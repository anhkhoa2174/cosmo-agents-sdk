# Implementation Plan: Configurable Agent System

## Overview

**Feature**: Configurable Agent System
**Branch**: `1-configurable-agent-system`
**Spec**: [spec.md](./spec.md)
**Research**: [research.md](./research.md)
**Data Model**: [data-model.md](./data-model.md)
**API Contract**: [contracts/api.yaml](./contracts/api.yaml)

---

## Technical Context

### Existing Architecture
- BaseAgent class with template method pattern
- 50+ tools in COSMO_TOOLS array with JSON Schema definitions
- ToolExecutor dispatch via switch statement
- CosmoApiClient for backend REST API
- MCP integration for external services (Apollo.io)

### New Dependencies
- `mem0ai` - Memory provider (default)
- `@aws-sdk/client-s3` - S3 operations
- `@aws-sdk/s3-request-presigner` - Presigned URLs
- `@aws-sdk/client-dynamodb` - DynamoDB client
- `@aws-sdk/lib-dynamodb` - Document client

### Constitution Compliance
| Principle | Compliance |
|-----------|------------|
| AI-First Design | ✅ Agents use Claude; tools designed for AI consumption |
| Modular Agent Architecture | ✅ ConfigurableAgent extends BaseAgent pattern |
| Tool-Centric Operations | ✅ Skills map to existing tool system |
| Type Safety | ✅ Zod schemas for all entities |
| Backend Agnostic | ✅ REST API patterns maintained |

---

## Implementation Phases

### Phase 1: Core Infrastructure
**Goal**: Foundation for memory, storage, and agent configuration

#### 1.1 Memory Provider Interface
- Create `src/memory/types.ts` - IMemoryProvider interface
- Create `src/memory/providers/mem0-provider.ts` - mem0 implementation
- Create `src/memory/providers/in-memory-provider.ts` - test/dev provider
- Create `src/memory/memory-manager.ts` - factory and manager

#### 1.2 Output Storage Service
- Create `src/outputs/types.ts` - Output, ApprovalRecord types
- Create `src/outputs/s3-client.ts` - S3 upload/download/presign
- Create `src/outputs/dynamodb-client.ts` - metadata index
- Create `src/outputs/output-manager.ts` - unified interface

#### 1.3 Agent Configuration Schema
- Create `src/config/schemas.ts` - Zod schemas for Agent, Persona, Skill
- Create `src/config/validator.ts` - validation utilities

### Phase 2: Entity Management
**Goal**: CRUD operations for Persona, Skill, KnowledgeBase

#### 2.1 Persona Management
- Create `src/personas/persona-manager.ts` - CRUD operations
- Create `src/personas/prompt-builder.ts` - template composition

#### 2.2 Skill Registry
- Create `src/skills/skill-registry.ts` - dynamic skill registration
- Create `src/skills/skill-loader.ts` - load from config/database
- Update `src/tools/definitions.ts` - mark automatable skills

#### 2.3 Knowledge Base Integration
- Create `src/knowledge/knowledge-client.ts` - vector DB abstraction
- Create `src/knowledge/providers/` - provider implementations

### Phase 3: Configurable Agent
**Goal**: New agent class with configuration-driven behavior

#### 3.1 ConfigurableAgent Class
- Create `src/agents/configurable-agent.ts` extending BaseAgent
- Implement persona-aware prompt building
- Implement memory context injection
- Implement skill-based tool filtering

#### 3.2 Session Management
- Create `src/sessions/session-manager.ts` - session lifecycle
- Implement session-scoped context
- Implement output tracking per session

#### 3.3 Output Generation
- Integrate output storage with agent loop
- Implement rate limiting per agent
- Implement webhook notification dispatch

### Phase 4: Approval Workflow
**Goal**: Human-in-the-loop approval system

#### 4.1 Webhook System
- Create `src/webhooks/webhook-sender.ts` - delivery with retry
- Create `src/webhooks/signature.ts` - HMAC signing
- Implement exponential backoff (5 attempts, 30s max)

#### 4.2 Approval Handling
- Create `src/approvals/approval-service.ts` - approve/reject logic
- Implement first-write-wins concurrency control
- Implement status transitions

#### 4.3 Automated Execution
- Create `src/execution/executor.ts` - post-approval automation
- Integrate with existing tool executor
- Handle manual vs automated actions

### Phase 5: API Layer
**Goal**: REST API endpoints per contracts/api.yaml

#### 5.1 Agent Routes
- `GET/POST /agents` - list/create
- `GET/PATCH/DELETE /agents/:id` - read/update/delete
- `PUT /agents/:id/skills` - update skills

#### 5.2 Persona Routes
- `GET/POST /personas` - list/create
- `GET/PATCH/DELETE /personas/:id`

#### 5.3 Session Routes
- `POST /agents/:id/sessions` - start session
- `GET /sessions/:id` - get session
- `POST /sessions/:id/chat` - send message
- `POST /sessions/:id/end` - end session

#### 5.4 Output Routes
- `GET /outputs` - list with filters
- `GET /outputs/:id` - get output
- `GET /outputs/:id/content` - redirect to S3
- `POST /outputs/:id/approve` - approve
- `POST /outputs/:id/reject` - reject

#### 5.5 Memory Routes
- `GET /agents/:id/memory` - list memories
- `DELETE /agents/:id/memory` - clear memories

#### 5.6 Webhook Routes
- `POST /webhooks/approval` - callback endpoint

---

## File Structure

```
src/
├── agents/
│   ├── base-agent.ts           # Existing
│   ├── cosmo-agent.ts          # Existing
│   └── configurable-agent.ts   # NEW
├── memory/
│   ├── types.ts                # NEW
│   ├── memory-manager.ts       # NEW
│   └── providers/
│       ├── mem0-provider.ts    # NEW
│       └── in-memory-provider.ts # NEW
├── outputs/
│   ├── types.ts                # NEW
│   ├── s3-client.ts            # NEW
│   ├── dynamodb-client.ts      # NEW
│   └── output-manager.ts       # NEW
├── personas/
│   ├── persona-manager.ts      # NEW
│   └── prompt-builder.ts       # NEW
├── skills/
│   ├── skill-registry.ts       # NEW
│   └── skill-loader.ts         # NEW
├── knowledge/
│   ├── knowledge-client.ts     # NEW
│   └── providers/              # NEW
├── sessions/
│   └── session-manager.ts      # NEW
├── webhooks/
│   ├── webhook-sender.ts       # NEW
│   └── signature.ts            # NEW
├── approvals/
│   └── approval-service.ts     # NEW
├── execution/
│   └── executor.ts             # NEW
├── config/
│   ├── schemas.ts              # NEW
│   └── validator.ts            # NEW
├── api/                        # NEW - if adding HTTP routes
│   ├── routes/
│   └── middleware/
└── tools/
    ├── definitions.ts          # MODIFIED - add is_automatable
    └── executor.ts             # Existing
```

---

## Key Implementation Details

### Memory Context Injection

```typescript
// In ConfigurableAgent.buildSystemPrompt()
protected async buildSystemPrompt(): Promise<string> {
  let prompt = this.basePrompt;

  // Inject persona
  prompt = this.promptBuilder.injectPersona(prompt, this.persona);

  // Inject CRM context
  if (this.context?.prompt_context) {
    prompt += `\n\n${this.context.prompt_context}`;
  }

  // Inject memory context
  if (this.memory && this.userId) {
    const lastMessage = this.getLastUserMessage();
    if (lastMessage) {
      const memories = await this.memory.getContext(lastMessage, this.userId, 5);
      if (memories) {
        prompt += `\n\n## Relevant Context from Previous Conversations\n${memories}`;
      }
    }
  }

  return prompt;
}
```

### Output Storage Flow

```typescript
// In ConfigurableAgent.chat()
// After tool generates output content:

const output = await this.outputManager.create({
  tenantId: this.tenantId,
  agentId: this.agentId,
  sessionId: this.sessionId,
  content,
  contentType: 'text',
  skillUsed: toolName,
  isAutomatable: this.skillRegistry.isAutomatable(toolName)
});

// Trigger webhook
await this.webhookSender.send(this.webhookUrl, {
  outputId: output.id,
  agentId: this.agentId,
  contentUrl: await this.outputManager.getContentUrl(output.id),
  approvalToken: this.generateApprovalToken(output.id)
});
```

### First-Write-Wins Approval

```typescript
// In ApprovalService.approve()
try {
  await this.dynamodb.send(new UpdateCommand({
    TableName: this.tableName,
    Key: { id: outputId },
    UpdateExpression: 'SET #status = :status, approvedBy = :userId, approvedAt = :now',
    ConditionExpression: '#status = :pending',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: {
      ':status': autoExecute ? 'executed' : 'manual',
      ':pending': 'pending',
      ':userId': userId,
      ':now': new Date().toISOString()
    }
  }));
} catch (error) {
  if (error.name === 'ConditionalCheckFailedException') {
    throw new Error('Output already decided');
  }
  throw error;
}
```

---

## Testing Strategy

### Unit Tests
- Memory providers (add, search, delete)
- Output storage (create, approve, reject)
- Skill registry (register, filter)
- Prompt builder (persona injection)
- Webhook sender (retry logic)

### Integration Tests
- ConfigurableAgent end-to-end chat
- Approval workflow (pending → approved → executed)
- Rate limiting enforcement
- Webhook delivery and callback

### Manual Testing
- Create agent via CLI
- Chat session with memory persistence
- Approve output via webhook callback
- Verify S3 content and DynamoDB records

---

## Rollout Plan

### Prerequisites
- [ ] AWS resources provisioned (S3 bucket, DynamoDB table)
- [ ] mem0 API key obtained
- [ ] Webhook endpoint deployed

### Deployment Steps
1. Deploy new dependencies to package.json
2. Run DynamoDB table creation
3. Deploy new modules
4. Create initial skills from COSMO_TOOLS
5. Test with in-memory provider
6. Switch to mem0 provider
7. Enable webhook notifications

### Rollback Plan
- ConfigurableAgent is additive; existing agents unaffected
- Can disable by setting `is_active: false`
- S3/DynamoDB data retained for debugging

---

## Dependencies

### External
- AWS S3 and DynamoDB services
- mem0 platform or self-hosted
- Vector database (if using knowledge base)

### Internal
- BaseAgent (extended)
- COSMO_TOOLS (referenced)
- ToolExecutor (used for automation)
- CosmoApiClient (backend calls)

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| mem0 rate limits | Implement request queuing; use in-memory for tests |
| S3 costs | Lifecycle policies for old outputs; daily limits |
| DynamoDB hot partitions | Tenant-based sharding if needed |
| Webhook timeouts | 30s max delay; notification_failed status |

---

## Next Steps

Run `/specledger.tasks` to generate actionable task breakdown from this plan.
