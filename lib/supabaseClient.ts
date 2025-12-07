
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
