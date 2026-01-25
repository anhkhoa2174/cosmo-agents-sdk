# COSMO Agents SDK - Project Constitution

## Core Principles

### 1. AI-First Design
- Claude is the primary interface for CRM intelligence
- Tools should be designed for AI consumption and orchestration
- System prompts guide agent behavior effectively

### 2. Modular Agent Architecture
- Agents are specialized for specific domains (research, outreach, analytics, enrichment)
- BaseAgent provides common functionality; specialized agents extend it
- AgentOrchestrator coordinates multi-agent workflows

### 3. Tool-Centric Operations
- All CRM operations exposed as Claude-callable tools
- Tools return structured JSON for AI reasoning
- Tool definitions in `src/tools/definitions.ts` are the source of truth

### 4. Type Safety
- TypeScript strict mode is mandatory
- Zod for runtime validation at boundaries
- Interfaces define data contracts

### 5. Backend Agnostic
- SDK communicates via REST API to COSMO backend
- CosmoApiClient abstracts backend details
- Environment variables configure endpoints

## Development Guidelines

### Code Organization
- Agents in `src/agents/`
- Tools in `src/tools/`
- MCP integrations in `src/mcp/`
- CLI entry point in `src/cli.ts`

### Adding Features
1. Start with a spec in `.specledger/features/`
2. Create implementation plan
3. Break into trackable tasks in `.beads/`
4. Implement with type safety
5. Test with the CLI

### Tool Design
- Tools should be atomic and focused
- Return complete context for AI reasoning
- Include relevant metadata in responses
- Handle errors gracefully with descriptive messages

### Agent Design
- Clear system prompts define behavior
- Selective tool access per agent type
- Session persistence for conversation continuity
- Max iterations prevent infinite loops

## Quality Standards

### Code Quality
- No `any` types except in exceptional cases
- Async/await over raw promises
- Error handling at boundaries
- Meaningful variable and function names

### API Design
- RESTful patterns for backend communication
- Consistent response structures
- Proper HTTP status code usage
- Authentication via JWT tokens

### Documentation
- CLAUDE.md for Claude Code context
- JSDoc comments for public APIs
- README.md for user documentation

## Integration Guidelines

### Apollo.io
- Lazy initialization of API client
- Smart import to avoid duplicate API calls
- Respect API rate limits

### MCP Protocol
- Support both stdio and SSE transports
- Tool caching for efficiency
- Graceful degradation if MCP unavailable

## Security Considerations

- Never log sensitive data (API keys, tokens)
- Token cached with 600 permissions
- Environment variables for secrets
- Input validation on external data
