'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useOblCustomJsonId } from '@/config/odl-network-provider';
import type { HiveOperation } from '@opden-data-layer/hive-broadcast';

import {
  isPublishedOfferUpdate,
  normalizeOfferDraftForPublish,
  resolvePublishOfferId,
  validateOfferDraftForPublish,
} from '../domain/offer-draft.schema';
import {
  OFFER_EDITOR_STEPS,
  emptyOfferFields,
  normalizeLoadedOfferFields,
  type OfferDraftFields,
  type OfferDraftState,
  type OfferEditorStep,
} from '../domain/offer-form.types';
import { businessRoutes } from '../domain/routes';
import { buildPublishOfferOp, buildUpdateOfferOp } from './build-obl-ops';
import type { OblOfferDraftView } from '../infrastructure/clients/obl-drafts.server';
import { patchOblDraftAction } from '../infrastructure/actions/obl-drafts.actions';

export type UseOfferEditorOptions = {
  username: string;
  draft: OblOfferDraftView;
  broadcast: (operations: readonly HiveOperation[]) => Promise<string | null>;
};

export type SaveState = 'idle' | 'saving' | 'saved';

export function useOfferEditor({ username, draft, broadcast }: UseOfferEditorOptions) {
  const router = useRouter();
  const oblCustomJsonId = useOblCustomJsonId();
  const [step, setStep] = useState<OfferEditorStep>('basics');
  const [kind, setKind] = useState<'offer' | 'request'>(draft.kind);
  const [fields, setFields] = useState<OfferDraftFields>(() =>
    normalizeLoadedOfferFields({
      ...emptyOfferFields(),
      ...(draft.fields as OfferDraftFields),
    }),
  );
  const [legalText, setLegalText] = useState(draft.legalText ?? '');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [previewOpen, setPreviewOpen] = useState(false);

  const state: OfferDraftState = useMemo(
    () => ({ kind, fields, legalText }),
    [kind, fields, legalText],
  );

  const persist = useCallback(async () => {
    setSaveState('saving');
    await patchOblDraftAction(username, draft.draftId, {
      kind,
      fields,
      legalText: legalText || null,
    });
    setSaveState('saved');
  }, [username, draft.draftId, kind, fields, legalText]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void persist();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [persist]);

  const stepIndex = OFFER_EDITOR_STEPS.indexOf(step);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setStep(OFFER_EDITOR_STEPS[stepIndex - 1]);
    }
  }, [stepIndex]);

  const goNext = useCallback(() => {
    if (stepIndex < OFFER_EDITOR_STEPS.length - 1) {
      setStep(OFFER_EDITOR_STEPS[stepIndex + 1]);
    }
  }, [stepIndex]);

  const publish = useCallback(async () => {
    const validation = validateOfferDraftForPublish(state);
    if (!validation.ok) {
      return;
    }
    await persist();
    const normalized = normalizeOfferDraftForPublish(state);
    const publishFields = { ...normalized.fields };
    const offerId = resolvePublishOfferId(publishFields, draft.draftId);
    publishFields.offerId = offerId;

    const op = isPublishedOfferUpdate(publishFields)
      ? buildUpdateOfferOp({
          oblCustomJsonId,
          author: username,
          offerId,
          fields: publishFields,
        })
      : buildPublishOfferOp({
          oblCustomJsonId,
          author: username,
          kind: normalized.kind,
          fields: publishFields,
        });

    const txId = await broadcast([op]);
    if (txId) {
      router.push(businessRoutes.manageTab(kind, 'published'));
    }
  }, [
    state,
    persist,
    fields,
    draft.draftId,
    oblCustomJsonId,
    username,
    kind,
    broadcast,
    router,
  ]);

  return {
    step,
    setStep,
    kind,
    setKind,
    fields,
    setFields,
    legalText,
    setLegalText,
    saveState,
    previewOpen,
    setPreviewOpen,
    state,
    stepIndex,
    goBack,
    goNext,
    publish,
    previewHref: businessRoutes.offerDraftPreview(kind, draft.draftId),
    draftId: draft.draftId,
  };
}
