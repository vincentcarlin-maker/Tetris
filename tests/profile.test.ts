import { expect, it } from 'vitest';
import { publicProfileData } from '../lib/supabaseClient';
import { isAdmin } from '../lib/auth';
it('does not persist legacy credentials or authorization fields in normal profile sync', () => {
    expect(publicProfileData({ coins: 4, password: 'secret', reset_code: '123456', reset_expiry: 10, email: 'private@example.org', role: 'admin', banned: false })).toEqual({ coins: 4 });
});
it('does not accept a user-editable metadata role as admin authority', () => {
    expect(isAdmin({ user_metadata: { role: 'admin' }, app_metadata: {} } as any)).toBe(false);
    expect(isAdmin({ app_metadata: { role: 'admin' } } as any)).toBe(true);
});
