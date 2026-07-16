'use client';

import Link from 'next/link';
import { useState } from 'react';

import { useI18n } from '@/i18n/providers/i18n-provider';
import { useOblCustomJsonId } from '@/config/odl-network-provider';

import {
  buildConfirmPaymentOp,
  buildDeclarePaymentOp,
  buildIssueInvoiceOp,
} from '../../application/build-obl-ops';
import { businessRoutes } from '../../domain/routes';
import type { OblLedgerApiResponse } from '../../infrastructure/clients/obl-ledger.server';
import { BalanceCards } from './balance-cards';
import { BusinessDisclosure } from './business-disclosure';
import { StateBadge } from './state-badge';
import { UsdWaivConverter } from './usd-waiv-converter';
import { useOblBroadcast } from '../hooks/use-obl-broadcast';
import { BusinessPageShell } from '../layout/business-page-shell';

type TabId = 'overview' | 'contracts' | 'invoices' | 'payments' | 'disputes';

export function BusinessRelationshipDetailClient({
  username,
  counterparty,
  ledger,
}: {
  username: string;
  counterparty: string;
  ledger: OblLedgerApiResponse;
}) {
  const { t } = useI18n();
  const oblCustomJsonId = useOblCustomJsonId();
  const { broadcast, error } = useOblBroadcast(username, counterparty);
  const [tab, setTab] = useState<TabId>('overview');
  const [invoiceAmount, setInvoiceAmount] = useState('10');
  const [paymentAmount, setPaymentAmount] = useState('5');

  async function issueInvoice() {
    const debtor = username;
    const creditor = counterparty;
    const op = buildIssueInvoiceOp({
      oblCustomJsonId,
      invoiceId: `inv-${Date.now()}`,
      issuer: username,
      debtor,
      creditor,
      amountUsd: invoiceAmount,
    });
    await broadcast([op]);
  }

  async function declarePayment() {
    const op = buildDeclarePaymentOp({
      oblCustomJsonId,
      paymentId: `pay-${Date.now()}`,
      payer: username,
      receiver: counterparty,
      amountUsd: paymentAmount,
    });
    await broadcast([op]);
  }

  async function confirmReceived() {
    const op = buildConfirmPaymentOp({
      oblCustomJsonId,
      paymentId: `pay-recv-${Date.now()}`,
      receiver: username,
      payer: counterparty,
      amountUsd: paymentAmount,
    });
    await broadcast([op]);
  }

  const tabs: TabId[] = ['overview', 'contracts', 'invoices', 'payments', 'disputes'];

  return (
    <BusinessPageShell
      activeNav="relationships"
      title={`@${counterparty}`}
      subtitle={t('business_relationship_detail_subtitle')}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void issueInvoice()}
            className="rounded-btn bg-accent px-3 py-1 text-body-sm text-accent-fg"
          >
            {t('business_create_invoice')}
          </button>
          <button
            type="button"
            onClick={() => void declarePayment()}
            className="rounded-btn border border-border px-3 py-1 text-body-sm"
          >
            {t('business_record_payment')}
          </button>
        </div>
      }
    >
      <BalanceCards viewer={username} counterparty={counterparty} balance={ledger.balance} />

      <div className="mt-6 flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'rounded-btn px-3 py-1 text-body-sm',
              tab === id ? 'bg-surface-alt font-weight-label text-heading' : 'text-fg-secondary',
            ].join(' ')}
          >
            {t(`business_tab_${id}`)}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'overview' ? (
          <div className="flex flex-col gap-4">
            <BusinessDisclosure variant="auto_payments" />
            <UsdWaivConverter />
            {error ? <p className="text-body-sm text-error">{error}</p> : null}
          </div>
        ) : null}

        {tab === 'contracts' ? (
          <ul className="flex flex-col gap-2">
            {(ledger.contracts as Array<{ contract_id: string; offer_id: string }>).map(
              (c) => (
                <li key={c.contract_id}>
                  <Link
                    href={businessRoutes.contract(c.contract_id)}
                    className="text-body-sm text-link"
                  >
                    {c.contract_id} · {c.offer_id}
                  </Link>
                </li>
              ),
            )}
          </ul>
        ) : null}

        {tab === 'invoices' ? (
          <div className="flex flex-col gap-3">
            <label className="text-body-sm">
              USD
              <input
                value={invoiceAmount}
                onChange={(e) => setInvoiceAmount(e.target.value)}
                className="ml-2 rounded-btn border border-border px-2 py-1"
              />
            </label>
            {(ledger.invoices as Array<{ invoice_id: string; state: string; amount_usd: string }>).map(
              (inv) => (
                <div
                  key={inv.invoice_id}
                  className="rounded-card border border-border p-3 text-body-sm"
                >
                  {inv.invoice_id} · ${inv.amount_usd} ·{' '}
                  <StateBadge
                    variant={
                      inv.state === 'pending'
                        ? 'pending_signature'
                        : inv.state === 'disputed'
                          ? 'disputed'
                          : 'confirmed'
                    }
                  />
                </div>
              ),
            )}
          </div>
        ) : null}

        {tab === 'payments' ? (
          <div className="flex flex-col gap-3">
            <label className="text-body-sm">
              USD
              <input
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="ml-2 rounded-btn border border-border px-2 py-1"
              />
            </label>
            <button
              type="button"
              onClick={() => void confirmReceived()}
              className="w-fit rounded-btn border border-border px-3 py-1 text-body-sm"
            >
              {t('business_confirm_received_payment')}
            </button>
            {(ledger.payments as Array<{ payment_id: string; method: string; amount_usd: string; state: string }>).map(
              (pay) => (
                <div
                  key={pay.payment_id}
                  className="rounded-card border border-border p-3 text-body-sm"
                >
                  {pay.method} · ${pay.amount_usd} · {pay.state}
                </div>
              ),
            )}
          </div>
        ) : null}

        {tab === 'disputes' ? (
          <p className="text-body-sm text-fg-secondary">{t('business_disputes_tab_hint')}</p>
        ) : null}
      </div>
    </BusinessPageShell>
  );
}
