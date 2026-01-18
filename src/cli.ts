#!/usr/bin/env node

/**
 * COSMO Agent CLI
 *
 * Interactive chat interface for COSMO AI Agent
 *
 * Usage:
 *   npm run chat
 *   npx tsx src/cli.ts chat
 */

// Disable Anthropic SDK debug logging
process.env.DEBUG = '';

import { Command } from 'commander';
import * as readline from 'readline';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { CosmoAgent } from './agents/cosmo-agent.js';
import { ResearchAgent } from './agents/research-agent.js';
import { OutreachAgent } from './agents/outreach-agent.js';
import { AnalyticsAgent } from './agents/analytics-agent.js';
import { EnrichmentAgent } from './agents/enrichment-agent.js';
import { BaseAgent, type BaseAgentConfig } from './agents/base-agent.js';
import { CosmoApiClient } from './tools/cosmo-api.js';

// Token cache file path
const TOKEN_CACHE_FILE = path.join(os.homedir(), '.cosmo-cli-token.json');

interface TokenCache {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  base_url: string;
}

function loadCachedToken(baseUrl: string): string | null {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const cache: TokenCache = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8'));
      // Check if token is for same base URL and not expired
      if (cache.base_url === baseUrl) {
        if (cache.expires_at && Date.now() > cache.expires_at) {
          return null; // Token expired
        }
        return cache.access_token;
      }
    }
  } catch {
    // Ignore cache read errors
  }
  return null;
}

function saveCachedToken(token: string, baseUrl: string, expiresInSeconds?: number): void {
  try {
    const cache: TokenCache = {
      access_token: token,
      base_url: baseUrl,
      expires_at: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined,
    };
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(cache, null, 2), { mode: 0o600 });
  } catch {
    // Ignore cache write errors
  }
}

async function loginAndGetToken(baseUrl: string, email: string, password: string): Promise<string> {
  const response = await fetch(`${baseUrl}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Login failed: ${error}`);
  }

  const data = await response.json() as { data: { token?: string; access_token?: string; expires_in?: number } };
  const token = data.data.token || data.data.access_token;

  if (!token) {
    throw new Error('No token in response');
  }

  // Cache the token (default 23 hours if not specified)
  saveCachedToken(token, baseUrl, data.data.expires_in || 23 * 60 * 60);

  return token;
}

async function promptForCredentials(): Promise<{ email: string; password: string }> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow('Email: '), (email) => {
      // Hide password input
      process.stdout.write(chalk.yellow('Password: '));
      let password = '';

      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      const onData = (char: string) => {
        if (char === '\n' || char === '\r') {
          stdin.setRawMode(wasRaw || false);
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          rl.close();
          resolve({ email, password });
        } else if (char === '\u0003') {
          // Ctrl+C
          process.exit(0);
        } else if (char === '\u007F' || char === '\b') {
          // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
          }
        } else {
          password += char;
        }
      };

      stdin.on('data', onData);
    });
  });
}

async function getOrRefreshToken(baseUrl: string): Promise<string> {
  // 1. Check environment variable first
  if (process.env.COSMO_API_KEY) {
    return process.env.COSMO_API_KEY;
  }

  // 2. Check cached token
  const cachedToken = loadCachedToken(baseUrl);
  if (cachedToken) {
    console.log(chalk.gray('Using cached token...'));
    return cachedToken;
  }

  // 3. Check for email/password in env
  const email = process.env.COSMO_EMAIL;
  const password = process.env.COSMO_PASSWORD;

  if (email && password) {
    console.log(chalk.gray('Logging in with credentials from environment...'));
    return await loginAndGetToken(baseUrl, email, password);
  }

  // 4. Prompt for credentials
  console.log(chalk.yellow('\nNo token found. Please login:'));
  const credentials = await promptForCredentials();
  return await loginAndGetToken(baseUrl, credentials.email, credentials.password);
}

type AgentType = 'cosmo' | 'research' | 'outreach' | 'analytics' | 'enrichment';

function createAgent(type: AgentType, config: BaseAgentConfig): BaseAgent | CosmoAgent {
  switch (type) {
    case 'research':
      return new ResearchAgent(config);
    case 'outreach':
      return new OutreachAgent(config);
    case 'analytics':
      return new AnalyticsAgent(config);
    case 'enrichment':
      return new EnrichmentAgent(config);
    case 'cosmo':
    default:
      return new CosmoAgent(config);
  }
}

// Load environment variables
// Try multiple .env locations: current dir, parent dir (for monorepo), backend dir
const envPaths = [
  '.env',
  '../.env',
  '../cosmo-agents-backend/.env',
];
for (const envPath of envPaths) {
  dotenv.config({ path: path.resolve(process.cwd(), envPath) });
}

