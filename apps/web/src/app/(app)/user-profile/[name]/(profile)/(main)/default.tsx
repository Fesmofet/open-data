/**
 * Next.js 16 parallel-route fallback for the `(main)` children slot.
 * Required so hard navigations (e.g. `/@account/transfers`) resolve with `@leftSidebar`.
 * @see https://nextjs.org/docs/messages/slot-missing-default
 */
export default function UserProfileMainDefault() {
  return null;
}
