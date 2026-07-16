import type { OfferSignParam, OfferTerminationTerms } from './offer-form.types';

export type { OfferSignParam, OfferTerminationTerms };

export type ParsedOfferTerms = {
  signParams: OfferSignParam[];
  termination?: OfferTerminationTerms;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSignParams(raw: unknown): OfferSignParam[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((item): OfferSignParam | null => {
      if (!isRecord(item)) {
        return null;
      }
      const key = typeof item.key === 'string' ? item.key.trim() : '';
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      if (!key || !label) {
        return null;
      }
      return {
        key,
        label,
        ...(item.required === true ? { required: true } : {}),
      };
    })
    .filter((item): item is OfferSignParam => item !== null);
}

function parseTermination(raw: unknown): OfferTerminationTerms | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const mode = raw.mode === 'instant' || raw.mode === 'notice' ? raw.mode : undefined;
  const who =
    raw.who === 'client' || raw.who === 'provider' || raw.who === 'both'
      ? raw.who
      : undefined;
  const noticeDays =
    typeof raw.noticeDays === 'number' && Number.isFinite(raw.noticeDays)
      ? raw.noticeDays
      : undefined;
  const notes = typeof raw.notes === 'string' ? raw.notes : undefined;
  if (!mode && !who && noticeDays === undefined && !notes) {
    return undefined;
  }
  return { mode, who, noticeDays, notes };
}

export function parseOfferTerms(terms: unknown): ParsedOfferTerms {
  if (!isRecord(terms)) {
    return { signParams: [] };
  }
  return {
    signParams: parseSignParams(terms.signParams),
    termination: parseTermination(terms.termination),
  };
}

export function buildMetadataFromSignValues(
  signParams: readonly OfferSignParam[],
  values: Record<string, string>,
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};
  for (const param of signParams) {
    const value = values[param.key]?.trim() ?? '';
    if (value.length > 0) {
      metadata[param.key] = value;
    }
  }
  return metadata;
}

export function missingRequiredSignParams(
  signParams: readonly OfferSignParam[],
  values: Record<string, string>,
): OfferSignParam[] {
  return signParams.filter((param) => {
    if (!param.required) {
      return false;
    }
    return (values[param.key]?.trim() ?? '').length === 0;
  });
}

export function parseMetadataJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (!isRecord(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