const program = new Command();

program
  .name('cosmo')
  .description('COSMO AI Agent CLI - Intelligent CRM Assistant')
  .version('1.0.0');

program
  .command('chat')
  .description('Start interactive chat with COSMO agent')
  .option('-m, --model <model>', 'Claude model to use', 'claude-sonnet-4-20250514')
  .option('-a, --agent <type>', 'Agent type: cosmo, research, outreach, analytics, enrichment', 'cosmo')
  .option('-s, --session <id>', 'Session ID for persistent history')
  .action(async (options) => {
    await startChat(options.model, options.agent as AgentType, options.session);
  });

program
  .command('analyze')
  .description('Run analysis on a contact')
  .argument('<contact-id>', 'Contact ID to analyze')
  .action(async (contactId) => {
    await runAnalysis(contactId);
  });

program
  .command('stats')
  .description('Count contacts created in a day or month (no Claude required)')
  .option('--day <YYYY-MM-DD>', 'Date to count contacts (UTC)')
  .option('--month <YYYY-MM>', 'Month to count contacts (UTC)')
  .option('--start <ISO>', 'Start datetime (ISO 8601, UTC)')
  .option('--end <ISO>', 'End datetime (ISO 8601, UTC, exclusive)')
  .action(async (options) => {
    await runStats(options);
  });

program
  .command('login')
  .description('Login to COSMO and cache token')
  .action(async () => {
    const cosmoBaseUrl = process.env.COSMO_BASE_URL || 'http://localhost:8081';
    console.log(chalk.cyan('Login to COSMO\n'));
    console.log(chalk.gray(`API: ${cosmoBaseUrl}\n`));

    const credentials = await promptForCredentials();
    try {
      await loginAndGetToken(cosmoBaseUrl, credentials.email, credentials.password);
      console.log(chalk.green('\n✓ Login successful! Token cached.'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(chalk.red(`\nLogin failed: ${message}`));
      process.exit(1);
    }
  });

program
  .command('logout')
  .description('Clear cached token')
  .action(() => {
    try {
      if (fs.existsSync(TOKEN_CACHE_FILE)) {
        fs.unlinkSync(TOKEN_CACHE_FILE);
        console.log(chalk.green('✓ Token cleared'));
      } else {
        console.log(chalk.gray('No cached token found'));
      }
    } catch {
      console.log(chalk.red('Failed to clear token'));
    }
  });

program.parse();

async function startChat(model: string, agentType: AgentType = 'cosmo', sessionId?: string) {
  const agentNames: Record<AgentType, string> = {
    cosmo: 'COSMO (Full CRM Intelligence)',
    research: 'Research Agent (Find & Analyze)',
    outreach: 'Outreach Agent (Communications)',
    analytics: 'Analytics Agent (Reports & Metrics)',
    enrichment: 'Enrichment Agent (Data & Scoring)',
  };

  console.log(chalk.cyan('\n╔═══════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║') + chalk.bold.white('       COSMO AI Agent - CRM Intelligence       ') + chalk.cyan('║'));
  console.log(chalk.cyan('╚═══════════════════════════════════════════════╝\n'));

  // Validate environment
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const cosmoBaseUrl = process.env.COSMO_BASE_URL || 'http://localhost:8081';

  if (!anthropicKey) {
    console.log(chalk.red('Error: ANTHROPIC_API_KEY not set'));
    console.log(chalk.gray('Set it in .env file or environment variable'));
    process.exit(1);
  }

  // Get token (from env, cache, or login)
  let cosmoApiKey: string;
  try {
    cosmoApiKey = await getOrRefreshToken(cosmoBaseUrl);
    console.log(chalk.green('✓ Authenticated'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`Authentication failed: ${message}`));
    process.exit(1);
  }

  // Initialize agent
  const config: BaseAgentConfig = {
    anthropicApiKey: anthropicKey,
    apiKey: cosmoApiKey,
    baseUrl: cosmoBaseUrl,
    model,
    sessionId,
    persistHistory: !!sessionId,
  };

  const agent = createAgent(agentType, config);

  // Load context and history for BaseAgent types
  if (agent instanceof BaseAgent) {
    console.log(chalk.gray('Loading context...'));
    await agent.loadContext();
    if (sessionId) {
      await agent.loadHistory();
    }
  }

  console.log(chalk.gray(`Agent: ${agentNames[agentType]}`));
  console.log(chalk.gray(`Model: ${model}`));
  console.log(chalk.gray(`COSMO API: ${cosmoBaseUrl}`));
  if (sessionId) {
    console.log(chalk.gray(`Session: ${sessionId}`));
  }
  console.log('');
  console.log(chalk.white('Type your message and press Enter. Commands:'));
  console.log(chalk.gray('  /reset  - Clear conversation history'));
  console.log(chalk.gray('  /switch <agent> - Switch agent (research, outreach, analytics, enrichment)'));
  console.log(chalk.gray('  /exit   - Exit the chat\n'));

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question(chalk.green('\nYou: '), async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      // Handle commands
      if (trimmed === '/exit' || trimmed === '/quit') {
        console.log(chalk.cyan('\nGoodbye! 👋\n'));
        rl.close();
        process.exit(0);
      }

      if (trimmed === '/reset') {
        agent.resetConversation();
        console.log(chalk.yellow('Conversation reset.'));
        prompt();
        return;
      }

      if (trimmed === '/history') {
        if (agent instanceof CosmoAgent) {
          const history = agent.getHistory();
          console.log(chalk.gray('\n--- Conversation History ---'));
          for (const msg of history) {
            const prefix = msg.role === 'user' ? 'You' : 'COSMO';
            console.log(chalk.gray(`${prefix}: ${msg.content.slice(0, 100)}...`));
          }
          console.log(chalk.gray('--- End History ---\n'));
        } else {
          console.log(chalk.yellow('History command not available for this agent type.'));
        }
        prompt();
        return;
      }

      // Process with agent
      try {
        console.log(chalk.gray('\nThinking...'));

        const result = await agent.chat(trimmed);

        // Handle different return types
        if (typeof result === 'string') {
          console.log(chalk.cyan('\nCOSMO: ') + result);
        } else {
          console.log(chalk.cyan('\nCOSMO: ') + result.response);
          if (result.toolsUsed.length > 0) {
            console.log(chalk.gray(`Tools used: ${result.toolsUsed.join(', ')}`));
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(chalk.red(`\nError: ${message}`));
      }

      prompt();
    });
  };

  // Start prompting
  console.log(chalk.cyan('COSMO: ') + 'Hello! I\'m COSMO, your AI-powered CRM assistant. I can help you:');
  console.log('  • Search and analyze contacts');
  console.log('  • Generate AI insights (pain points, goals, buying signals)');
  console.log('  • Calculate segment fit scores');
  console.log('  • Analyze relationship health');
  console.log('\nWhat would you like to do?');

  prompt();
}

async function runAnalysis(contactId: string) {
  console.log(chalk.cyan(`\nRunning full analysis on contact: ${contactId}\n`));

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const cosmoBaseUrl = process.env.COSMO_BASE_URL || 'http://localhost:8081';

  if (!anthropicKey) {
    console.log(chalk.red('Error: ANTHROPIC_API_KEY not set'));
    process.exit(1);
  }

  let cosmoApiKey: string;
  try {
    cosmoApiKey = await getOrRefreshToken(cosmoBaseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`Authentication failed: ${message}`));
    process.exit(1);
  }

  const agent = new CosmoAgent({
    anthropicApiKey: anthropicKey,
    apiKey: cosmoApiKey,
    baseUrl: cosmoBaseUrl,
  });

  try {
    const response = await agent.chat(
      `Run a full analysis on contact ${contactId} and give me a comprehensive summary.`
    );
    console.log(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`Error: ${message}`));
    process.exit(1);
  }
}

