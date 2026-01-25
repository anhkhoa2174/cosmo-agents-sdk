# Research: Configurable Agent System

## Prior Work

### Existing Codebase Analysis

**Agent Architecture Patterns:**
- `BaseAgent` class provides template method pattern with abstract `systemPrompt`, `agentName`, `allowedTools`
- Specialized agents (Research, Outreach, Enrichment, Analytics) extend BaseAgent with domain-specific tools
- `AgentOrchestrator` coordinates multi-agent workflows with task delegation
- Tool filtering via `allowedTools: ToolName[]` arrays enables per-agent tool access control

**Tool System:**
- 50+ tools defined in `src/tools/definitions.ts` using JSON Schema format
- `ToolExecutor` dispatches tool calls via switch statement with dedicated handlers
- Tools organized by domain: Contact, Intelligence, Segments, Playbooks, Apollo.io, Analytics

**Configuration Patterns:**
- `BaseAgentConfig` interface composes CosmoConfig with API credentials and execution params
- Context loading: dual context (org-level + user-level) merged into prompts
- Session persistence via `sessionId` and `persistHistory` flags

**Integration Patterns:**
- `CosmoApiClient` wraps REST API with Bearer token auth
- `ApolloApiClient` for external Apollo.io integration
- MCP support via `MCPClientManager` for stdio/SSE transports

### Related Beads Issues
- No existing issues found for this feature

---

## Technical Decisions

### 1. Agent Definition Storage

**Decision**: JSON files + database hybrid
**Rationale**: JSON files for version control and easy editing; database for runtime queries and multi-tenant access
**Alternatives considered**:
- JSON files only: Simple but lacks query capabilities and multi-tenant isolation
- Database only: Harder to version control and requires UI for editing
- YAML files: More readable but less tooling support in TypeScript ecosystem

### 2. Memory Provider Architecture

**Decision**: Provider-agnostic interface with mem0 as default
**Rationale**: Allows flexibility while providing a sensible default; adapter pattern enables future provider swaps
**Alternatives considered**:
- mem0 only: Simpler but vendor lock-in
- Custom implementation: More control but significant development effort
- No abstraction: Direct mem0 usage, harder to test and swap

**Implementation Pattern**:
```typescript
interface IMemoryProvider {
  add(messages: Message[], options: MemoryAddOptions): Promise<MemoryEntry[]>;
  search(query: string, options: MemorySearchOptions): Promise<MemorySearchResult[]>;
  get(memoryId: string): Promise<MemoryEntry | null>;
  getAll(options: MemorySearchOptions): Promise<MemoryEntry[]>;
  update(memoryId: string, content: string): Promise<MemoryEntry>;
  delete(memoryId: string): Promise<void>;
  deleteAll(options: MemoryDeleteOptions): Promise<void>;
}
```

### 3. Output Storage Strategy

**Decision**: S3 for content + DynamoDB for metadata index
**Rationale**: S3 handles arbitrary content sizes; DynamoDB enables efficient querying by status/agent/date
**Alternatives considered**:
- S3 with S3 Metadata tables: Newer feature, higher latency for real-time queries
- S3 only with HeadObject calls: Expensive for listing/filtering
- Database for everything: Content size limits, higher cost at scale

**S3 Key Structure**:
```
outputs/{tenant-id}/{agent-id}/{year}/{month}/{day}/{output-id}.json
```

### 4. Webhook Retry Strategy

**Decision**: Exponential backoff with 5 attempts, max 30s delay
**Rationale**: Balances reliability with resource usage; matches spec requirement
**Implementation**:
- Base delay: 1 second
- Multiplier: 2x per attempt
- Max delay: 30 seconds
- Jitter: Random 0-1 second added

### 5. Concurrent Approval Handling

**Decision**: DynamoDB conditional writes for first-write-wins
**Rationale**: Atomic, no distributed locking needed; aligns with spec requirement
**Implementation**:
```typescript
ConditionExpression: "#status = :pending"
// Returns ConditionalCheckFailedException if already decided
```

### 6. Rate Limiting Strategy

**Decision**: Per-agent daily limits stored in DynamoDB with TTL
**Rationale**: Simple, cost-effective; daily reset aligns with typical usage patterns
**Alternatives considered**:
- Redis sliding window: More precise but additional infrastructure
- In-memory: Doesn't persist across restarts, not multi-instance safe
- Token bucket: More complex, overkill for daily limits

### 7. Skill Registry Architecture

**Decision**: Extend existing COSMO_TOOLS pattern with runtime registration
**Rationale**: Preserves existing tool definitions; adds dynamic capability
**Implementation**:
- Base tools remain in `definitions.ts`
- `SkillRegistry` class manages runtime additions
- Skills reference existing tools or define custom ones

### 8. Persona Prompt Injection

**Decision**: Template-based system prompt composition
**Rationale**: Flexible, testable; allows persona attributes to influence prompt sections
**Template Variables**:
- `{persona.name}`, `{persona.role}`, `{persona.style}`
- `{persona.tone}`, `{persona.audience}`
- `{agent.context}`, `{memory.context}`

---

## Technology Stack

### Core Dependencies (Existing)
- `@anthropic-ai/sdk` - Claude API client
- `@modelcontextprotocol/sdk` - MCP support
- `zod` - Runtime validation

### New Dependencies Required
- `mem0ai` - Memory provider (default)
- `@aws-sdk/client-s3` - S3 uploads
- `@aws-sdk/s3-request-presigner` - Presigned URLs
- `@aws-sdk/client-dynamodb` - Metadata index
- `@aws-sdk/lib-dynamodb` - DynamoDB document client

### Optional Dependencies
- `ioredis` - If Redis rate limiting preferred
- `@aws-sdk/lib-storage` - Large file streaming

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| mem0 API changes | Provider interface isolates changes |
| S3 costs at scale | Daily cleanup of old outputs; lifecycle policies |
| DynamoDB hot partitions | Agent ID distribution; consider tenant sharding |
| Webhook endpoint failures | Retry with backoff; notification_failed status |
| Memory provider unavailable | Graceful degradation; agent continues without context |

---

## Open Items Resolved

All NEEDS CLARIFICATION items from spec have been resolved:
1. ✅ Memory provider: Provider-agnostic with mem0 default
2. ✅ Approval workflow: Webhook to external systems
3. ✅ Persona scope: Tenant-scoped only
4. ✅ Webhook failure: Exponential backoff retry
5. ✅ Output states: Linear flow pending→approved/rejected→executed/manual
6. ✅ Concurrent approvals: First-write-wins
7. ✅ Rate limits: Per-agent daily limits
