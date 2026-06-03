export const OBJECT_CREATE_STEP_QUERY = 'step';

export const OBJECT_CREATE_STEP_EDIT = 'edit';

export const OBJECT_CREATE_TYPE_QUERY = 'type';

export type ObjectCreateStep = 'select-type' | 'edit-fields';

export function objectCreateUrlIndicatesEditStep(
  params: Pick<URLSearchParams, 'get'>,
): boolean {
  return params.get(OBJECT_CREATE_STEP_QUERY) === OBJECT_CREATE_STEP_EDIT;
}

export function readObjectCreateTypeFromUrl(
  params: Pick<URLSearchParams, 'get'>,
): string | null {
  const raw = params.get(OBJECT_CREATE_TYPE_QUERY)?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function applyObjectCreateStepToSearchParams(
  current: URLSearchParams,
  step: ObjectCreateStep,
  objectType?: string | null,
): URLSearchParams {
  const next = new URLSearchParams(current.toString());
  if (step === 'edit-fields') {
    next.set(OBJECT_CREATE_STEP_QUERY, OBJECT_CREATE_STEP_EDIT);
    if (objectType) {
      next.set(OBJECT_CREATE_TYPE_QUERY, objectType);
    }
  } else {
    next.delete(OBJECT_CREATE_STEP_QUERY);
    next.delete(OBJECT_CREATE_TYPE_QUERY);
  }
  return next;
}