async function runStats(options: {
  day?: string;
  month?: string;
  start?: string;
  end?: string;
}) {
  const cosmoBaseUrl = process.env.COSMO_BASE_URL || 'http://localhost:8081';

  let cosmoApiKey: string;
  try {
    cosmoApiKey = await getOrRefreshToken(cosmoBaseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`Authentication failed: ${message}`));
    process.exit(1);
  }

  const { start, end } = resolveDateRange(options);
  const client = new CosmoApiClient({
    apiKey: cosmoApiKey,
    baseUrl: cosmoBaseUrl,
  });

  try {
    const total = await client.countContactsCreated(
      start.toISOString(),
      end.toISOString()
    );

    console.log(
      chalk.cyan(
        `Contacts created from ${start.toISOString()} to ${end.toISOString()} (UTC): ${total}`
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(chalk.red(`Error: ${message}`));
    process.exit(1);
  }
}

function resolveDateRange(options: {
  day?: string;
  month?: string;
  start?: string;
  end?: string;
}): { start: Date; end: Date } {
  if (options.start && options.end) {
    return { start: new Date(options.start), end: new Date(options.end) };
  }

  if (options.month) {
    const [yearStr, monthStr] = options.month.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) {
      throw new Error('Invalid --month format. Use YYYY-MM.');
    }
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
    return { start, end };
  }

  if (options.day) {
    const [yearStr, monthStr, dayStr] = options.day.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) {
      throw new Error('Invalid --day format. Use YYYY-MM-DD.');
    }
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const end = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
    return { start, end };
  }

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return { start, end };
}
