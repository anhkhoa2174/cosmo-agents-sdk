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

/**
 * Prompt user for an API key and save it to .env file
 */
async function promptAndSaveApiKey(keyName: string, description: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log(chalk.yellow(`\n${description}`));
    rl.question(chalk.cyan(`Paste your ${keyName}: `), async (apiKey) => {
      rl.close();

      const trimmedKey = apiKey.trim();
      if (!trimmedKey) {
        console.log(chalk.red('No API key provided. Exiting.'));
        process.exit(1);
      }

      // Save to .env file
      const envPath = path.resolve(process.cwd(), '.env');
      let envContent = '';

      if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf-8');
        // Check if key already exists and update it
        const regex = new RegExp(`^${keyName}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${keyName}=${trimmedKey}`);
        } else {
          envContent += `\n${keyName}=${trimmedKey}`;
        }
      } else {
        envContent = `${keyName}=${trimmedKey}\n`;
      }

      fs.writeFileSync(envPath, envContent);
      console.log(chalk.green(`✓ ${keyName} saved to .env`));

      // Update process.env so it's available immediately
      process.env[keyName] = trimmedKey;

      resolve(trimmedKey);
    });
  });
}

/**
 * Prompt user to choose authentication method
 */
async function promptAuthMethod(): Promise<'login' | 'apikey'> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log(chalk.yellow('\nNo token found. Choose authentication method:'));
    console.log(chalk.gray('  1. Login with email/password'));
    console.log(chalk.gray('  2. Paste API key directly'));
    rl.question(chalk.cyan('Enter choice (1 or 2): '), (answer) => {
      rl.close();
      resolve(answer.trim() === '2' ? 'apikey' : 'login');
    });
  });
}

