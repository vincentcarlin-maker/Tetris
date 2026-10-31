import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => {
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_test';
    return { createClient: vi.fn() };
});
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
it('does not initialize a backend in guest mode even if deployment credentials exist', () => {
    expect(supabase).toBeNull();
    expect(isSupabaseConfigured).toBe(false);
    expect(mocks.createClient).not.toHaveBeenCalled();
});
