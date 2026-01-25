# Quickstart: Configurable Agent System

## Prerequisites

- Node.js 22+
- AWS credentials (for S3 and DynamoDB)
- Anthropic API key
- mem0 API key (or OpenAI key for self-hosted)

## Installation

```bash
# Install new dependencies
npm install mem0ai @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

## Environment Setup

Add to your `.env`:

```bash
# Existing
ANTHROPIC_API_KEY=sk-ant-...
COSMO_API_KEY=your-jwt-token
COSMO_BASE_URL=http://localhost:8080

# New - Memory Provider
MEM0_API_KEY=m0-...  # For mem0 platform
# OR for self-hosted mem0:
OPENAI_API_KEY=sk-...  # For embeddings and memory extraction

# New - Output Storage
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=cosmo-agent-outputs
DYNAMODB_TABLE=agent-outputs
```

## Quick Example

### 1. Create a Persona

```typescript
import { PersonaManager } from './src/personas/persona-manager.js';

const personaManager = new PersonaManager({ apiKey: process.env.COSMO_API_KEY });

const persona = await personaManager.create({
  name: 'Enterprise Sales Rep',
  role: 'Senior Account Executive',
  communication_style: 'professional, consultative, value-focused',
  tone: 'confident but approachable',
  target_audience: 'C-level executives and VP-level decision makers',
  signature_elements: [
    'Always lead with business value',
    'Use data to support claims',
    'End with clear next steps'
  ],
  example_messages: [
    'Hi [Name], I noticed your company recently expanded into the APAC region. Many of our clients in similar situations have used [Product] to streamline their go-to-market strategy. Would you be open to a 15-minute call to explore if we could help?'
  ]
});

console.log('Created persona:', persona.id);
```

### 2. Create a Configurable Agent

```typescript
import { ConfigurableAgent } from './src/agents/configurable-agent.js';
import { createMemoryManager } from './src/memory/memory-manager.js';

// Initialize memory
const memory = createMemoryManager({
  provider: 'mem0',
  mem0: {
    apiKey: process.env.MEM0_API_KEY
  }
});

// Create agent
const agent = new ConfigurableAgent({
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  baseUrl: process.env.COSMO_BASE_URL!,
  apiKey: process.env.COSMO_API_KEY!,

  // Agent configuration
  name: 'Enterprise Outreach Bot',
  personaId: persona.id,
  systemPrompt: `You are a sales development representative helping with enterprise outreach.
Your goal is to generate personalized, compelling outreach messages.

When generating content:
1. Research the prospect using available tools
2. Identify relevant pain points and opportunities
3. Craft messages that resonate with the prospect's situation
4. Always include a clear call-to-action`,

  skillIds: [
    'search_contacts',
    'get_contact',
    'enrich_contact',
    'search_knowledge',
    'generate_outreach'  // Custom skill
  ],

  memoryConfig: {
    provider: 'mem0',
    scope: 'user',
    retention_days: 90
  },

  // Memory manager instance
  memory,
  userId: 'user-123',

  // Output settings
  webhookUrl: 'https://your-app.com/webhooks/approval',
  dailyOutputLimit: 100
});
```

### 3. Start a Session and Chat

```typescript
// Start session
const session = await agent.startSession({
  metadata: { campaign: 'Q1-enterprise-push' }
});

// Chat with the agent
const response = await agent.chat(
  'Generate an outreach email for John Smith at Acme Corp. He'\''s the VP of Engineering and they recently raised Series B.'
);

console.log('Agent response:', response.message);
console.log('Outputs generated:', response.outputs.length);

// Each output is stored in S3 with pending status
for (const output of response.outputs) {
  console.log(`Output ${output.id}: ${output.status}`);
  console.log(`Preview: ${output.content_preview}`);
}
```

### 4. Handle Approvals

```typescript
import { OutputManager } from './src/outputs/output-manager.js';

const outputManager = new OutputManager({
  bucket: process.env.S3_BUCKET!,
  tableName: process.env.DYNAMODB_TABLE!
});

// List pending outputs for an agent
const pendingOutputs = await outputManager.listPending(agent.id);

