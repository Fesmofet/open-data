/**
 * Adds notification message-builder keys from en-US to other locale files when missing.
 * UTF-8 read/write. Run: node scripts/sync-notification-i18n-keys.cjs
 */
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../apps/web/src/i18n/locales');
const enPath = path.join(localesDir, 'en-US.json');

const NEW_KEYS = {
  import_update: 'Batch import completed for {cid}',
  notification_transfer_from_savings:
    'You withdrew {amount} from savings',
  notification_hp_delegation:
    '{delegator} delegated {amount} to {delegatee}',
  notification_engine_stake:
    '{from} staked {amount} to {to}',
  notification_engine_unstake: '{account} unstaked {amount}',
};

function readJson(filePath) {
  const buf = fs.readFileSync(filePath);
  return JSON.parse(buf.toString('utf8'));
}

function writeJson(filePath, data) {
  const text = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(filePath, text, 'utf8');
}

const en = readJson(enPath);
for (const [key, value] of Object.entries(NEW_KEYS)) {
  if (en[key] === undefined) {
    en[key] = value;
  }
}
writeJson(enPath, en);

const files = fs.readdirSync(localesDir).filter((f) => f.endsWith('.json'));
for (const file of files) {
  if (file === 'en-US.json') {
    continue;
  }
  const filePath = path.join(localesDir, file);
  const data = readJson(filePath);
  let changed = false;
  for (const [key, value] of Object.entries(NEW_KEYS)) {
    const fallback = en[key] ?? value;
    if (data[key] === undefined) {
      data[key] = fallback;
      changed = true;
    }
  }
  if (changed) {
    writeJson(filePath, data);
    console.log(`Updated ${file}`);
  }
}

console.log('Done.');
