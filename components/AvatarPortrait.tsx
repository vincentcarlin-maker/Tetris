import React from 'react';
import { User, type LucideProps } from 'lucide-react';
import { AVATAR_ACCESSORIES, CHARACTER_SPRITES, normalizeAvatarEquipment, type AvatarEquipment } from '../lib/avatarCustomization';
interface AvatarPortraitProps {
    avatarId:string; equipment?:Partial<AvatarEquipment>; size?:number|string; className?:string;
    fallback?:React.ComponentType<any>; decorative?:boolean;
}
export const AvatarPortrait: React.FC<AvatarPortraitProps> = ({avatarId,equipment,size=64,className='',fallback:Fallback=User,decorative=false}) => {
    const character=CHARACTER_SPRITES[avatarId];
    const selected=normalizeAvatarEquipment(equipment);
    const baseX=character?character.column*627+24:0,baseY=character?character.row*627+8:0;
    const layers=AVATAR_ACCESSORIES.filter(item=>selected[item.slot]===item.id);
    const label=character ? [character.name,...layers.map(item=>item.name)].join(', ') : 'Avatar';
    return <span className={className} role={decorative?undefined:'img'} aria-label={decorative?undefined:label} aria-hidden={decorative||undefined}
        style={{display:'inline-block',width:size,height:size==='100%'?'auto':size,aspectRatio:'1 / 1',position:'relative',overflow:'hidden',flexShrink:0,isolation:'isolate',verticalAlign:'middle'}}>
        {character?<>
            <span data-avatar-base={avatarId} style={{position:'absolute',inset:0,backgroundImage:'url("assets/avatars/characters.webp")',backgroundSize:`${1254/579*100}% ${1254/604*100}%`,backgroundPosition:`${baseX/(1254-579)*100}% ${baseY/(1254-604)*100}%`,backgroundRepeat:'no-repeat'}}/>
            {layers.map(item=>{
                const [x,y,w,h]=item.crop;
                const [left,top,width,height]=item.placement;
                const foxOffset=avatarId==='av_fox'&&item.slot==='neck'?-5:0;
                return <span key={item.id} data-avatar-accessory={item.id} style={{position:'absolute',pointerEvents:'none',left:`${left}%`,top:`${top+foxOffset}%`,width:`${width}%`,height:`${height}%`,zIndex:item.slot==='eyes'?3:item.slot==='head'?2:1,
                    backgroundImage:'url("assets/avatars/accessories.webp")',backgroundRepeat:'no-repeat',backgroundSize:`${1536/w*100}% ${1024/h*100}%`,backgroundPosition:`${x/(1536-w)*100}% ${y/(1024-h)*100}%`}}/>;
            })}
        </>:<span style={{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center'}}><Fallback size="65%"/></span>}
    </span>;
};
// Legacy avatar consumers can keep using the icon component API.
export const characterIcon = (avatarId:string) => ({size=24,className}:LucideProps) => <AvatarPortrait avatarId={avatarId} size={size} className={className} decorative/>;
