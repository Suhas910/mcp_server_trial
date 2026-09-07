import { request } from './client';
import type { Group } from '../types';

export async function listGroups(): Promise<Group[]> {
  const { groups } = await request<{ groups: Group[] }>('/groups');
  return groups;
}

export async function getGroup(groupId: string): Promise<Group> {
  const { group } = await request<{ group: Group }>(`/groups/${groupId}`);
  return group;
}

export async function createGroup(input: {
  name: string;
  description: string;
  emoji: string;
  color: string;
}): Promise<Group> {
  const { group } = await request<{ group: Group }>('/groups', { method: 'POST', body: input });
  return group;
}

/**
 * The API resolves `:id` as a group UUID or an invite code, so the invite-code
 * flow needs no separate endpoint. Codes are uppercase server-side.
 */
export async function joinGroup(inviteCode: string): Promise<Group> {
  const { group } = await request<{ group: Group }>(
    `/groups/${encodeURIComponent(inviteCode.trim().toUpperCase())}/join`,
    { method: 'POST' },
  );
  return group;
}
