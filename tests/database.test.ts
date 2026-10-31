import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { beforeAll, beforeEach, afterAll, expect, it } from 'vitest';
let db: PGlite;
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';
async function login(id = alice, role = 'user') {
    await db.exec('reset role');
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ sub: id, app_metadata: { role } })]);
    await db.exec('set role authenticated');
}
beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create table auth.sessions(user_id uuid references auth.users);
      grant usage on schema auth, public to anon, authenticated;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
      create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
      create table public.profiles(username text primary key, data jsonb default '{}', updated_at timestamptz default now());
      insert into public.profiles(username,data) values('Legacy','{"password":"insecure","reset_code":"123456","email":"private@example.org"}');
    `);
    await db.exec(await readFile(new URL('../supabase/security-upgrade.sql', import.meta.url), 'utf8'));
    const result = await db.query<{data: any}>("select data from public.profiles where username='Legacy'");
    expect(result.rows[0].data).toEqual({});
}, 30000);
beforeEach(async () => {
    await db.exec('reset role');
    await db.exec(`truncate public.messages, public.transactions; delete from public.profiles; delete from auth.sessions; delete from auth.users;
      insert into auth.users values('${alice}'),('${bob}'),('${admin}');
      insert into public.profiles(username,user_id,data) values
      ('Alice','${alice}','{"coins":10,"friends":[]}'),('Bob','${bob}','{"coins":20,"friends":[]}'),('Admin','${admin}','{}'),('SYSTEM_CONFIG',null,'{"featureFlags":{"social_module":true},"transaction_logs":["private"]}');`);
    await login();
});
afterAll(async () => { await db?.close(); });
it('lets a user save their profile but denies another profile and system settings', async () => {
    await db.query("select public.save_my_profile('Alice', '{\"coins\":15}')");
    await expect(db.query("select public.save_my_profile('Bob', '{\"coins\":0}')")).rejects.toThrow();
    await expect(db.query("select public.save_my_profile('SYSTEM_CONFIG', '{}')")).rejects.toThrow();
});
it('rejects privilege changes, credentials and identity reassignment', async () => {
    await expect(db.query("select public.save_my_profile('Alice', '{\"role\":\"admin\"}')")).rejects.toThrow();
    await expect(db.query("select public.save_my_profile('Alice', '{\"password\":\"cleartext\"}')")).rejects.toThrow();
    await expect(db.query("update public.profiles set user_id=$1 where username='Alice'", [bob])).rejects.toThrow();
});
it('only exposes a safe directory and public configuration to visitors', async () => {
    await db.exec('reset role; set role anon');
    await expect(db.query('select * from public.profiles')).rejects.toThrow();
    const directory = await db.query<{data: any}>('select data from public.public_profiles');
    expect(directory.rows.every(row => !('coins' in row.data) && !('email' in row.data) && !('friends' in row.data))).toBe(true);
    const config = await db.query<{data: any}>('select data from public.app_config');
    expect(config.rows[0].data.transaction_logs).toBeUndefined();
});
it('enforces the sender and prevents message rewriting', async () => {
    await expect(db.query("insert into public.messages(sender_id,receiver_id,text) values('Bob','Alice','spoof')")).rejects.toThrow();
    await db.query("insert into public.messages(sender_id,receiver_id,text) values('Alice','Bob','hello')");
    await login(bob);
    await db.query('update public.messages set read=true');
    await expect(db.query("update public.messages set text='changed'")).rejects.toThrow();
});
it('accepts friendship reciprocally only when a real request exists', async () => {
    await expect(db.query("select public.accept_friend_request('Bob')")).rejects.toThrow();
    await db.query("insert into public.messages(sender_id,receiver_id,text) values('Alice','Bob','CMD:FRIEND_REQUEST')");
    await login(bob);
    await db.query("select public.accept_friend_request('Alice')");
    const own = await db.query<{data: any}>("select data from public.profiles where username='Bob'");
    expect(own.rows[0].data.friends[0].name).toBe('Alice');
    await login();
    const other = await db.query<{data: any}>("select data from public.profiles where username='Alice'");
    expect(other.rows[0].data.friends[0].name).toBe('Bob');
});
it('allows a verified admin to manage profiles and configuration', async () => {
    await login(admin, 'admin');
    await db.query("select public.save_my_profile('Bob', '{\"banned\":true}')");
    await db.query("select public.save_my_profile('SYSTEM_CONFIG', '{\"disabledGames\":[\"snake\"]}')");
    await login(bob);
    await expect(db.query("select public.save_my_profile('Bob', '{\"coins\":999}')")).rejects.toThrow();
});
it('deletes only the authenticated account and revokes its database access', async () => {
    await expect(db.query("select public.delete_my_account('Bob')")).rejects.toThrow();
    await db.query("select public.delete_my_account('Alice')");
    await expect(db.query("insert into public.profiles(username,user_id,data) values('Alice',$1,'{}')", [alice])).rejects.toThrow();
});
