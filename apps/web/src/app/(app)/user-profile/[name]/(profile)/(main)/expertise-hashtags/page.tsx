import { ProfileExpertiseMainContent } from '@/modules/user-profile/presentation/components/profile-expertise-main-content';

export default async function UserProfileExpertiseHashtagsPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  return (
    <ProfileExpertiseMainContent
      accountName={decodeURIComponent(name)}
      scope="hashtags"
    />
  );
}
