import type { AppHeaderUser } from '../domain/app-header-user';
import { ShellInset } from '@/shared/presentation/layout';

import { TopNav } from './components/top-nav';

export type AppHeaderProps = {
  user: AppHeaderUser | null;
};

/**
 * Global app chrome: brand, search (MVP stub), session actions.
 */
export function AppHeader({ user }: AppHeaderProps) {
  return (
    <header className="app-top-header app-header-blur w-full">
      <ShellInset>
        <TopNav user={user} />
      </ShellInset>
    </header>
  );
}
