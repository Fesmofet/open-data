import { renderProfileAccountSidebar } from '@/modules/user-profile';

type PageProps = {
  params: Promise<{ name: string; slug?: string[] }>;
};

export default async function LeftSidebarCatchAllPage({ params }: PageProps) {
  const { name } = await params;
  return renderProfileAccountSidebar(decodeURIComponent(name));
}
