import { sanitizePostBodyHtml } from '@/shared/infrastructure/post-body-html-pipeline';

import type { ObjectPageViewModel } from './object-page.types';

function resolveHostPageContentRaw(model: ObjectPageViewModel): string | null {
  if (model.objectTypeKey === 'legal_document') {
    return model.legalText;
  }
  if (model.objectTypeKey === 'skill') {
    return model.skillContent;
  }
  if (model.objectType === 'page') {
    return model.pageContent;
  }
  return null;
}

/** Sanitized page body for standalone page-type objects (`/object/:id`). */
export function resolveHostPageContent(model: ObjectPageViewModel): string | null {
  const raw = resolveHostPageContentRaw(model);
  if (!raw?.trim()) {
    return null;
  }
  return sanitizePostBodyHtml(raw);
}
