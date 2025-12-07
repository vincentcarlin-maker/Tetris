
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION SUPABASE ---
// 1. Créez un compte sur https://supabase.com
// 2. Créez un nouveau projet "Neon Arcade"
// 3. Allez dans Project Settings -> API

// Valeurs par défaut (Code source)
const DEFAULT_SUPABASE_URL = 'https://taallvoewrojegodndtb.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_rCAQ6RFblfxvPsxnhTB1Mg_qPjwysb_';

// --- LOGIQUE DE CHARGEMENT DYNAMIQUE ---

// On vérifie d'abord si l'utilisateur a entré ses clés via l'interface (localStorage)
// Cela permet de surcharger la config par défaut si besoin sans recompiler
const storedUrl = localStorage.getItem('neon_supabase_url');
const storedKey = localStorage.getItem('neon_supabase_key');

// On utilise les valeurs stockées en priorité, sinon les valeurs par défaut du code
const SUPABASE_URL = storedUrl || DEFAULT_SUPABASE_URL;
const SUPABASE_ANON_KEY = storedKey || DEFAULT_SUPABASE_ANON_KEY;

let supabaseInstance = null;

// Validation simple pour éviter d'initialiser avec des valeurs placeholders ou vides
const isValidUrl = (url: string) => url && url.startsWith('http') && !url.includes('VOTRE_URL');
const isValidKey = (key: string) => key && key.length > 10 && !key.includes('VOTRE_CLE');

if (isValidUrl(SUPABASE_URL) && isValidKey(SUPABASE_ANON_KEY)) {
    try {
        supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            realtime: {
                params: {
                    eventsPerSecond: 10,
                },
            },
        });
        console.log("Supabase Client Initialized");
    } catch (e) {
        console.error("Supabase init failed:", e);
    }
} else {
    console.warn("Supabase non configuré ou configuration incomplète. Mode hors-ligne actif.");
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = !!supabaseInstance;

// --- FONCTIONS UTILITAIRES POUR L'INTERFACE ---

export const saveSupabaseConfig = (url: string, key: string) => {
    if (url) localStorage.setItem('neon_supabase_url', url.trim());
    if (key) localStorage.setItem('neon_supabase_key', key.trim());
    // On recharge la page pour appliquer la nouvelle configuration proprement
    window.location.reload();
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem('neon_supabase_url');
    localStorage.removeItem('neon_supabase_key');
    window.location.reload();
};

export const getStoredConfig = () => ({
    url: localStorage.getItem('neon_supabase_url') || '',
    key: localStorage.getItem('neon_supabase_key') || ''
});

// --- CLOUD SAVE & LEADERBOARD HELPERS ---

export const DB = {
    // Récupérer le profil complet d'un joueur (pour Login)
    getUserProfile: async (username: string) => {
        if (!supabase) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();
            
            if (error) return null;
            return data; // { username, data: { coins, inventory, password... } }
        } catch (e) {
            return null;
        }
    },

    // Sauvegarder/Mettre à jour le profil (Upsert)
    saveUserProfile: async (username: string, profileData: any) => {
        if (!supabase) return null;
        try {
            // On structure les données pour faciliter les requêtes de classement si besoin plus tard
            // Pour l'instant on dump tout dans une colonne JSONB 'data'
            const { error } = await supabase
                .from('profiles')
                .upsert({ 
                    username: username,
                    data: profileData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'username' });
            
            return { success: !error, error };
        } catch (e) {
            return { success: false, error: e };
        }
    },

    // Récupérer le classement global (Tous les joueurs)
    getGlobalLeaderboard: async () => {
        if (!supabase) return [];
        try {
            // On récupère tous les profils (limité à 100 pour la performance)
            // Dans une vraie app, on ferait une vue SQL matérialisée ou des colonnes séparées pour trier
            const { data, error } = await supabase
                .from('profiles')
                .select('username, data, updated_at')
                .limit(100);

            if (error || !data) return [];

            // On formate pour l'UI
            return data.map((row: any) => ({
                id: row.username, // Use username as ID for leaderboard
                name: row.username,
                avatarId: row.data?.avatarId || 'av_bot',
                frameId: row.data?.frameId,
                status: 'offline', // Historique = offline par défaut
                lastSeen: new Date(row.updated_at).getTime(),
                online_at: row.updated_at,
                stats: row.data?.highScores || {}
            }));
        } catch (e) {
            return [];
        }
    }
};
