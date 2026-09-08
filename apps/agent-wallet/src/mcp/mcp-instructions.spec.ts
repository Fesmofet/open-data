import { AGENT_WALLET_MCP_INSTRUCTIONS } from './mcp-instructions';

describe('AGENT_WALLET_MCP_INSTRUCTIONS', () => {
  it('leads with local env-key workflow before HAS', () => {
    const localIndex = AGENT_WALLET_MCP_INSTRUCTIONS.indexOf('Workflow (local keys');
    const hasIndex = AGENT_WALLET_MCP_INSTRUCTIONS.indexOf('Workflow (HAS signing');
    expect(localIndex).toBeGreaterThanOrEqual(0);
    expect(hasIndex).toBeGreaterThan(localIndex);
  });

  it('documents posting authority act-as and grant builder', () => {
    expect(AGENT_WALLET_MCP_INSTRUCTIONS).toContain('get_user_authority_grantors');
    expect(AGENT_WALLET_MCP_INSTRUCTIONS).toContain('hive_build_posting_authority_grant');
    expect(AGENT_WALLET_MCP_INSTRUCTIONS).toContain('canSignLocally');
    expect(AGENT_WALLET_MCP_INSTRUCTIONS).toContain('has_broadcast with keyType active');
  });
});
