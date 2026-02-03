# Feature Specification: SDK-Backend API Parity

**Feature Branch**: `002-sdk-backend-parity`
**Created**: 2026-02-03
**Status**: Draft
**Input**: User description: "Feature: Integrate new cosmo-agents-backend endpoints into cosmo-agents-sdk. Create SDK client methods for all backend API endpoints that don't have corresponding SDK implementations. Include: 1) Endpoint inventory - list all backend API endpoints and identify which are missing from SDK, 2) SDK implementation - create TypeScript types, client methods, and documentation for each missing endpoint, 3) Compatibility - ensure backward compatibility with existing SDK usage, 4) Safety - avoid breaking changes to current implementations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Campaign Management from SDK (Priority: P1)

Developers need to manage outreach campaigns programmatically through the SDK, including creating campaigns, generating templates, and tracking campaign performance.

**Why this priority**: Campaigns are core to the outreach workflow. Many backend campaign endpoints exist but are not accessible via SDK, forcing developers to make direct API calls or use the frontend.

**Independent Test**: Can be fully tested by creating a campaign, adding contacts, generating templates, and verifying campaign data - delivers full campaign automation value.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `createCampaign(data)`, **Then** campaign is created and campaign object is returned with ID
2. **Given** existing campaign, **When** developer calls `generateCampaignTemplates(campaignId)`, **Then** AI-generated templates are created for the campaign
3. **Given** existing campaign, **When** developer calls `searchCampaigns(filter)`, **Then** filtered list of campaigns is returned
4. **Given** existing campaign, **When** developer calls `updateCampaign(id, data)`, **Then** campaign is updated with new data

---

### User Story 2 - Agent Management from SDK (Priority: P1)

Developers need to create, configure, and manage AI agents through the SDK for automated workflows.

**Why this priority**: Agents are central to automation. Agent endpoints exist in backend but SDK lacks agent management methods.

**Independent Test**: Can be tested by creating an agent, configuring it, and verifying agent execution - delivers agent automation value.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `createAgent(config)`, **Then** agent is created and agent object returned
2. **Given** existing agent, **When** developer calls `getAgent(agentId)`, **Then** full agent configuration is returned
3. **Given** existing agent, **When** developer calls `updateAgent(agentId, updates)`, **Then** agent is updated successfully
4. **Given** existing agent, **When** developer calls `searchAgentConversations(agentId, filter)`, **Then** agent conversation history is returned

---

### User Story 3 - Email and Conversation Management (Priority: P2)

Developers need to search emails, manage conversations, and handle email replies through the SDK.

**Why this priority**: Email and conversation management is essential for customer communication workflows but currently requires direct API calls.

**Independent Test**: Can be tested by searching emails, getting conversation details, and replying to emails - delivers communication automation value.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `searchEmails(filter)`, **Then** filtered list of emails is returned
2. **Given** existing email, **When** developer calls `replyToEmail(emailId, content)`, **Then** reply is sent successfully
3. **Given** authenticated SDK client, **When** developer calls `searchConversations(filter)`, **Then** filtered list of conversations is returned
4. **Given** existing conversation, **When** developer calls `getConversation(conversationId)`, **Then** full conversation with messages is returned

---

### User Story 4 - Template Management (Priority: P2)

Developers need to create, update, and manage email/message templates through the SDK.

**Why this priority**: Templates are reusable assets for campaigns. Template endpoints exist but SDK lacks template management.

**Independent Test**: Can be tested by creating a template, updating it, and using it in a campaign - delivers content management value.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `createTemplate(data)`, **Then** template is created and template object returned
2. **Given** existing template, **When** developer calls `getTemplate(templateId)`, **Then** full template data is returned
3. **Given** existing template, **When** developer calls `updateTemplate(templateId, updates)`, **Then** template is updated
4. **Given** existing template, **When** developer calls `deleteTemplate(templateId)`, **Then** template is removed

---

### User Story 5 - Organization and User Management (Priority: P2)

Developers need to manage organizations, members, and user settings through the SDK.

**Why this priority**: Multi-tenant applications need organization management. Backend supports it but SDK lacks these methods.

**Independent Test**: Can be tested by creating organization, inviting members, and managing settings - delivers team management value.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `createOrganization(data)`, **Then** organization is created
2. **Given** existing organization, **When** developer calls `inviteMember(orgId, email)`, **Then** invitation is sent
3. **Given** authenticated user, **When** developer calls `getCurrentUser()`, **Then** current user profile is returned
4. **Given** authenticated user, **When** developer calls `updateUserProfile(updates)`, **Then** user profile is updated

---

### User Story 6 - File and Knowledge Management (Priority: P3)

Developers need to upload files, manage knowledge base entries, and search knowledge through the SDK.

**Why this priority**: Knowledge management enhances AI capabilities. Backend has file/knowledge endpoints but SDK access is limited.

**Independent Test**: Can be tested by uploading knowledge files, searching knowledge base - delivers knowledge automation value.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `uploadKnowledge(file)`, **Then** file is uploaded and processed
2. **Given** existing knowledge, **When** developer calls `searchKnowledge(query)`, **Then** relevant knowledge entries are returned
3. **Given** existing knowledge entry, **When** developer calls `deleteKnowledge(knowledgeId)`, **Then** entry is removed
4. **Given** authenticated SDK client, **When** developer calls `uploadFileToS3(file)`, **Then** file URL is returned

---

### User Story 7 - OAuth Integration Management (Priority: P3)

Developers need to initiate and manage OAuth flows for HubSpot, Gmail, Outlook, and Meta integrations.

**Why this priority**: Third-party integrations expand platform capabilities. OAuth endpoints exist but SDK lacks integration helpers.

