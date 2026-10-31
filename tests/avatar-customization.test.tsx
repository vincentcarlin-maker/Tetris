import React from 'react';
import { act, create } from 'react-test-renderer';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { normalizeAvatarEquipment, withStarterAvatars } from '../lib/avatarCustomization';
import { AvatarPortrait } from '../components/AvatarPortrait';
import { useCurrency } from '../hooks/useCurrency';
import { readLocalProfile } from '../lib/localProfile';
const map=new Map<string,string>();
beforeEach(()=>{
    map.clear();
    vi.stubGlobal('localStorage',{getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>map.set(key,value),removeItem:(key:string)=>map.delete(key)});
    vi.stubGlobal('document',{documentElement:{style:{setProperty:vi.fn()}}});
});
afterEach(()=>vi.unstubAllGlobals());
it('only equips known accessories in their matching slots',()=>{
    expect(normalizeAvatarEquipment({head:'aa_cap',eyes:'aa_crown',neck:'https://invalid.example/image.png',extra:'admin'})).toEqual({head:'aa_cap',eyes:null,neck:null});
    expect(withStarterAvatars(['av_king','av_bot'])).toContain('av_king');
    expect(withStarterAvatars([])).toEqual(['av_human','av_neo','av_fox','av_bot']);
});
it('renders a character with independent head, eyes and neck layers',()=>{
    let renderer:ReturnType<typeof create>;
    act(()=>{renderer=create(<AvatarPortrait avatarId="av_fox" equipment={{head:'aa_crown',eyes:'aa_glasses',neck:'aa_scarf'}}/>);});
    expect(renderer.root.findAll(node=>!!node.props['data-avatar-base'])).toHaveLength(1);
    expect(renderer.root.findAll(node=>!!node.props['data-avatar-accessory']).map(node=>node.props['data-avatar-accessory']).sort()).toEqual(['aa_crown','aa_glasses','aa_scarf']);
    act(()=>renderer.unmount());
});
it('persists combinations locally and includes them in cloud profile snapshots',()=>{
    let currency:ReturnType<typeof useCurrency>;
    const Harness=()=>{currency=useCurrency();return null;};
    let renderer:ReturnType<typeof create>;
    act(()=>{renderer=create(<Harness/>);});
    act(()=>currency.equipAvatarAccessory('head','aa_cap'));
    act(()=>currency.equipAvatarAccessory('eyes','aa_glasses'));
    act(()=>currency.equipAvatarAccessory('neck','aa_chain'));
    expect(readLocalProfile().avatarEquipment).toEqual({head:'aa_cap',eyes:'aa_glasses',neck:'aa_chain'});
    act(()=>currency.selectAvatar('av_fox'));
    expect(currency.avatarEquipment.head).toBe('aa_cap');
    act(()=>currency.importData({avatarEquipment:{head:null,eyes:null,neck:null}}));
    expect(currency.avatarEquipment).toEqual({head:null,eyes:null,neck:null});
    act(()=>renderer.unmount());
});
