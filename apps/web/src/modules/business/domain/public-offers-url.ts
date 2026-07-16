import { businessRoutes } from './routes';

export type PublicOffersPageState = {
  author: string;
  q: string;
};

type PublicOffersSearchParamsSource =
  | Record<string, string | string[] | undefined>
  | URLSearchParams;

function readSearchParam(
  source: PublicOffersSearchParamsSource,
  key: string,
): string | null {
  if (source instanceof URLSearchParams) {
    return source.get(key);
  }
  const value = source[key];
  if (value == null) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** Parse `/offers` or `/requests` query state from RSC `searchParams` or client `URLSearchParams`. */
export function parsePublicOffersPageState(
  source: PublicOffersSearchParamsSource,
): PublicOffersPageState {
  return {
    author: readSearchParam(source, 'author')?.trim() ?? '',
    q: readSearchParam(source, 'q')?.trim() ?? '',
  };
}

export function hasPublicOffersFilters(state: PublicOffersPageState): boolean {
  return state.author !== '' || state.q !== '';
}

export function buildPublicOffersHref(
  kind: 'offer' | 'request',
  params?: { author?: string; q?: string },
): string {
  const base =
    kind === 'offer' ? businessRoutes.publicOffers : businessRoutes.publicRequests;
  const author = params?.author?.trim() ?? '';
  const q = params?.q?.trim() ?? '';
  if (!author && !q) {
    return base;
  }
  const search = new URLSearchParams();
  if (author) {
    search.set('author', author);
  }
  if (q) {
    search.set('q', q);
  }
  return `${base}?${search.toString()}`;
}
