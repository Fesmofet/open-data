import {
  SEARCH_BOOST_OVERVIEW_TYPE,
  SEARCH_BOOST_SKILL_TYPE,
  SEARCH_BOOST_SPEC_TYPE,
} from '../constants/search-scoring';

export function typeBoost(type: string): number {
  if (type === 'skill' || type === 'playbook') {
    return SEARCH_BOOST_SKILL_TYPE;
  }
  if (type === 'spec' || type === 'lesson' || type === 'agents') {
    return SEARCH_BOOST_SPEC_TYPE;
  }
  if (type === 'overview') {
    return SEARCH_BOOST_OVERVIEW_TYPE;
  }
  return 0;
}