**Independent Test**: Can be tested by getting OAuth URLs, handling callbacks - delivers integration connectivity value.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `getGmailAuthUrl()`, **Then** OAuth authorization URL is returned
2. **Given** OAuth callback code, **When** developer calls `handleGmailCallback(code)`, **Then** Gmail is connected to user account
3. **Given** connected Gmail, **When** developer calls `checkGmailTokenStatus(agentId)`, **Then** token validity status is returned
4. **Given** authenticated SDK client, **When** developer calls `getHubSpotAuthUrl()`, **Then** HubSpot authorization URL is returned

---

### User Story 8 - Custom Field and List Contact Management (Priority: P3)

Developers need to define custom fields and manage list-based contact collections through the SDK.

**Why this priority**: Custom fields enable data flexibility. Backend supports custom fields but SDK lacks these methods.

**Independent Test**: Can be tested by creating custom fields, creating list contacts, and filtering by custom fields - delivers data customization value.

**Acceptance Scenarios**:

1. **Given** authenticated SDK client, **When** developer calls `createCustomField(definition)`, **Then** custom field is created
2. **Given** existing custom field, **When** developer calls `listCustomFields()`, **Then** all custom fields are returned
3. **Given** authenticated SDK client, **When** developer calls `createListContact(data)`, **Then** list contact is created
4. **Given** existing list contacts, **When** developer calls `searchListContacts(filter)`, **Then** filtered results are returned

---

### Edge Cases

- What happens when API version is deprecated (V1 vs V2 vs V3)?
  - SDK defaults to latest stable version, with option to specify version per-method
- How does system handle rate limiting from backend?
  - SDK exposes rate limit headers and provides configurable retry mechanisms
- What happens when OAuth token expires mid-operation?
  - SDK supports automatic token refresh when refresh token is available
- How does system handle partial batch operation failures?
  - SDK returns detailed results showing which items succeeded/failed

## Requirements *(mandatory)*

### Functional Requirements

**Core SDK Architecture:**
- **FR-001**: SDK MUST maintain backward compatibility with all existing public methods
- **FR-002**: SDK MUST support all three API versions (V1, V2, V3) with version selection
- **FR-003**: SDK MUST provide TypeScript type definitions for all new methods and responses
- **FR-004**: SDK MUST use consistent error handling patterns matching existing SDK conventions

**Campaign Management:**
- **FR-005**: SDK MUST provide methods for creating, reading, updating, and deleting campaigns
- **FR-006**: SDK MUST provide methods for searching campaigns with filters
- **FR-007**: SDK MUST provide methods for generating campaign templates
- **FR-008**: SDK MUST provide methods for managing campaign member assignments

**Agent Management:**
- **FR-009**: SDK MUST provide methods for creating, reading, updating, and deleting agents
- **FR-010**: SDK MUST provide methods for searching agent conversations

**Email and Conversation:**
- **FR-011**: SDK MUST provide methods for searching emails with filters
- **FR-012**: SDK MUST provide methods for replying to emails
- **FR-013**: SDK MUST provide methods for searching and managing conversations

**Template Management:**
- **FR-014**: SDK MUST provide methods for creating, reading, updating, and deleting templates

**Organization Management:**
- **FR-015**: SDK MUST provide methods for creating and managing organizations
- **FR-016**: SDK MUST provide methods for inviting and managing organization members

**User Management:**
- **FR-017**: SDK MUST provide methods for getting and updating current user profile
- **FR-018**: SDK MUST provide methods for managing personal API keys

**File and Knowledge:**
- **FR-019**: SDK MUST provide methods for uploading and managing files
- **FR-020**: SDK MUST provide methods for uploading and searching knowledge base

**OAuth Integrations:**
- **FR-021**: SDK MUST provide helper methods for initiating OAuth flows (Gmail, HubSpot, Outlook, Meta)
- **FR-022**: SDK MUST provide methods for checking OAuth token status

**Custom Fields and List Contacts:**
- **FR-023**: SDK MUST provide methods for creating and managing custom fields
- **FR-024**: SDK MUST provide methods for creating and searching list contacts

**Sale Rep Management:**
- **FR-025**: SDK MUST provide methods for creating, reading, updating, and deleting sale reps

**Inbound Lead Forms:**
- **FR-026**: SDK MUST provide methods for creating and managing inbound lead forms
- **FR-027**: SDK MUST provide methods for submitting lead form data

**Workflow Management:**
- **FR-028**: SDK MUST provide methods for creating and managing workflows

**Task Management:**
- **FR-029**: SDK MUST provide methods for creating, reading, and updating tasks

### Key Entities

- **Campaign**: Outreach campaign with contacts, templates, and configuration
- **Agent**: AI agent with configuration, capabilities, and conversation history
- **Template**: Reusable message/email template with variables
- **Organization**: Tenant/workspace containing users and data
- **CustomField**: User-defined field for extending contact data model
- **ListContact**: Contact collection for targeted outreach
- **SaleRep**: Sales representative profile with assignment capabilities
- **InboundLeadForm**: Form configuration for capturing leads
- **Workflow**: Automated process definition with steps

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All backend API endpoints (235+) have corresponding SDK methods
- **SC-002**: 100% of new SDK methods have TypeScript type definitions
- **SC-003**: Zero breaking changes to existing SDK public interface
- **SC-004**: All new methods follow existing SDK patterns and conventions
- **SC-005**: SDK users can access all backend functionality without direct HTTP calls
- **SC-006**: New methods have consistent error handling with existing methods
- **SC-007**: SDK documentation covers all new methods with usage examples

### Previous work

### Related Features

- **001-tools-integration**: Initial SDK tools integration - provides foundation patterns
- **1-configurable-agent-system**: Configurable agent system - establishes agent architecture
