import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
const origin = 'https://vincentcarlin-maker.github.io';
let mf, db;
before(async () => {
    mf = new Miniflare(convertV4MiniflareOptions({ modules: true, scriptPath: new URL('../dist/worker.mjs', import.meta.url).pathname, compatibilityDate:'2026-10-30', compatibilityFlags:['nodejs_compat'], d1Databases:{ DB:'test-db' }, bindings:{APP_ORIGIN:origin} }));
    db = (await mf.getBindings()).DB;
    const schema = await readFile(new URL('../migrations/0001_accounts.sql',import.meta.url),'utf8');
    for (const sql of schema.split(';').filter(s=>s.trim())) await db.prepare(sql).run();
});
after(async () => { await mf?.dispose(); });
let sequence=0;
async function request(path,method='GET',data,token,headers={}) {
    const r=await mf.dispatchFetch('https://api.example'+path,{method,headers:{Origin:origin,'CF-Connecting-IP':'10.0.0.'+(++sequence),...(data?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{}),...headers},...(data?{body:JSON.stringify(data)}:{})});
    return {status:r.status,headers:r.headers,body:await r.json()};
}
const pass='A long unique test password 2026!';
async function register(name,extra={}) {
    const r=await request('/auth/register','POST',{username:name,email:name.toLowerCase()+'@example.org',password:pass,accepted:true,data:{coins:15,highScores:{tetris:100}},...extra});
    assert.equal(r.status,200,JSON.stringify(r.body));return r.body;
}
test('registration hashes credentials and exposes only the current user',async()=>{
    const a=await register('Alice');
    assert.ok(a.recoveryCode);assert.ok(a.token);
    const user=await db.prepare('SELECT * FROM users WHERE id=?').bind(a.user.id).first();
    assert.notEqual(user.password_hash,pass);assert.ok(!user.password_hash.includes(pass));
    assert.notEqual(user.recovery_hash,a.recoveryCode);
    const s=await db.prepare('SELECT token_hash FROM sessions WHERE user_id=?').bind(a.user.id).first();assert.notEqual(s.token_hash,a.token);
    const me=await request('/me','GET',undefined,a.token);assert.equal(me.body.user.username,'Alice');assert.equal(me.body.profile.data.coins,15);
    assert.equal(me.body.user.password_hash,undefined);
    assert.equal((await request('/me')).status,401);
});
test('login, private saves and optimistic concurrency work across sessions',async()=>{
    const a=await register('SaveUser'), b=await register('OtherUser');
    const login=await request('/auth/login','POST',{email:'saveuser@example.org',password:pass});assert.equal(login.status,200);
    assert.equal((await request('/auth/login','POST',{email:'saveuser@example.org',password:'wrong-long-password'})).status,401);
    assert.equal((await request('/profile','PUT',{version:1,data:{coins:99}},a.token)).status,200);
    assert.equal((await request('/profile','PUT',{version:1,data:{coins:0}},login.body.token)).status,409);
    assert.equal((await request('/me','GET',undefined,b.token)).body.profile.data.coins,15);
    assert.equal((await request('/me','GET',undefined,login.body.token)).body.profile.data.coins,99);
    assert.equal((await request('/profile','PUT',{version:2,data:{role:'admin'}},a.token)).status,400);
    assert.equal((await request('/profile','PUT',{version:2,data:{user_id:b.user.id}},a.token)).status,400);
    assert.equal((await request('/profile','PUT',{version:2,data:{coins:-1}},a.token)).status,400);
});
test('recovery rotates the code and revokes all existing sessions',async()=>{
    const a=await register('Recovery');
    assert.equal((await request('/auth/recover','POST',{email:'recovery@example.org',password:pass,code:'invalid'})).status,400);
    const r=await request('/auth/recover','POST',{email:'recovery@example.org',password:pass+'new',code:a.recoveryCode});assert.equal(r.status,200);
    assert.ok(r.body.recoveryCode);assert.notEqual(r.body.recoveryCode,a.recoveryCode);
    assert.equal((await request('/me','GET',undefined,a.token)).status,401);
    assert.equal((await request('/auth/recover','POST',{email:'recovery@example.org',password:pass,code:a.recoveryCode})).status,400);
    assert.equal((await request('/auth/login','POST',{email:'recovery@example.org',password:pass+'new'})).status,200);
});
test('logout and account deletion revoke access and remove saved data',async()=>{
    const a=await register('DeleteUser');
    assert.equal((await request('/auth/logout','POST',{},a.token)).status,200);
    assert.equal((await request('/me','GET',undefined,a.token)).status,401);
    const l=await request('/auth/login','POST',{email:'deleteuser@example.org',password:pass});
    assert.equal((await request('/account/delete','POST',{password:pass},l.body.token)).status,200);
    assert.equal((await request('/me','GET',undefined,l.body.token)).status,401);
    assert.equal(await db.prepare('SELECT * FROM profiles WHERE user_id=?').bind(a.user.id).first(),null);
});
test('rejects foreign origins and limits brute-force attempts',async()=>{
    assert.equal((await request('/health','GET',undefined,undefined,{Origin:'https://attacker.invalid'})).status,403);
    let r;
    for(let i=0;i<13;i++)r=await request('/auth/login','POST',{email:'nobody@example.org',password:pass});
    assert.equal(r.status,429);
});
test('password changes revoke sessions and renewed recovery codes replace the old one',async()=>{
    const a=await register('ChangePass');
    const r=await request('/account/recovery-code','POST',{password:pass},a.token);
    assert.equal(r.status,200);assert.notEqual(r.body.recoveryCode,a.recoveryCode);
    assert.equal((await request('/auth/recover','POST',{email:'changepass@example.org',password:pass,code:a.recoveryCode})).status,400);
    const c=await request('/account/password','POST',{password:pass,newPassword:pass+'changed'},a.token);
    assert.equal(c.status,200);
    assert.equal((await request('/me','GET',undefined,a.token)).status,401);
    assert.equal((await request('/auth/login','POST',{email:'changepass@example.org',password:pass+'changed'})).status,200);
});
test('saves avatar layers privately and rejects accessories assigned to the wrong slots',async()=>{
    const a=await register('AvatarUser'),b=await register('AvatarOther');
    const equipment={head:'aa_crown',eyes:'aa_glasses',neck:'aa_scarf'};
    assert.equal((await request('/profile','PUT',{version:1,data:{avatarId:'av_fox',avatarEquipment:equipment}},a.token)).status,200);
    assert.deepEqual((await request('/me','GET',undefined,a.token)).body.profile.data.avatarEquipment,equipment);
    assert.equal((await request('/me','GET',undefined,b.token)).body.profile.data.avatarEquipment,undefined);
    assert.equal((await request('/profile','PUT',{version:2,data:{coins:20}},a.token)).status,200);
    assert.deepEqual((await request('/me','GET',undefined,a.token)).body.profile.data.avatarEquipment,equipment);
    assert.equal((await request('/profile','PUT',{version:2,data:{avatarEquipment:{head:'aa_scarf'}}},a.token)).status,400);
    assert.equal((await request('/profile','PUT',{version:2,data:{avatarEquipment:{url:'https://invalid.example'}}},a.token)).status,400);
    assert.equal((await request('/profile','PUT',{version:3,data:{avatarEquipment:{toString:null}}},a.token)).status,400);
});
