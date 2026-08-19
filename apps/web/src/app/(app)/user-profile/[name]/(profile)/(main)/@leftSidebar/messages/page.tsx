import { renderProfileMessagesLeftSidebar } from '@/modules/messaging/presentation/render-profile-messages-left-sidebar';

type PageProps = {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ channel?: string; peer?: string }>;
};

export default async function MessagesLeftSidebarPage({
  params,
  searchParams,
}: PageProps) {
  const { name } = await params;
  const accountName = decodeURIComponent(name);

  return renderProfileMessagesLeftSidebar({ accountName, searchParams });
}
