import { renderProfileAccountSidebar } from '@/modules/user-profile';

type PageProps = {
  params: Promise<{ name: string }>;
};

export default async function LeftSidebarDefault({ params }: PageProps) {
  const { name } = await params;
  return renderProfileAccountSidebar(decodeURIComponent(name));
}
