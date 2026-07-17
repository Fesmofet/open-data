import { AppSectionNav } from '@/modules/app-header';
import {
  InstantNavigationProvider,
  OptimisticNavProvider,
} from '@/shared/presentation';

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return (
    <OptimisticNavProvider>
      <InstantNavigationProvider>
        <div className="sticky top-[var(--shell-header-height)] z-30 w-full">
          <AppSectionNav />
        </div>
        {children}
      </InstantNavigationProvider>
    </OptimisticNavProvider>
  );
}
