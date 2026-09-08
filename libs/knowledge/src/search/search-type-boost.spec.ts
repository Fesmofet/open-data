import {
  SEARCH_BOOST_OVERVIEW_TYPE,
  SEARCH_BOOST_SKILL_TYPE,
} from '../constants/search-scoring';
import { typeBoost } from './search-type-boost';

describe('typeBoost', () => {
  it('ranks playbook in the same tier as skill', () => {
    expect(typeBoost('playbook')).toBe(SEARCH_BOOST_SKILL_TYPE);
    expect(typeBoost('skill')).toBe(SEARCH_BOOST_SKILL_TYPE);
    expect(typeBoost('overview')).toBeLessThan(SEARCH_BOOST_SKILL_TYPE);
    expect(typeBoost('overview')).toBe(SEARCH_BOOST_OVERVIEW_TYPE);
  });
});