async function promptForAuth(baseUrl: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log(chalk.yellow('\n🔑 Authentication required'));
    console.log(chalk.gray('  1. Login with email/password (recommended)'));
    console.log(chalk.gray('  2. Paste JWT token directly'));
    rl.question(chalk.cyan('Choice (1/2): '), async (choice) => {
      rl.close();
      if (choice.trim() === '2') {
        // Paste token
        const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl2.question(chalk.cyan('Paste JWT token: '), (token) => {
          rl2.close();
          const trimmed = token.trim();
          if (!trimmed) {
            console.log(chalk.red('No token provided. Exiting.'));
            process.exit(1);
          }
          saveCachedToken(trimmed, baseUrl, 3600);
          console.log(chalk.green('✓ Token cached.'));
          resolve(trimmed);
        });
      } else {
        // Login
        const creds = await promptForCredentials();
        try {
          const token = await loginAndGetToken(baseUrl, creds.email, creds.password);
          resolve(token);
        } catch (err: any) {
          console.log(chalk.red(`Login failed: ${err.message}`));
          process.exit(1);
        }
      }
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

  // 4. Prompt for auth
  return await promptForAuth(baseUrl);
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
  let anthropicKey = process.env.ANTHROPIC_API_KEY;
  const cosmoBaseUrl = process.env.COSMO_BASE_URL || 'http://localhost:8081';
  const apolloApiKey = process.env.APOLLO_IO_API_KEY;

  if (!anthropicKey) {
    anthropicKey = await promptAndSaveApiKey(
      'ANTHROPIC_API_KEY',
      'ANTHROPIC_API_KEY not found. Get your API key from https://console.anthropic.com/'
    );
  }

  if (apolloApiKey) {
    console.log(chalk.green('✓ Apollo.io API key configured'));
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
    apolloApiKey: apolloApiKey,
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

  // Auto-suggest outreach contacts on startup
  if (agentType === 'outreach' || agentType === 'cosmo') {
    try {
      console.log(chalk.cyan('📬 Daily Outreach Dashboard\n'));
      const client = new CosmoApiClient({ apiKey: cosmoApiKey, baseUrl: cosmoBaseUrl });

      // Fetch data in parallel
      const [coldResult, followupResult, allMeetings] = await Promise.all([
        client.suggestOutreach('cold', 5),
        client.suggestOutreach('followup', 5),
        client.getAllMeetings().catch(() => []),
      ]);

      const coldContacts = coldResult.suggestions || [];
      const coldTotal = coldResult.total || 0;
      const followupContacts = followupResult.suggestions || [];
      const followupTotal = followupResult.total || 0;

      // Filter meetings for today and this week
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      const meetingsToday = allMeetings.filter((m: any) => {
        const meetingTime = new Date(m.time);
        return m.status === 'scheduled' && meetingTime >= todayStart && meetingTime < todayEnd;
      });

      const meetingsThisWeek = allMeetings.filter((m: any) => {
        const meetingTime = new Date(m.time);
        return m.status === 'scheduled' && meetingTime >= todayStart && meetingTime < weekEnd;
      });

      const needsPrep = followupContacts.filter((c: any) => c.next_step === 'PREPARE_MEETING');
      const needsConfirm = followupContacts.filter((c: any) =>
        c.next_step === 'FOLLOW_UP_MEETING_1' || c.next_step === 'FOLLOW_UP_MEETING_2'
      );
      const setMeeting = followupContacts.filter((c: any) => c.next_step === 'SET_MEETING');

      // Summary stats with accurate totals
      console.log(chalk.bold('  Tổng quan hôm nay:'));
      console.log(chalk.gray(`  • ${coldTotal} contacts sẵn sàng gửi tin`));
      console.log(chalk.gray(`  • ${followupTotal} contacts cần follow-up`));
      console.log(chalk.gray(`  • ${meetingsToday.length} meetings hôm nay`));
      console.log(chalk.gray(`  • ${meetingsThisWeek.length - meetingsToday.length} meetings tuần này`));
      if (needsPrep.length > 0) {
        console.log(chalk.yellow(`  • ${needsPrep.length} meetings cần chuẩn bị`));
      }
      if (setMeeting.length > 0) {
        console.log(chalk.green(`  • ${setMeeting.length} contacts nóng - sẵn sàng đặt meeting!`));
      }
      console.log('');

      // Meetings today
      if (meetingsToday.length > 0) {
        console.log(chalk.bold('  Meetings hôm nay:'));
        meetingsToday.slice(0, 3).forEach((m: any, i: number) => {
          const time = new Date(m.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          const title = m.title || 'Meeting';
          console.log(chalk.gray(`  ${i + 1}. ${time} - ${title}`));
        });
        if (meetingsToday.length > 3) {
          console.log(chalk.gray(`  ... và ${meetingsToday.length - 3} meetings khác`));
        }
        console.log('');
      }

      // Hot leads (set meeting)
      if (setMeeting.length > 0) {
        console.log(chalk.bold('  Nóng - Đề xuất meeting ngay:'));
        setMeeting.slice(0, 3).forEach((c: any, i: number) => {
          const name = c.contact?.name || 'No name';
          const company = c.contact?.company || 'No company';
          console.log(chalk.green(`  ${i + 1}. ${name} - ${company}`));
        });
        if (setMeeting.length > 3) {
          console.log(chalk.gray(`  ... và ${setMeeting.length - 3} contacts khác`));
        }
        console.log('');
      }

      // Cold contacts
      if (coldTotal > 0) {
        console.log(chalk.bold(`  Sẵn sàng gửi tin đầu tiên (${coldTotal}):`));
        coldContacts.slice(0, 5).forEach((c: any, i: number) => {
          const name = c.contact?.name || 'No name';
          const company = c.contact?.company || 'No company';
          console.log(chalk.gray(`  ${i + 1}. ${name} - ${company}`));
        });
        if (coldTotal > 5) {
          console.log(chalk.gray(`  ... và ${coldTotal - 5} contacts khác`));
        }
        console.log('');
      }

      // Follow-up contacts
      if (followupTotal > 0) {
        console.log(chalk.bold(`  Cần follow-up (${followupTotal}):`));
        followupContacts.slice(0, 5).forEach((c: any, i: number) => {
          const name = c.contact?.name || 'No name';
          const company = c.contact?.company || 'No company';
          const nextStep = c.next_step || 'FOLLOW_UP';
          const action = nextStep === 'FOLLOW_UP_1' ? 'FU #1 (8h+)' :
                        nextStep === 'FOLLOW_UP_2' ? 'FU #2' :
                        nextStep === 'FOLLOW_UP_MEETING_1' ? 'Confirm meeting #1' :
                        nextStep === 'FOLLOW_UP_MEETING_2' ? 'Confirm meeting #2' :
                        nextStep === 'PREPARE_MEETING' ? 'Chuẩn bị meeting' :
                        'Follow-up';
          console.log(chalk.gray(`  ${i + 1}. ${name} - ${company} - ${action}`));
        });
        if (followupTotal > 5) {
          console.log(chalk.gray(`  ... và ${followupTotal - 5} contacts khác`));
        }
        console.log('');
      }

      if (coldTotal === 0 && followupTotal === 0 && meetingsToday.length === 0) {
        console.log(chalk.gray('  Không có outreach hôm nay - chillax!\n'));
      }
    } catch (error) {
      // Silently ignore suggestion errors - don't block startup
      console.log(chalk.gray('  (Không thể load dashboard)\n'));
    }
  }
  console.log('');
  console.log(chalk.white('Type your message and press Enter. Commands:'));
  console.log(chalk.gray('  /reset  - Clear conversation history'));
  console.log(chalk.gray('  /switch <agent> - Switch agent (research, outreach, analytics, enrichment)'));
  console.log(chalk.gray('  /logout - Clear cached token and re-authenticate'));
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

      if (trimmed === '/logout') {
        try {
          if (fs.existsSync(TOKEN_CACHE_FILE)) {
            fs.unlinkSync(TOKEN_CACHE_FILE);
          }
          console.log(chalk.yellow('Token cleared. Restarting authentication...'));
          rl.close();
          process.exit(0);
        } catch {
          console.log(chalk.red('Failed to clear token'));
        }
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
  console.log(chalk.cyan('COSMO: ') + 'Hello! I\'m COSMO, your AI-powered CRM assistant.\n');
  console.log(chalk.bold('📇 Contact Management'));
  console.log('  • Search contacts - "Find contacts named John"');
  console.log('  • Create contact - "Create new contact: john@example.com"');
  console.log('  • View details - "Show me contact ABC-123"');

  console.log(chalk.bold('\n🧠 AI Intelligence'));
  console.log('  • Enrich contact - "Analyze and enrich this contact"');
  console.log('  • Pain points & goals - "What are this contact\'s pain points?"');
  console.log('  • Buying signals - "Any buying signals for this contact?"');
  console.log('  • Relationship score - "How strong is our relationship?"');

  console.log(chalk.bold('\n🔍 Smart Search (AI-powered)'));
  console.log('  • Semantic search - "Find CTOs interested in AI"');
  console.log('  • Similar contacts - "Find contacts similar to John"');
  console.log('  • Search knowledge - "Find case studies about fintech"');
  console.log('  • Search interactions - "Find emails about pricing"');

  console.log(chalk.bold('\n📊 Segments & Scoring'));
  console.log('  • List segments - "Show all segments"');
  console.log('  • Create segment - "Create segment Enterprise Fintech"');
  console.log('  • Calculate fit score - "Which segment fits this contact?"');
  console.log('  • Segment health - "Analyze health of segment X"');

  console.log(chalk.bold('\n📧 Playbooks & Automation'));
  console.log('  • List playbooks - "Show available playbooks"');
  console.log('  • Create playbook - "Create nurture playbook for startups"');
  console.log('  • Enroll contact - "Add John to Welcome playbook"');
  console.log('  • Recommend contacts - "Suggest contacts for playbook X"');
  console.log('  • Automation rules - "Create auto-enroll rule for segment"');

  console.log(chalk.bold('\n📈 Analytics'));
  console.log('  • Count contacts - "How many contacts added today?"');
  console.log('  • Count by keyword - "How many contacts in Fintech?"');

  console.log('\n' + chalk.gray('Type /help for commands, /exit to quit.\n'));
  console.log('What would you like to do?');

  prompt();
}

async function runAnalysis(contactId: string) {
  console.log(chalk.cyan(`\nRunning full analysis on contact: ${contactId}\n`));

  let anthropicKey = process.env.ANTHROPIC_API_KEY;
  const cosmoBaseUrl = process.env.COSMO_BASE_URL || 'http://localhost:8081';

  if (!anthropicKey) {
    anthropicKey = await promptAndSaveApiKey(
      'ANTHROPIC_API_KEY',
      'ANTHROPIC_API_KEY not found. Get your API key from https://console.anthropic.com/'
    );
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
