import {
  DETAILS_PRIMARY_TAB_SEGMENT,
  objectTypeHasDetailsTab,
} from './object-page-url.constants';

/** Mobile center-column stacking mode below `lg`. */
export type ObjectMobileCenterLayout =
  | 'standardView'
  | 'standardEdit'
  | 'specialEdit'
  | 'centerOnly';

export type ResolveObjectMobileCenterLayoutInput = {
  objectTypeKey: string;
  activePrimarySegment: string;
  hasPath: boolean;
  isEditMode: boolean;
};

/** Whether the active tab is the host landing for special (non-Details) object types. */
export function isSpecialHostLanding(
  objectTypeKey: string,
  activePrimarySegment: string,
): boolean {
  if (objectTypeKey === 'list') {
    return activePrimarySegment === 'list';
  }
  if (objectTypeKey === 'widget') {
    return activePrimarySegment === 'widget';
  }
  if (!objectTypeHasDetailsTab(objectTypeKey)) {
    return activePrimarySegment === '';
  }
  return false;
}

/**
 * Resolves how the object page center column stacks on mobile.
 * Desktop layout is unchanged regardless of the returned mode.
 */
export function resolveObjectMobileCenterLayout(
  input: ResolveObjectMobileCenterLayoutInput,
): ObjectMobileCenterLayout {
  const { objectTypeKey, activePrimarySegment, hasPath, isEditMode } = input;

  if (objectTypeHasDetailsTab(objectTypeKey)) {
    if (
      activePrimarySegment === DETAILS_PRIMARY_TAB_SEGMENT &&
      !hasPath
    ) {
      return isEditMode ? 'standardEdit' : 'standardView';
    }
    return 'centerOnly';
  }

  if (isEditMode && isSpecialHostLanding(objectTypeKey, activePrimarySegment)) {
    return 'specialEdit';
  }

  return 'centerOnly';
}
