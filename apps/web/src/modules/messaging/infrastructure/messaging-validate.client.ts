'use client';

export type ValidateMemberReason =
  | 'muted_by_viewer'
  | 'muted_viewer'
  | 'governance_muted'
  | 'already_member'
  | 'group_full';

export type ValidateMemberResult = {
  account: string;
  addable: boolean;
  reason?: ValidateMemberReason;
};

export type ValidateMembersResponse = {
  results: ValidateMemberResult[];
};

async function postValidateMembers(
  path: string,
  accounts: readonly string[],
): Promise<ValidateMembersResponse | null> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accounts }),
      cache: 'no-store',
    });
  } catch {
    return null;
  }
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as ValidateMembersResponse;
}

export async function validateChannelMembers(
  channelId: string,
  _viewer: string,
  accounts: readonly string[],
): Promise<ValidateMembersResponse | null> {
  return postValidateMembers(
    `/api/messaging/channels/${encodeURIComponent(channelId)}/validate-members`,
    accounts,
  );
}

export async function validateGroupInvitees(
  _viewer: string,
  accounts: readonly string[],
): Promise<ValidateMembersResponse | null> {
  return postValidateMembers('/api/messaging/channels/validate-invitees', accounts);
}
