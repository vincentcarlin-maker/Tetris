import type { User } from '@supabase/supabase-js';
import { supabase, publicProfileData } from './supabaseClient';

export const defaultProfile = () => ({
    avatarEquipment: { head:null, eyes:null, neck:null },
    coins: 0, inventory: [], avatarId: 'av_bot', ownedAvatars: ['av_bot', 'av_human'],
    frameId: 'fr_none', ownedFrames: ['fr_none'], wallpaperId: 'bg_brick', ownedWallpapers: ['bg_brick'],
    titleId: 't_none', ownedTitles: ['t_none'], malletId: 'm_classic', ownedMallets: ['m_classic'],
    tankId: 'tk_classic', ownedTanks: ['tk_classic'], tankAccessoryId: 'ta_none', ownedTankAccessories: ['ta_none'],
    slitherSkinId: 'ss_cyan', ownedSlitherSkins: ['ss_cyan'], slitherAccessoryId: 'sa_none', ownedSlitherAccessories: ['sa_none'],
    friends: [], email: '', highScores: {}, daily: { streak: 0, quests: [], allCompletedBonusClaimed: false },
});

export const requireSupabase = () => {
    if (!supabase) throw new Error("Les comptes ne sont pas encore configurés. Le mode invité reste disponible.");
    return supabase;
};

export const isAdmin = (user: User | null) => user?.app_metadata?.role === 'admin';

export async function loadOwnProfile() {
    const client = requireSupabase();
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) return null;
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    if (!user) return null;
    const { data: existing, error } = await client.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    if (existing?.data?.banned) throw new Error('Compte suspendu.');
    if (existing) return { user, profile: existing };
    // Legacy profiles are never claimed just by knowing their username or email.
    const username = user.user_metadata?.username;
    if (typeof username !== 'string' || !/^[\p{L}\p{N}_-]{3,24}$/u.test(username)) {
        throw new Error("Ce compte doit être rattaché à un profil par l'administrateur.");
    }
    const { data: profile, error: insertError } = await client.from('profiles').insert({
        username, user_id: user.id, data: { ...publicProfileData(defaultProfile()), cgu_accepted: true }, updated_at: new Date().toISOString()
    }).select().single();
    if (insertError) {
        // Auth callbacks can race with initial session restoration.
        const { data: concurrent, error: retryError } = await client.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
        if (retryError || !concurrent) throw insertError;
        return { user, profile: concurrent };
    }
    return { user, profile };
}

export function removeLegacyCredentials() {
    for (const key of Object.keys(localStorage)) {
        if (key === 'neon_current_password' || key === 'neon_users_db' || key.startsWith('neon_data_')) localStorage.removeItem(key);
    }
}
