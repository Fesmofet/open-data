import type { PostDiscussionApi, PostDiscussionView } from '../dto/post-discussion.dto';
import { postDiscussionApiSchema } from '../dto/post-discussion.dto';

import { mapDiscussionCommentApiToView } from './feed-story-from-api.mapper';

export function mapPostDiscussionApiToView(raw: PostDiscussionApi): PostDiscussionView {
  const parsed = postDiscussionApiSchema.parse(raw);
  const comments: PostDiscussionView['comments'] = {};
  for (const [key, item] of Object.entries(parsed.comments)) {
    comments[key] = mapDiscussionCommentApiToView(item);
  }
  return {
    rootAuthor: parsed.rootAuthor,
    rootPermlink: parsed.rootPermlink,
    rebloggedUsers: parsed.rebloggedUsers,
    rebloggedByViewer: parsed.rebloggedByViewer,
    rootCommentIds: parsed.rootCommentIds,
    childrenById: parsed.childrenById,
    comments,
  };
}
