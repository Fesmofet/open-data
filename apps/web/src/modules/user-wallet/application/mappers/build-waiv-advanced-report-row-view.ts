import type { WaivAdvancedReportRowApi } from '../dto/waiv-advanced-report-api.schema';

export type WaivAdvancedReportDescriptionView =
  | { kind: 'plain'; text: string }
  | { kind: 'withAccount'; label: string; account: string };

export type WaivAdvancedReportRowView = {
  id: string;
  userName: string;
  operationIndex: number;
  timestamp: number;
  dateLabel: string;
  timeLabel: string;
  waivAmount: string;
  wpAmount: string;
  waivRateFiat: number;
  waivFiat: number;
  wpFiat: number;
  totalFiat: number;
  withdrawDeposit: '' | 'd' | 'w';
  checked: boolean;
  description: string;
  descriptionView: WaivAdvancedReportDescriptionView;
  memo: string;
};

function formatUtcDate(unix: number): { date: string; time: string } {
  const d = new Date(unix * 1000);
  const date = `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`;
  const time = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  return { date, time };
}

export function formatWaivAdvancedReportDescription(
  view: WaivAdvancedReportDescriptionView,
): string {
  if (view.kind === 'plain') {
    return view.text;
  }
  return `${view.label} @${view.account}`;
}

function buildDescriptionView(row: WaivAdvancedReportRowApi): WaivAdvancedReportDescriptionView {
  switch (row.type) {
    case 'tokens_transfer':
      return row.withdrawDeposit === 'd'
        ? { kind: 'withAccount', label: 'Received from', account: row.from }
        : { kind: 'withAccount', label: 'Sent to', account: row.to };
    case 'tokens_stake':
      if (row.from === row.to) {
        return { kind: 'plain', text: 'Power up' };
      }
      return row.withdrawDeposit === 'd'
        ? { kind: 'withAccount', label: 'Power up from', account: row.from }
        : { kind: 'withAccount', label: 'Power up to', account: row.to };
    case 'comments_authorReward':
      return { kind: 'plain', text: 'Author reward' };
    case 'comments_curationReward':
      return { kind: 'plain', text: 'Curation reward' };
    case 'comments_beneficiaryReward':
      return { kind: 'plain', text: 'Beneficiary reward' };
    case 'mining_lottery':
      return { kind: 'plain', text: 'Mining lottery' };
    case 'tokens_issue':
      return { kind: 'plain', text: 'Mining' };
    case 'marketpools_swapTokens':
      return { kind: 'plain', text: 'Swap' };
    case 'market_buy':
      return { kind: 'plain', text: 'Market buy' };
    case 'market_sell':
      return { kind: 'plain', text: 'Market sell' };
    case 'airdrops_newAirdrop':
      return { kind: 'plain', text: 'Airdrop' };
    case 'merged_rewards':
      return { kind: 'plain', text: 'Merged rewards' };
    default:
      return { kind: 'plain', text: row.type };
  }
}

export function buildWaivAdvancedReportRowView(
  row: WaivAdvancedReportRowApi,
): WaivAdvancedReportRowView {
  const { date, time } = formatUtcDate(row.timestamp);
  const descriptionView = buildDescriptionView(row);

  return {
    id: `${row.userName}:${row.operationIndex}`,
    userName: row.userName,
    operationIndex: row.operationIndex,
    timestamp: row.timestamp,
    dateLabel: date,
    timeLabel: time,
    waivAmount: row.waivAmount,
    wpAmount: row.wpAmount,
    waivRateFiat: row.waivRateFiat,
    waivFiat: row.waivFiat,
    wpFiat: row.wpFiat,
    totalFiat: row.totalFiat,
    withdrawDeposit: row.withdrawDeposit,
    checked: row.checked,
    description: formatWaivAdvancedReportDescription(descriptionView),
    descriptionView,
    memo: row.memo,
  };
}
