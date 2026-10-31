import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    return { client: { auth: { getSession: vi.fn(), getUser: vi.fn() }, from: vi.fn(), rpc: vi.fn() } };
});
vi.mock('@supabase/supabase-js', () => ({ createClient: () => mocks.client }));
import { loadOwnProfile } from '../lib/auth';
import { DB } from '../lib/supabaseClient';
beforeEach(() => { vi.resetAllMocks(); });
it('treats a missing session as a guest without requesting a user profile', async () => {
    mocks.client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    expect(await loadOwnProfile()).toBeNull();
    expect(mocks.client.auth.getUser).not.toHaveBeenCalled();
});
it('creates a profile without storing Auth credentials or email in its JSON', async () => {
    mocks.client.auth.getSession.mockResolvedValue({ data: { session: {} }, error: null });
    mocks.client.auth.getUser.mockResolvedValue({ data: { user: { id: 'auth-user-id', user_metadata: { username: 'Alice' } } }, error: null });
    const insert = vi.fn((_row: any) => ({ select: () => ({ single: async () => ({ data: { username: 'Alice' }, error: null }) }) }));
    mocks.client.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }), insert });
    await loadOwnProfile();
    const row = insert.mock.calls[0][0] as any;
    expect(row.user_id).toBe('auth-user-id');
    expect(row.data).not.toHaveProperty('email');
    expect(row.data).not.toHaveProperty('password');
});
it('propagates a rejected cloud save instead of announcing success', async () => {
    mocks.client.rpc.mockResolvedValue({ data: null, error: new Error('Access denied') });
    await expect(DB.saveUserProfile('Alice', { coins: 10 })).rejects.toThrow('Access denied');
});
