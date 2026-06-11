/** Weight for ts_rank_cd (BM25-like cover density). */
export const SEARCH_WEIGHT_FTS = 1.0;

/** Weight for pg_trgm similarity on routing_text. */
export const SEARCH_WEIGHT_TRGM = 0.6;

export const SEARCH_BOOST_TITLE = 0.5;
export const SEARCH_BOOST_DESCRIPTION = 0.35;
export const SEARCH_BOOST_SKILL_TYPE = 0.25;
export const SEARCH_BOOST_SPEC_TYPE = 0.2;
export const SEARCH_BOOST_OVERVIEW_TYPE = -0.1;
export const SEARCH_BOOST_ACTIVE_STATUS = 0.1;
export const SEARCH_BOOST_INACTIVE_STATUS = -0.5;

/** Minimum trigram similarity for file-level route candidates. */
export const ROUTE_MIN_SIMILARITY = 0.15;

/** Top route confidence to prefer chunk pick over hybrid search fallback. */
export const ROUTE_CONFIDENCE_THRESHOLD = 0.25;

export const LIST_FILES_DEFAULT_LIMIT = 50;
export const LIST_FILES_MAX_LIMIT = 200;