for (const output of pendingOutputs) {
  console.log(`Pending: ${output.id}`);

  // Get full content
  const contentUrl = await outputManager.getContentUrl(output.id);
  console.log(`View at: ${contentUrl}`);
}

// Approve an output
await outputManager.approve(pendingOutputs[0].id, {
  userId: 'user-123',
  autoExecute: true,  // Will trigger automation if skill is automatable
  notes: 'Looks good, send it!'
});
```

### 5. Webhook Handling (Express Example)

```typescript
import express from 'express';
import crypto from 'crypto';

const app = express();

// Webhook endpoint for receiving approval notifications
app.post('/webhooks/approval', express.json(), async (req, res) => {
  // Verify webhook signature
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const expectedSig = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { outputId, contentUrl, approvalToken, agentName } = req.body;

  // Send to Slack, email, or your approval UI
  await sendToSlack({
    text: `New output from ${agentName} needs approval`,
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `*Agent:* ${agentName}` }},
      { type: 'actions', elements: [
        { type: 'button', text: { type: 'plain_text', text: 'View Content' }, url: contentUrl },
        { type: 'button', text: { type: 'plain_text', text: 'Approve' }, action_id: `approve_${outputId}` },
        { type: 'button', text: { type: 'plain_text', text: 'Reject' }, action_id: `reject_${outputId}` }
      ]}
    ]
  });

  res.json({ received: true });
});

// Callback from your approval system
app.post('/api/outputs/:outputId/approve', async (req, res) => {
  const { outputId } = req.params;
  const { autoExecute, notes } = req.body;

  try {
    const output = await outputManager.approve(outputId, {
      userId: req.user.id,
      autoExecute,
      notes
    });
    res.json(output);
  } catch (error) {
    if (error.message === 'Output already decided') {
      res.status(409).json({ error: error.message });
    } else {
      throw error;
    }
  }
});
```

## Adding Custom Skills

```typescript
import { SkillRegistry } from './src/skills/skill-registry.js';

const skillRegistry = new SkillRegistry();

// Register a custom skill
skillRegistry.register({
  id: 'generate_outreach',
  name: 'generate_outreach',
  displayName: 'Generate Outreach',
  description: 'Generate personalized outreach content (email, LinkedIn message, etc.)',
  category: 'outreach',
  isAutomatable: false,  // Requires human approval
  inputSchema: {
    type: 'object',
    properties: {
      contactId: { type: 'string', description: 'Contact to reach out to' },
      channel: { type: 'string', enum: ['email', 'linkedin', 'twitter'] },
      objective: { type: 'string', description: 'Goal of the outreach' }
    },
    required: ['contactId', 'channel']
  },
  handler: async (input, context) => {
    // Your custom logic here
    const contact = await context.api.getContact(input.contactId);
    const knowledge = await context.knowledgeBase.search(contact.company);

    // Generate content using Claude
    const content = await context.llm.generate({
      prompt: `Generate a ${input.channel} message for ${contact.name}...`,
      persona: context.persona
    });

    // Store as output for approval
    return context.createOutput({
      content,
      contentType: 'text',
      isAutomatable: false
    });
  }
});
```

## Memory Context Example

```typescript
// Agent automatically injects relevant memories into context
const response1 = await agent.chat('Find me contacts at Acme Corp');
// Agent learns about your interest in Acme Corp

// Later in the same or different session...
const response2 = await agent.chat('What do we know about their tech stack?');
// Agent retrieves: "User is interested in Acme Corp" from memory
// Provides context-aware response about Acme's tech stack
```

## Testing with In-Memory Provider

```typescript
// For tests, use in-memory provider
const testMemory = createMemoryManager({
  provider: 'in-memory'
});

const testAgent = new ConfigurableAgent({
  // ... config
  memory: testMemory
});

// Memory won't persist between test runs
```

## Next Steps

1. **Create personas** for your sales team roles
2. **Define skills** needed for your workflows
3. **Set up webhooks** for your approval system (Slack, email, custom UI)
4. **Configure knowledge bases** with your product/company information
5. **Test with in-memory** provider before going to production
