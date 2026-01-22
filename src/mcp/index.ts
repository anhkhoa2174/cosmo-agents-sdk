/**
 * MCP Integration module for COSMO SDK
 */

export { MCPClientManager, type MCPServerConfig, type MCPClientConfig } from './mcp-client.js';
export {
  ApolloApiClient,
  type ApolloConfig,
  type PeopleSearchQuery,
  type OrganizationSearchQuery,
  type PeopleEnrichmentQuery,
  type ApolloContact,
} from './apollo-client.js';
