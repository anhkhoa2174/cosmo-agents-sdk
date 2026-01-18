# COSMO Agents SDK

Claude Agent Development Kit integration for COSMO CRM. Enables AI-powered CRM interactions through a chat interface.

## Features

- **Contact Intelligence**: Search, view, and manage contacts
- **AI Enrichment**: Generate pain points, goals, and buying signals
- **Segment Scoring**: Calculate fit scores for market segments
- **Relationship Analysis**: Track engagement and relationship health
- **Orchestrated Workflows**: Run multi-step analysis pipelines

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Start interactive chat
npm run chat
```

## Usage

### Interactive Chat

```bash
npm run chat
```

This starts an interactive CLI where you can chat with COSMO agent:

```
You: Find contacts at Acme Corp
COSMO: I found 3 contacts at Acme Corp:
  1. John Smith (john@acme.com) - VP Sales
  2. Jane Doe (jane@acme.com) - Director Marketing
  ...

You: Run a full analysis on John
COSMO: → Executing tool: get_contact
       → Executing tool: enrich_contact
       → Executing tool: calculate_segment_scores

Here's the complete analysis for John Smith:
- AI Insights: 3 pain points, 2 goals, 1 buying signal
- Best Segment Match: Enterprise (85% fit)
- Relationship: Strong (72% strength)
...
```

### Programmatic Usage

```typescript
import { CosmoAgent } from 'cosmo-agents-sdk';

const agent = new CosmoAgent({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  apiKey: process.env.COSMO_API_KEY,
  baseUrl: 'http://localhost:8080',
});

// Chat with the agent
const response = await agent.chat('Show me contacts with high fit scores');
console.log(response);
```

## Available Tools

| Tool | Description |
|------|-------------|
| `search_contacts` | Search contacts by name, email, company |
| `get_contact` | Get detailed contact information |
| `create_contact` | Create a new contact |
| `enrich_contact` | Run AI enrichment for insights |
| `calculate_segment_scores` | Calculate segment fit scores |
| `calculate_relationship_score` | Analyze relationship health |
| `list_segments` | List all segments |
| `get_segment_contacts` | Get contacts in a segment |
| `run_full_analysis` | Run complete analysis pipeline |
| `analyze_segment_health` | Analyze segment metrics |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    COSMO Agent CLI                       │
│                   (Interactive Chat)                     │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   CosmoAgent                             │
│              (Claude + Tool Orchestration)               │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Anthropic  │  │    Tool     │  │ Conversation│      │
│  │   Client    │  │  Executor   │  │   History   │      │
│  └─────────────┘  └──────┬──────┘  └─────────────┘      │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│                  CosmoApiClient                          │
│              (Backend API Wrapper)                       │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              COSMO Backend (Go)                          │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────┐  │
│  │ Enrichment    │  │  Segment      │  │ Relationship│  │
│  │ Agent         │  │  Calculator   │  │ Scorer      │  │
│  └───────────────┘  └───────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Development

```bash
# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `COSMO_BASE_URL` | No | Backend URL (default: http://localhost:8080) |
| `COSMO_API_KEY` | Yes | JWT token for COSMO API |
