export interface CuratedRoute {
  path: string;
  keywords: string[];
  reason: string;
}

/** Static high-confidence routes for common agent intents. */
export const CURATED_ROUTES: CuratedRoute[] = [
  {
    path: 'docs/skills/knowledge-api-routing.md',
    keywords: ['knowledge api', 'mcp routing', 'first visit', 'agent onboarding', 'how to use knowledge'],
    reason: 'curated:mcp-routing',
  },
  {
    path: 'docs/skills/setup-workspace.md',
    keywords: ['setup workspace', 'sidecar agent', 'clone repo', 'agent workspace'],
    reason: 'curated:agent-workspace',
  },
  {
    path: 'docs/getting-started.md',
    keywords: [
      'local dev',
      'local development',
      'local development environment',
      'docker compose',
      'pnpm nx serve',
      'migrate',
      'how to run the project locally',
      'prepare local development environment',
      'run the project locally',
    ],
    reason: 'curated:local-dev',
  },
  {
    path: 'docs/skills/hive-account-signup.md',
    keywords: ['hive account', 'create hive account', 'signup', 'register hive'],
    reason: 'curated:hive-signup',
  },
  {
    path: 'docs/skills/hive-blockchain-broadcast.md',
    keywords: ['broadcast', 'custom_json', 'sign transaction', 'dhive', 'blockchain broadcast'],
    reason: 'curated:hive-broadcast',
  },
  {
    path: 'docs/skills/hive-has-agent-wallet.md',
    keywords: [
      'has agent wallet',
      'agent wallet',
      'hiveauth agent',
      'has login',
      'sign with has',
      'broadcast without keys',
      'keychain mobile agent',
      'agent-wallet mcp',
    ],
    reason: 'curated:has-agent-wallet',
  },
  {
    path: 'docs/skills/obl-offers-contracts.md',
    keywords: [
      'sign obl contract',
      'obl contract sign',
      'publish obl offer',
      'obl offer',
      'signParams',
      'obl offers and contracts',
      'contract_sign',
      'buildOblContractSignOp',
    ],
    reason: 'curated:obl-offers-contracts',
  },
  {
    path: 'docs/skills/obl-ledger.md',
    keywords: [
      'obl balance',
      'obl pair balance',
      'mutual ledger',
      'issue invoice',
      'obl invoice',
      'obl payment',
      'get_obl_balance',
      'buildOblInvoiceIssueOp',
    ],
    reason: 'curated:obl-ledger',
  },
  {
    path: 'docs/skills/obl-disputes.md',
    keywords: [
      'obl dispute',
      'resolve obl dispute',
      'resolve dispute',
      'obl arbitration',
      'dispute_open',
      'buildOblDisputeOpenOp',
      'get_obl_arbitration',
    ],
    reason: 'curated:obl-disputes',
  },
  {
    path: 'docs/skills/build-tenant-site.md',
    keywords: [
      'create project',
      'create a project',
      'new project',
      'build project',
      'build site',
      'build tenant site',
      'tenant site',
      'new website',
      'new site',
      'object menu',
      'fork project',
      'custom website',
      'site builder',
      'camping',
      'shop and checklist',
      'html prototype',
      'standalone html',
    ],
    reason: 'curated:build-tenant-site',
  },
];

export function matchCuratedRoutes(topic: string, scope?: string): Array<CuratedRoute & { confidence: number }> {
  const normalized = topic.toLowerCase();
  const hits: Array<CuratedRoute & { confidence: number }> = [];

  for (const route of CURATED_ROUTES) {
    if (scope && route.path.startsWith(`docs/apps/${scope}/`)) {
      continue;
    }
    let score = 0;
    for (const kw of route.keywords) {
      const needle = kw.toLowerCase();
      if (normalized.includes(needle)) {
        score += needle.split(/\s+/).length;
      }
    }
    if (score > 0) {
      hits.push({ ...route, confidence: Math.min(1, 0.4 + score / 8) });
    }
  }

  return hits.sort((a, b) => b.confidence - a.confidence);
}
