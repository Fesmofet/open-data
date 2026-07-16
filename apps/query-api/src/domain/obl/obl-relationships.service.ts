import { Injectable, NotFoundException } from '@nestjs/common';
import { normalizeHiveAccount } from '../../auth';
import { OblRepository } from '../../repositories/obl.repository';
import { OblLedgerService } from './obl-ledger.service';

function normalizePair(a: string, b: string): { pairLow: string; pairHigh: string } {
  const x = a.trim();
  const y = b.trim();
  return x <= y ? { pairLow: x, pairHigh: y } : { pairLow: y, pairHigh: x };
}

@Injectable()
export class OblRelationshipsService {
  constructor(
    private readonly obl: OblRepository,
    private readonly ledger: OblLedgerService,
  ) {}

  async listForAccount(accountRaw: string) {
    const account = normalizeHiveAccount(accountRaw);
    const counterparties = await this.obl.listCounterpartiesForAccount(account);
    const rows = await Promise.all(
      counterparties.map(async (counterparty) => {
        const { pairLow, pairHigh } = normalizePair(account, counterparty);
        const counts = await this.obl.countContractsForPair(pairLow, pairHigh, account);
        const roles: Array<'provider' | 'client'> = [];
        if (counts.asProvider > 0) {
          roles.push('provider');
        }
        if (counts.asClient > 0) {
          roles.push('client');
        }
        const ledger = await this.ledger.getLedger(account, counterparty);
        const lastSeq = await this.obl.latestContractActivitySeq(pairLow, pairHigh);
        return {
          counterparty,
          roles,
          contractCount: counts.total,
          balance: ledger.balance,
          lastActivityAt: lastSeq !== null ? lastSeq.toString() : null,
        };
      }),
    );
    return rows;
  }

  async getContract(contractId: string) {
    const contract = await this.obl.findContract(contractId);
    if (!contract) {
      throw new NotFoundException('OBL contract not found');
    }
    return contract;
  }
}
