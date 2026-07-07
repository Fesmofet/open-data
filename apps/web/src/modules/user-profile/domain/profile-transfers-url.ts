import { getSegmentsAfterAccount } from '../presentation/components/profile-path';

/** Transfers tab is `/@name/transfers` (and nested transfer routes). */
export function isUserProfileTransfersTab(pathname: string): boolean {
  return getSegmentsAfterAccount(pathname)[0] === 'transfers';
}
