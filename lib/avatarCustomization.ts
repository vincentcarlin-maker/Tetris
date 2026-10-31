export type AvatarSlot = 'head' | 'eyes' | 'neck';
export type AvatarEquipment = Record<AvatarSlot, string | null>;
export const EMPTY_AVATAR_EQUIPMENT: AvatarEquipment = { head:null, eyes:null, neck:null };
export const STARTER_AVATAR_IDS = ['av_human','av_neo','av_fox','av_bot'];
export const CHARACTER_SPRITES: Record<string,{name:string;column:number;row:number}> = {
    av_human:{name:'Nova',column:0,row:0}, av_neo:{name:'Néo',column:1,row:0},
    av_fox:{name:'Foxy',column:0,row:1}, av_bot:{name:'Pixel',column:1,row:1},
};
export type AvatarAccessory = {
    id:string; name:string; slot:AvatarSlot; crop:[number,number,number,number];
    placement:[number,number,number,number];
};
// Source rectangles refer to the transparent accessory atlas (1536 × 1024).
// Placement rectangles are percentages of the portrait, kept separate from the artwork.
export const AVATAR_ACCESSORIES: AvatarAccessory[] = [
    {id:'aa_cap',name:'Casquette cyan',slot:'head',crop:[70,67,430,258],placement:[15,1,70,34]},
    {id:'aa_glasses',name:'Lunettes néon',slot:'eyes',crop:[544,258,455,158],placement:[20,36,60,21]},
    {id:'aa_headphones',name:'Casque audio',slot:'head',crop:[1020,64,488,406],placement:[5,1,90,76]},
    {id:'aa_crown',name:'Couronne',slot:'head',crop:[82,515,376,248],placement:[25,0,50,29]},
    {id:'aa_chain',name:'Chaîne argentée',slot:'neck',crop:[570,686,398,282],placement:[27,66,46,32]},
    {id:'aa_scarf',name:'Foulard magenta',slot:'neck',crop:[1082,707,422,284],placement:[21,69,58,30]},
];
export const AVATAR_SLOT_LABELS: Record<AvatarSlot,string> = {head:'Tête',eyes:'Lunettes',neck:'Cou'};
export function normalizeAvatarEquipment(value: unknown): AvatarEquipment {
    const data = value && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
    return Object.fromEntries((['head','eyes','neck'] as AvatarSlot[]).map(slot=>[
        slot, AVATAR_ACCESSORIES.some(item=>item.id===data[slot]&&item.slot===slot) ? data[slot] : null,
    ])) as AvatarEquipment;
}
export function withStarterAvatars(ids: unknown): string[] {
    return Array.from(new Set([...STARTER_AVATAR_IDS,...(Array.isArray(ids)?ids.filter(id=>typeof id==='string'):[])]));
}
