/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';

import { I18nProvider } from '@/i18n/providers/i18n-provider';

jest.mock('@/shared/presentation', () => ({
  ModalShell: ({
    open,
    header,
    footer,
    children,
  }: {
    open: boolean;
    header?: React.ReactNode;
    footer?: React.ReactNode;
    children: React.ReactNode;
  }) =>
    open ? (
      <div>
        {header}
        {children}
        {footer}
      </div>
    ) : null,
  ModalShellCloseButton: () => null,
}));

jest.mock('../../../infrastructure/clients/obl-ledger.client', () => ({
  fetchOblInvoiceDetailClient: jest.fn(),
}));

import { fetchOblInvoiceDetailClient } from '../../../infrastructure/clients/obl-ledger.client';
import type { LedgerDisputeRow, LedgerInvoiceRow } from '../../../domain/ledger.types';
import { BusinessResolveDisputeModal } from './business-resolve-dispute-modal';

const messages = {
  business_modal_resolve_dispute_title: 'Resolve dispute',
  business_modal_close: 'Close',
  business_modal_cancel: 'Cancel',
  business_field_invoice: 'Invoice',
  business_field_original_amount: 'Original amount',
  business_field_dispute_rule: 'Dispute rule',
  business_field_resolver: 'Resolver',
  business_field_proposed_amount: 'Proposed amount',
  business_field_final_amount: 'Final amount',
  business_dispute_arbiter: 'Arbiter',
  business_dispute_provider: 'Provider',
  business_dispute_client: 'Client',
  business_dispute_accept_all: 'Accept all',
  business_dispute_reject_all: 'Reject all',
  business_dispute_resolve_action: 'Resolve dispute',
  business_dispute_multi_resolve_hint: 'Multi resolve hint',
  business_loading: 'Loading',
  business_invoice_detail_load_failed: 'Could not load invoice lines.',
  business_field_beneficiary: 'Beneficiary',
  business_field_amount_usd: 'Amount',
  business_field_role: 'Role',
  business_invoice_total: 'Total',
};

const dispute: LedgerDisputeRow = {
  dispute_id: 'd-1',
  invoice_id: 'inv-1',
  disputant: 'sponsor',
  proposed_amount_usd: '6.00000000',
  status: 'open',
  created_at: '2026-01-01T00:00:00.000Z',
};

const multiInvoice: LedgerInvoiceRow = {
  invoice_id: 'inv-1',
  contract_id: 'c-1',
  debtor: 'sponsor',
  creditor: 'winner',
  issuer: 'organizer',
  amount_usd: '5.00000000',
  kind: 'multi',
  state: 'disputed',
  created_at: '2026-01-01T00:00:00.000Z',
};

const singleInvoice: LedgerInvoiceRow = {
  ...multiInvoice,
  kind: 'single',
  amount_usd: '10.00000000',
  state: 'disputed',
};

function renderModal(invoice: LedgerInvoiceRow) {
  return render(
    <I18nProvider locale="en-US" messages={messages}>
      <BusinessResolveDisputeModal
        open
        dispute={dispute}
        invoice={invoice}
        authority={{
          rule: 'client',
          resolverAccount: 'sponsor',
          provider: 'winner',
          client: 'sponsor',
          arbiter: null,
        }}
        onClose={jest.fn()}
        isBusy={false}
        onSubmit={jest.fn()}
      />
    </I18nProvider>,
  );
}

describe('BusinessResolveDisputeModal', () => {
  beforeEach(() => {
    jest.mocked(fetchOblInvoiceDetailClient).mockReset();
  });

  it('shows accept/reject actions for loaded multi invoice lines', async () => {
    jest.mocked(fetchOblInvoiceDetailClient).mockResolvedValue({
      invoice: {
        invoice_id: 'inv-1',
        contract_id: 'c-1',
        issuer: 'organizer',
        debtor: 'sponsor',
        creditor: 'winner',
        amount_usd: '6.00000000',
        final_amount_usd: null,
        details: {},
        state: 'disputed',
        kind: 'multi',
        created_event_seq: '1',
        transaction_id: 'tx-1',
        created_at: '2026-01-01T00:00:00.000Z',
        lines: [
          {
            line_id: 'inv-1:0',
            invoice_id: 'inv-1',
            debtor: 'sponsor',
            beneficiary: 'winner',
            creditor: 'winner',
            amount_usd: '5.00000000',
            final_amount_usd: null,
            state: 'disputed',
            dispute_group: 'inv-1',
            role: null,
            created_event_seq: '1',
            transaction_id: 'tx-1',
            created_at: '2026-01-01T00:00:00.000Z',
          },
          {
            line_id: 'inv-1:1',
            invoice_id: 'inv-1',
            debtor: 'sponsor',
            beneficiary: 'referral',
            creditor: 'referral',
            amount_usd: '1.00000000',
            final_amount_usd: null,
            state: 'disputed',
            dispute_group: 'inv-1',
            role: 'referral_fee',
            created_event_seq: '1',
            transaction_id: 'tx-1',
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      contract: null,
    });

    renderModal(multiInvoice);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Accept all' })).toBeEnabled();
    });
    expect(screen.getByRole('button', { name: 'Reject all' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Resolve dispute' })).not.toBeInTheDocument();
    expect(screen.getByText('Original amount')).toBeInTheDocument();
    expect(screen.getAllByText('$6.00').length).toBeGreaterThanOrEqual(1);
  });

  it('blocks resolve actions when multi invoice lines fail to load', async () => {
    jest.mocked(fetchOblInvoiceDetailClient).mockRejectedValue(new Error('network'));

    renderModal(multiInvoice);

    await waitFor(() => {
      expect(screen.getByText('Could not load invoice lines.')).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Resolve dispute' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept all' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reject all' })).not.toBeInTheDocument();
  });

  it('keeps editable final amount for single invoice', async () => {
    jest.mocked(fetchOblInvoiceDetailClient).mockResolvedValue({
      invoice: {
        invoice_id: 'inv-1',
        contract_id: 'c-1',
        issuer: 'organizer',
        debtor: 'sponsor',
        creditor: 'winner',
        amount_usd: '10.00000000',
        final_amount_usd: null,
        details: {},
        state: 'disputed',
        kind: 'single',
        created_event_seq: '1',
        transaction_id: 'tx-1',
        created_at: '2026-01-01T00:00:00.000Z',
        lines: [
          {
            line_id: 'inv-1:0',
            invoice_id: 'inv-1',
            debtor: 'sponsor',
            beneficiary: 'winner',
            creditor: 'winner',
            amount_usd: '10.00000000',
            final_amount_usd: null,
            state: 'disputed',
            dispute_group: 'inv-1',
            role: null,
            created_event_seq: '1',
            transaction_id: 'tx-1',
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      contract: null,
    });

    renderModal(singleInvoice);

    await waitFor(() => {
      expect(screen.getByDisplayValue('6.00000000')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Resolve dispute' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Accept all' })).not.toBeInTheDocument();
  });
});
