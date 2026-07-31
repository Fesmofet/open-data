import { ToolsPageShell } from '@/modules/tools';

export default function ToolsShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToolsPageShell>{children}</ToolsPageShell>;
}
