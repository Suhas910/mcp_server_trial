import { request } from './client';
import type { Member } from '../types';

export interface AuthResult {
  user: Member;
  token: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  avatar?: string;
  color?: string;
}

export function register(input: RegisterInput): Promise<AuthResult> {
  return request<AuthResult>('/auth/register', {
    method: 'POST',
    body: input,
    allowUnauthorized: true,
  });
}

export function login(email: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/auth/login', {
    method: 'POST',
    body: { email, password },
    allowUnauthorized: true,
  });
}

export async function me(): Promise<Member> {
  const { user } = await request<{ user: Member }>('/auth/me');
  return user;
}

export async function updateProfile(updates: {
  name?: string;
  avatar?: string;
  color?: string;
}): Promise<Member> {
  const { user } = await request<{ user: Member }>('/auth/me', { method: 'PATCH', body: updates });
  return user;
}
