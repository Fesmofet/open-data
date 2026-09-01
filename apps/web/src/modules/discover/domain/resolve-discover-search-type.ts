import { parseDiscoverPageState } from './discover-url';

/** Resolve discover object type for header search Enter (URL wins, then cookie). */
export function resolveDiscoverSearchType(params: {
  pathname: string;
  search: string;
  rememberedCookie: string | null;
}): string | null {
  if (params.pathname === '/discover' || params.pathname.startsWith('/discover/')) {
    const fromUrl = parseDiscoverPageState(new URLSearchParams(params.search)).objectType;
    if (fromUrl != null) {
      return fromUrl;
    }
  }
  return params.rememberedCookie;
}
