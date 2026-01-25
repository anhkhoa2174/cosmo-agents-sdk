# Pre-Implementation Checklist: [Feature Name]

## Specification Review

- [ ] Problem statement is clear and validated
- [ ] Success criteria are measurable
- [ ] User stories cover primary use cases
- [ ] Functional requirements are complete
- [ ] Non-functional requirements defined
- [ ] Risks identified with mitigations

## Plan Review

- [ ] Architecture design is sound
- [ ] Key design decisions documented
- [ ] File changes identified
- [ ] Interface definitions complete
- [ ] Testing strategy defined
- [ ] Rollback plan exists

## Task Review

- [ ] All tasks have clear acceptance criteria
- [ ] Dependencies between tasks are correct
- [ ] Priority assignments are appropriate
- [ ] Estimates are reasonable (if provided)

## Code Quality Checklist

### Before Implementation
- [ ] Branch created from main
- [ ] Latest main merged in
- [ ] Dependencies installed

### During Implementation
- [ ] TypeScript strict mode compliance
- [ ] No `any` types without justification
- [ ] Error handling at boundaries
- [ ] Zod validation for external inputs
- [ ] Async/await used consistently

### After Implementation
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] Build succeeds (`npm run build`)
- [ ] CLI testing performed
- [ ] Tool definitions updated
- [ ] Agent tool lists updated if needed

## Agent-Specific Checklist

### New Tool Added
- [ ] Tool defined in `src/tools/definitions.ts`
- [ ] Handler added in `src/tools/executor.ts`
- [ ] API method in `src/tools/cosmo-api.ts` (if needed)
- [ ] Tool added to relevant agent's `toolNames`
- [ ] System prompt updated if needed

### New Agent Added
- [ ] Extends BaseAgent
- [ ] `agentType` defined
- [ ] `toolNames` array specified
- [ ] System prompt crafted
- [ ] Registered in AgentOrchestrator (if applicable)

## Documentation Checklist

- [ ] CLAUDE.md updated if architecture changes
- [ ] README.md updated for user-facing changes
- [ ] JSDoc comments for public APIs
- [ ] .specledger feature docs complete

## Final Review

- [ ] All tasks marked complete
- [ ] Beads issues updated
- [ ] PR created with proper description
- [ ] Code review requested
