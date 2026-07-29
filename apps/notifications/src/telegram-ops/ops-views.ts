export function opsStartMessage(): string {
  return [
    'Subscribed to Waivio system alerts.',
    '',
    '/status — live check of indexer cursors vs Hive / Hive Engine head',
    '/help — command list',
  ].join('\n');
}

export function opsHelpMessage(): string {
  return [
    'Ops bot commands:',
    '/start — subscribe this chat to system alerts',
    '/status — run a live health check',
  ].join('\n');
}

export function opsUnknownCommandMessage(): string {
  return 'Unknown command. Try /status or /help.';
}
