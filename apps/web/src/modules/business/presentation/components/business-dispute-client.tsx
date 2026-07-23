'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { useOblCustomJsonId } from '@/config/odl-network-provider';
import { useI18n } from '@/i18n/providers/i18n-provider';
import { formatAbsoluteDateTime } from '@/shared/utils/format-relative-time';

import { buildResolveDisputeOp } from '../../application/build-obl-ops';
import {
  canViewerResolveDispute,
  disputeAuthorityForInvoice,
  shortContractId,
} from '../../domain/dispute-resolution';
import type { LedgerContractRow, LedgerInvoiceRow } from '../../domain/ledger.types';
import { businessRoutes } from '../../domain/routes';
import type { OblDisputeDetailApiResponse } from '../../infrastructure/clients/obl-ledger.server';
import { useOblBroadcast } from '../hooks/use-obl-broadcast';
import { BusinessPageShell } from '../layout/business-page-shell';
import { BusinessResolveDisputeModal } from './relationship/business-resolve-dispute-modal';
import { DisputeSettlementSummary } from './relationship/dispute-settlement-summary';
import { StateBadge } from './state-badge';

function toLedgerContract(
  contract: NonNullable<OblDisputeDetailApiResponse['contract']>,
): LedgerContractRow {
  return {
    contract_id: contract.contract_id,
    offer_id: contract.offer_id,
    offer_version: contract.offer_version,
    provider: contract.provider,
    client: contract.client,
    dispute_rule: contract.dispute_rule,
    arbiter: contract.arbiter,
    offer_name: contract.offer_name ?? contract.contract_id,
    offer_description: contract.offer_description ?? null,
    created_at: contract.created_at,
  };
}

export function BusinessDisputeClient({
  username,
  detail,
}: {
  username: string;
  detail: OblDisputeDetailApiResponse;
}) {
  const { t, locale } = useI18n();
  const oblCustomJsonId = useOblCustomJsonId();
  const { dispute, invoice, contract } = detail;
  const [resolveOpen, setResolveOpen] = useState(false);
  const { broadcast, isBusy } = useOblBroadcast(username);

  const ledgerInvoice = invoice as LedgerInvoiceRow;
  const ledgerContract = useMemo(
    () => (contract ? toLedgerContract(contract) : null),
    [contract],
  );
  const canResolve = useMemo(
    () =>
      canViewerResolveDispute(username, dispute, [], [], {
        invoice: ledgerInvoice,
        governingContract: ledgerContract,
      }),
    [username, dispute, ledgerInvoice, ledgerContract],
  );
  const resolveAuthority = useMemo(() => {
    if (!ledgerContract) {
      return null;
    }
    return disputeAuthorityForInvoice(ledgerInvoice, [], ledgerContract);
  }, [ledgerContract, ledgerInvoice]);

  async function submitResolve(finalAmountUsd: string) {
    await broadcast(
      [
        buildResolveDisputeOp({
          oblCustomJsonId,
          disputeId: dispute.dispute_id,
          resolver: username,
          finalAmountUsd,
        }),
      ],
      {
        refreshDisputeResolution: true,
        disputeId: dispute.dispute_id,
        invoiceId: invoice.invoice_id,
        contractId: contract?.contract_id,
        ledgerPairs: contract
          ? [{ accountA: contract.provider, accountB: contract.client }]
          : undefined,
      },
    );
    setResolveOpen(false);
  }

  return (
    <>
      <BusinessPageShell
        activeNav="dispute-resolution"
        title={dispute.dispute_id}
        subtitle={t('business_dispute_subtitle')}
        actions={
          canResolve ? (
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setResolveOpen(true)}
              className="rounded-btn bg-accent px-3 py-1.5 text-body-sm text-accent-fg disabled:opacity-50"
            >
              {t('business_dispute_resolve_action')}
            </button>
          ) : null
        }
      >
        <div className="mb-4">
          <StateBadge variant={dispute.status === 'open' ? 'disputed' : 'resolved'} />
        </div>
        <dl className="grid gap-3 text-body-sm">
          <div>
            <dt className="text-fg-secondary">{t('business_field_invoice')}</dt>
            <dd>
              <Link href={businessRoutes.invoice(invoice.invoice_id)} className="text-link">
                {invoice.invoice_id}
              </Link>
            </dd>
          </div>
          {contract ? (
            <div>
              <dt className="text-fg-secondary">{t('business_field_contract')}</dt>
              <dd>
                <Link href={businessRoutes.contract(contract.contract_id)} className="text-link">
                  {contract.offer_name ?? contract.contract_id} ·{' '}
                  {shortContractId(contract.contract_id)}
                </Link>
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-fg-secondary">{t('business_field_created_at')}</dt>
            <dd>
              <time dateTime={dispute.created_at}>
                {formatAbsoluteDateTime(dispute.created_at, locale)}
              </time>
            </dd>
          </div>
        </dl>
        <DisputeSettlementSummary dispute={dispute} invoice={ledgerInvoice} />
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={businessRoutes.relationship(invoice.debtor)}
            className="text-body-sm text-link"
          >
            @{invoice.debtor}
          </Link>
          <Link
            href={businessRoutes.relationship(invoice.creditor)}
            className="text-body-sm text-link"
          >
            @{invoice.creditor}
          </Link>
          {contract ? (
            <>
              <Link
                href={businessRoutes.relationship(contract.provider)}
                className="text-body-sm text-link"
              >
                @{contract.provider}
              </Link>
              <Link
                href={businessRoutes.relationship(contract.client)}
                className="text-body-sm text-link"
              >
                @{contract.client}
              </Link>
            </>
          ) : null}
        </div>
      </BusinessPageShell>

      <BusinessResolveDisputeModal
        open={resolveOpen}
        dispute={dispute}
        invoice={ledgerInvoice}
        authority={resolveAuthority}
        onClose={() => setResolveOpen(false)}
        isBusy={isBusy}
        onSubmit={async (_dispute, finalAmountUsd) => submitResolve(finalAmountUsd)}
      />
    </>
  );
}
