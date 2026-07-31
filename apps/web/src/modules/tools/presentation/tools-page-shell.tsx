'use client';

import type { ReactNode } from 'react';

import { ToolsLayoutNav } from './tools-layout-nav';

export type ToolsPageShellProps = {
  children: ReactNode;
};

export function ToolsPageShell({ children }: ToolsPageShellProps) {
  return (
    <div className="mx-auto w-full max-w-container-page px-gutter py-section-y sm:px-gutter-sm">
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(10rem,12rem)_minmax(0,1fr)]">
        <ToolsLayoutNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
