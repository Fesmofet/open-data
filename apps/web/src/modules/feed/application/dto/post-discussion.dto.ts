import { z } from 'zod';

import { feedStoryItemApiSchema } from '../mappers/feed-story-from-api.mapper';

export const postDiscussionApiSchema = z.object({
  rootAuthor: z.string(),
  rootPermlink: z.string(),
  rebloggedUsers: z.array(z.string()),
  rebloggedByViewer: z.boolean(),
  rootCommentIds: z.array(z.string()),
  childrenById: z.record(z.string(), z.array(z.string())),
  comments: z.record(z.string(), feedStoryItemApiSchema),
});

export type PostDiscussionApi = z.infer<typeof postDiscussionApiSchema>;

export type PostDiscussionView = {
  rootAuthor: string;
  rootPermlink: string;
  rebloggedUsers: string[];
  rebloggedByViewer: boolean;
  rootCommentIds: string[];
  childrenById: Record<string, string[]>;
  comments: Record<string, import('./feed-story.dto').FeedStoryView>;
};
