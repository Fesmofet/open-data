import {
  canSelectMoreGroupMembers,
} from '../domain/messaging.helpers';
import { validateGroupInvitees } from '../infrastructure/messaging-validate.client';
import { buildMessagesHref } from '../infrastructure/messaging-channel-sync';

export type StartChatInput = {
  peers: readonly string[];
  title?: string;
};

export type StartChatAction =
  | { kind: 'dm'; peer: string; href: string }
  | { kind: 'group'; members: string[]; title?: string }
  | { kind: 'noop' };

export async function resolveStartChatAction(
  accountName: string,
  viewerUsername: string,
  input: StartChatInput,
): Promise<StartChatAction> {
  if (input.peers.length === 0) {
    return { kind: 'noop' };
  }
  if (input.peers.length === 1) {
    const peer = input.peers[0]!.trim();
    const params = new URLSearchParams();
    params.set('peer', peer);
    return {
      kind: 'dm',
      peer,
      href: `/@${accountName}/messages?${params.toString()}`,
    };
  }
  const validation = await validateGroupInvitees(viewerUsername, input.peers);
  const members = (validation?.results ?? [])
    .filter((row) => row.addable)
    .map((row) => row.account);
  if (members.length === 0) {
    return { kind: 'noop' };
  }
  if (!canSelectMoreGroupMembers(1, members.length)) {
    return { kind: 'noop' };
  }
  return {
    kind: 'group',
    members,
    title: input.title,
  };
}

export function buildGroupChannelHref(accountName: string, channelId: string): string {
  return buildMessagesHref(accountName, channelId);
}

export function buildDmHref(accountName: string, peer: string): string {
  const params = new URLSearchParams();
  params.set('peer', peer);
  return `/@${accountName}/messages?${params.toString()}`;
}
