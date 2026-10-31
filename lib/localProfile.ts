import { defaultProfile } from './auth';
const mapping: Record<string, string> = {
    avatarEquipment:'neon-avatar-equipment',
    coins:'neon-coins',inventory:'neon-inventory',avatarId:'neon-avatar',ownedAvatars:'neon_owned_avatars',
    frameId:'neon-frame',ownedFrames:'neon-owned-frames',wallpaperId:'neon-wallpaper',ownedWallpapers:'neon-owned-wallpapers',
    titleId:'neon-title',ownedTitles:'neon-owned-titles',malletId:'neon-mallet',ownedMallets:'neon-owned-mallets',
    tankId:'neon-tank',ownedTanks:'neon-owned-tanks',tankAccessoryId:'neon-tank-accessory',ownedTankAccessories:'neon-owned-tank-accessories',
    slitherSkinId:'neon-slither-skin',ownedSlitherSkins:'neon-owned-slither-skins',slitherAccessoryId:'neon-slither-accessory',ownedSlitherAccessories:'neon-owned-slither-accessories',
    accentColor:'neon-accent-color',reducedMotion:'neon-reduced-motion',voiceChatEnabled:'neon-voice-chat',language:'neon-language',highScores:'neon-highscores',
};
const gameKeys = ['breaker-max-level','rush-unlocked-level','runner_skin_id','runner_owned_skins'];
function read(key: string, fallback: unknown) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    try { return JSON.parse(raw); } catch { return raw; }
}
export function readLocalProfile(): Record<string, any> {
    const defaults = { ...defaultProfile(), accentColor:'default', reducedMotion:false, voiceChatEnabled:true, language:'fr' } as Record<string, any>;
    const data: Record<string, any> = {};
    for (const [field,key] of Object.entries(mapping)) data[field] = read(key, defaults[field]);
    data.coins = Number.isSafeInteger(data.coins) && data.coins >= 0 ? data.coins : 0;
    data.daily = { streak:read('neon_streak',0), quests:read('neon_daily_quests',[]), allCompletedBonusClaimed:read('neon_bonus_claimed',false), lastLogin:localStorage.getItem('neon_last_login') || '' };
    data.gameProgress = Object.fromEntries(gameKeys.map(key => [key, localStorage.getItem(key)]));
    return data;
}
export function restoreGameProgress(data: Record<string, any>) {
    for (const key of gameKeys) {
        const value = data.gameProgress?.[key];
        if (typeof value === 'string') localStorage.setItem(key,value);
        else localStorage.removeItem(key);
    }
}
