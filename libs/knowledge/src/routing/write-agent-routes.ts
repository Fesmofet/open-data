import { writeFile } from 'node:fs/promises';
import * as path from 'node:path';

export interface AgentRouteEntry {
  path: string;
  title: string;
  description: string | null;
  type: string;
  scope: string | null;
  tags: string[];
}

export async function writeAgentRoutesFile(
  workspaceRoot: string,
  routes: AgentRouteEntry[],
): Promise<void> {
  const outPath = path.join(workspaceRoot, 'docs/agent-routes.json');
  const payload = {
    generated_at: new Date().toISOString(),
    routes,
  };
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}
