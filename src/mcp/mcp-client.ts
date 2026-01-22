/**
 * MCP Client wrapper for connecting to MCP servers
 * Supports both stdio and SSE transports
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

export interface MCPServerConfig {
  name: string;
  transport: 'stdio' | 'sse';
  // For stdio transport
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  // For SSE transport
  url?: string;
  headers?: Record<string, string>;
}

export interface MCPClientConfig {
  servers: MCPServerConfig[];
}

export class MCPClientManager {
  private clients: Map<string, Client> = new Map();
  private transports: Map<string, StdioClientTransport | SSEClientTransport> = new Map();
  private toolsCache: Map<string, any[]> = new Map();

  constructor(private config: MCPClientConfig) {}

  /**
   * Connect to all configured MCP servers
   */
  async connect(): Promise<void> {
    for (const serverConfig of this.config.servers) {
      await this.connectToServer(serverConfig);
    }
  }

  /**
   * Connect to a single MCP server
   */
  private async connectToServer(serverConfig: MCPServerConfig): Promise<void> {
    const client = new Client({
      name: `cosmo-sdk-${serverConfig.name}`,
      version: '1.0.0',
    });

    let transport: StdioClientTransport | SSEClientTransport;

    if (serverConfig.transport === 'stdio') {
      if (!serverConfig.command) {
        throw new Error(`Stdio transport requires 'command' for server ${serverConfig.name}`);
      }
      transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args || [],
        env: { ...process.env, ...serverConfig.env } as Record<string, string>,
      });
    } else if (serverConfig.transport === 'sse') {
      if (!serverConfig.url) {
        throw new Error(`SSE transport requires 'url' for server ${serverConfig.name}`);
      }
      transport = new SSEClientTransport(new URL(serverConfig.url));
    } else {
      throw new Error(`Unsupported transport: ${serverConfig.transport}`);
    }

    await client.connect(transport);

    this.clients.set(serverConfig.name, client);
    this.transports.set(serverConfig.name, transport);

    // Cache available tools
    const toolsResult = await client.listTools();
    this.toolsCache.set(serverConfig.name, toolsResult.tools);
  }

  /**
   * Get all available tools from all connected servers
   */
  getAllTools(): { serverName: string; tools: any[] }[] {
    const result: { serverName: string; tools: any[] }[] = [];
    for (const [serverName, tools] of this.toolsCache) {
      result.push({ serverName, tools });
    }
    return result;
  }

  /**
   * Get tools from a specific server
   */
  getToolsFromServer(serverName: string): any[] {
    return this.toolsCache.get(serverName) || [];
  }

  /**
   * Find which server has a tool
   */
  findServerForTool(toolName: string): string | null {
    for (const [serverName, tools] of this.toolsCache) {
      if (tools.some((t: any) => t.name === toolName)) {
        return serverName;
      }
    }
    return null;
  }

  /**
   * Call a tool on the appropriate server
   */
  async callTool(toolName: string, args: Record<string, unknown>): Promise<any> {
    const serverName = this.findServerForTool(toolName);
    if (!serverName) {
      throw new Error(`Tool '${toolName}' not found in any connected MCP server`);
    }

    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Client for server '${serverName}' not found`);
    }

    const result = await client.callTool({ name: toolName, arguments: args });
    return result;
  }

  /**
   * Disconnect from all servers
   */
  async disconnect(): Promise<void> {
    for (const [serverName, transport] of this.transports) {
      try {
        await transport.close();
      } catch (error) {
        console.error(`Error closing transport for ${serverName}:`, error);
      }
    }
    this.clients.clear();
    this.transports.clear();
    this.toolsCache.clear();
  }

  /**
   * Check if connected to a specific server
   */
  isConnected(serverName: string): boolean {
    return this.clients.has(serverName);
  }

  /**
   * Get list of connected server names
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}
