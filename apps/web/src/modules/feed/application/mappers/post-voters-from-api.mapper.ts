import type { PostVotersPageApi, PostVotersPageView } from '../dto/post-voters.dto';
import { postVotersPageApiSchema } from '../dto/post-voters.dto';

export function mapPostVotersPageApiToView(raw: unknown): PostVotersPageView | null {
  const parsed = postVotersPageApiSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return parsed.data satisfies PostVotersPageApi;
}
