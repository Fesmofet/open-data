import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { getRequestLocale } from '@/i18n/runtime/get-request-locale';
import { loadMessages } from '@/i18n/runtime/load-messages';
import { parseObjectCreateReturnPath } from '@/modules/editor/domain/post-editor-object-create-return';
import { ObjectCreateClient } from '@/modules/object-create';
import { generatePrefix } from '@/modules/object-create/domain/generate-object-id';
import { createCookieAuthContextProvider } from '@/shared/infrastructure/auth/cookie-auth-context-provider';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const messages = await loadMessages(locale);
  return {
    title: messages.object_create_title ?? messages.create_object,
  };
}

export default async function ObjectCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>;
}) {
  const auth = createCookieAuthContextProvider();
  const user = await auth.getUser();
  if (!user) {
    redirect('/sign-in');
  }

  const sp = await searchParams;
  const returnRaw = typeof sp.return === 'string' ? sp.return : null;
  const editorReturnPath = parseObjectCreateReturnPath(returnRaw);

  const initialObjectIdPrefix = generatePrefix();

  return (
    <Suspense fallback={null}>
      <ObjectCreateClient
        username={user.username}
        initialObjectIdPrefix={initialObjectIdPrefix}
        editorReturnPath={editorReturnPath}
      />
    </Suspense>
  );
}
