# CLAUDE.md - Project Guide for Claude Code

## Project Overview

**COSMO Agents SDK** is a Claude-integrated AI Agent Development Kit for AI-powered CRM intelligence and sales operations. It enables teams to leverage Claude's capabilities to interact with contact databases, enrich prospect data, calculate segment fit scores, analyze relationships, and orchestrate multi-step analysis workflows.

## Tech Stack

- **Runtime**: Node.js with TypeScript 5.7.3 (strict mode)
- **Module System**: ES Modules (`"type": "module"`)
- **Target**: ES2022
- **Key Dependencies**:
  - `@anthropic-ai/sdk` - Claude API client
  - `@modelcontextprotocol/sdk` - MCP support
  - `axios` - HTTP client for Apollo.io
  - `commander` - CLI framework
  - `inquirer` - Interactive prompts
  - `zod` - Schema validation

## Project Structure

```
src/
├── agents/                    # Multi-agent orchestration
│   ├── base-agent.ts          # Base class for all agents
│   ├── cosmo-agent.ts         # Main COSMO agent
│   ├── orchestrator.ts        # Multi-agent orchestrator
│   ├── research-agent.ts      # Contact finding & analysis
│   ├── enrichment-agent.ts    # AI enrichment & scoring
│   ├── outreach-agent.ts      # Email & playbook management
│   └── analytics-agent.ts     # Reporting & analytics
├── tools/                     # Tool execution layer
│   ├── definitions.ts         # 40+ tool definitions for Claude
│   ├── executor.ts            # Tool execution dispatcher
│   └── cosmo-api.ts           # COSMO backend API client
├── mcp/                       # Model Context Protocol
│   ├── mcp-client.ts          # MCP server connections
│   ├── apollo-client.ts       # Apollo.io API wrapper
│   └── index.ts               # MCP exports
├── cli.ts                     # Interactive chat CLI
└── index.ts                   # SDK exports
```

## Common Commands

```bash
# Development
npm run dev          # Run CLI in dev mode with tsx
npm run chat         # Interactive chat mode
npm run build        # TypeScript compilation
npm run start        # Production mode

# Type checking
npx tsc --noEmit     # Type check without emitting
```

## Architecture Patterns

### Agent System
- **BaseAgent**: Abstract base class with context loading, conversation history, selective tool access
- **CosmoAgent**: Main agent with full tool access (backwards compatible)
- **Specialized Agents**: ResearchAgent, OutreachAgent, AnalyticsAgent, EnrichmentAgent
- **AgentOrchestrator**: Coordinates multiple agents with delegation tools

### Tool System
- Tools defined in `src/tools/definitions.ts` (40+ tools)
- Executor in `src/tools/executor.ts` dispatches to handlers
- Categories: Contact Management, Intelligence, Segments, Playbooks, Apollo.io, Analytics

### MCP Integration
- `MCPClientManager` manages connections to MCP servers
- Supports stdio and SSE transports
- `ApolloApiClient` for direct Apollo.io API

## Environment Variables

Required:
- `ANTHROPIC_API_KEY` - Claude API key
- `COSMO_API_KEY` - JWT token for backend

Optional:
- `COSMO_BASE_URL` - Backend URL (default: http://localhost:8080)
- `COSMO_MODEL` - Model override (default: claude-sonnet-4-20250514)

## Code Style Guidelines

- Use TypeScript strict mode
- Prefer async/await over raw promises
- Use Zod for runtime validation
- Tools return JSON-serialized results
- Agents implement agentic loop (max 10 iterations default)
- All API calls wrapped in try-catch

## Key Interfaces

- `Contact` - Full contact profile with enrichment data
- `Segment` - Grouping criteria and enrollment
- `Playbook` - Automated sequence definitions
- `AgentResult` - Standard agent response format
- `ToolName` - Union type of all tool names

## Testing

Currently no test framework configured. When adding tests:
- Consider vitest for ES Module compatibility
- Mock API calls to COSMO backend and Apollo.io
- Test tool executor with fixture data

## Common Tasks

### Adding a New Tool
1. Define tool schema in `src/tools/definitions.ts`
2. Add handler in `src/tools/executor.ts`
3. Add API method in `src/tools/cosmo-api.ts` if needed
4. Update tool access lists in relevant agents

### Adding a New Agent
1. Extend `BaseAgent` in `src/agents/`
2. Define `agentType` and `toolNames`
3. Create specialized system prompt
4. Register in `AgentOrchestrator` if needed

### Working with Apollo.io
- Use `apollo_people_search` for finding prospects
- Use `import_apollo_contacts_to_cosmo` to import to CRM
- API client initialized lazily in executor

## Active Technologies
- TypeScript 5.7.3, Node.js (ES Modules) + @anthropic-ai/sdk ^0.39.0, axios ^1.6.7, zod ^3.24.2 (001-sdk-backend-parity)
- N/A (SDK is stateless, calls backend API) (001-sdk-backend-parity)
- TypeScript 5.7.3, Node.js (ES Modules) + vitest (new), @anthropic-ai/sdk, axios (002-outreach-integration-tests)
- N/A (tests call backend API) (002-outreach-integration-tests)
- Go 1.21+ (backend), TypeScript 5.7+ / Next.js (frontend) + Fiber (HTTP), GORM (ORM), OpenAI (AI generation), React Query, ky (HTTP client), shadcn/ui (003-fix-outreach-bugs)
- PostgreSQL (existing schema, no migrations needed) (003-fix-outreach-bugs)

## Recent Changes
- 001-sdk-backend-parity: Added TypeScript 5.7.3, Node.js (ES Modules) + @anthropic-ai/sdk ^0.39.0, axios ^1.6.7, zod ^3.24.2
