import { isToolsHubPath, resolveToolsNavId } from './tools-paths';

describe('tools-paths', () => {
  describe('isToolsHubPath', () => {
    it('matches tools hub routes', () => {
      expect(isToolsHubPath('/tools')).toBe(true);
      expect(isToolsHubPath('/drafts')).toBe(true);
      expect(isToolsHubPath('/settings')).toBe(true);
      expect(isToolsHubPath('/notifications/settings')).toBe(true);
    });

    it('does not match notifications feed', () => {
      expect(isToolsHubPath('/notifications')).toBe(false);
    });
  });

  describe('resolveToolsNavId', () => {
    it('returns notifications for settings path', () => {
      expect(resolveToolsNavId('/notifications/settings')).toBe('notifications');
    });

    it('returns notifications for /tools redirect entry', () => {
      expect(resolveToolsNavId('/tools')).toBe('notifications');
    });

    it('returns drafts for drafts path', () => {
      expect(resolveToolsNavId('/drafts')).toBe('drafts');
    });

    it('returns settings for settings path', () => {
      expect(resolveToolsNavId('/settings')).toBe('settings');
    });
  });
});
