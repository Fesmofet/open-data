import { ProfileExpertiseMainContent } from '@/modules/user-profile/presentation/components/profile-expertise-main-content';

export default async function UserProfileExpertiseObjectsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return (
    <ProfileExpertiseMainContent
      accountName={decodeURIComponent(name)}
      scope="objects"
    />
  );
}
