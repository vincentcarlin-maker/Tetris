import { beforeEach, afterEach, expect, it, vi } from 'vitest';
function storage() {
    const map=new Map<string,string>();
    return {getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>map.set(key,value),removeItem:(key:string)=>map.delete(key),clear:()=>map.clear()};
}
const session={user:{id:'alice-id',email:'alice@example.org',username:'Alice'},profile:{data:{coins:5},version:1,updatedAt:1}};
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(()=>{
    vi.resetModules();vi.stubGlobal('sessionStorage',storage());
    fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
});
afterEach(()=>vi.unstubAllGlobals());
it('keeps the session in tab storage and never stores a password',async()=>{
    fetchMock.mockResolvedValue(Response.json({...session,token:'a'.repeat(64)}));
    const {cloudAccounts}=await import('../lib/cloudAccounts');
    const listener=vi.fn();cloudAccounts.subscribe(listener);
    await cloudAccounts.login('alice@example.org','secret-password');
    expect(sessionStorage.getItem('neon_cloud_session')).toBe('a'.repeat(64));
    expect(listener).toHaveBeenCalledWith(session);
    expect(JSON.stringify(sessionStorage)).not.toContain('secret-password');
    expect(fetchMock.mock.calls[0][1].credentials).toBe('omit');
});
it('serializes concurrent saves using the server revision',async()=>{
    fetchMock.mockImplementation(async(_url:string,options:any)=>{
        if(options.method==='PUT'){
            const body=JSON.parse(options.body);
            return Response.json({version:body.version+1,updated_at:2});
        }
        return Response.json({...session,token:'a'.repeat(64)});
    });
    const {cloudAccounts}=await import('../lib/cloudAccounts');
    await cloudAccounts.login('alice@example.org','secret-password');
    await Promise.all([cloudAccounts.save({coins:6}),cloudAccounts.save({coins:7})]);
    const writes=fetchMock.mock.calls.filter(call=>call[1].method==='PUT');
    expect(writes.map(call=>JSON.parse(call[1].body).version)).toEqual([1,2]);
});
it('blocks further writes after a conflict until the user explicitly reloads',async()=>{
    fetchMock.mockResolvedValueOnce(Response.json({...session,token:'a'.repeat(64)}));
    const {cloudAccounts}=await import('../lib/cloudAccounts');
    await cloudAccounts.login('alice@example.org','secret-password');
    fetchMock.mockResolvedValueOnce(Response.json({error:'Conflict'},{status:409}));
    await expect(cloudAccounts.save({coins:6})).rejects.toThrow('Conflict');
    const count=fetchMock.mock.calls.length;
    await expect(cloudAccounts.save({coins:7})).rejects.toThrow('autre appareil');
    expect(fetchMock).toHaveBeenCalledTimes(count);
    fetchMock.mockResolvedValueOnce(Response.json({...session,profile:{...session.profile,version:5}}));
    await cloudAccounts.reload();
    fetchMock.mockResolvedValueOnce(Response.json({version:6,updated_at:3}));
    await cloudAccounts.save({coins:8});
    expect(JSON.parse(fetchMock.mock.calls.at(-1)![1].body).version).toBe(5);
});
it('retains an unsent save after a network failure and restores it on reopening the page',async()=>{
    fetchMock.mockResolvedValueOnce(Response.json({...session,token:'a'.repeat(64)}));
    let {cloudAccounts}=await import('../lib/cloudAccounts');
    await cloudAccounts.login('alice@example.org','secret-password');
    fetchMock.mockRejectedValueOnce(new Error('Offline'));
    await expect(cloudAccounts.save({coins:42})).rejects.toThrow('Offline');
    vi.resetModules();
    ({cloudAccounts}=await import('../lib/cloudAccounts'));
    fetchMock.mockResolvedValueOnce(Response.json(session));
    const restored=await cloudAccounts.load();
    expect(restored?.profile.data.coins).toBe(42);
    expect(cloudAccounts.hasPending()).toBe(true);
});
it('preserves the original revision when caching a conflicted save again',async()=>{
    fetchMock.mockResolvedValueOnce(Response.json({...session,token:'a'.repeat(64)}));
    let {cloudAccounts}=await import('../lib/cloudAccounts');
    await cloudAccounts.login('alice@example.org','secret-password');
    cloudAccounts.stage({coins:42});
    vi.resetModules();
    ({cloudAccounts}=await import('../lib/cloudAccounts'));
    fetchMock.mockResolvedValueOnce(Response.json({...session,profile:{...session.profile,version:2}}));
    await cloudAccounts.load();
    expect(cloudAccounts.hasConflict()).toBe(true);
    cloudAccounts.stage({coins:43});
    expect(JSON.parse(sessionStorage.getItem('neon_pending_cloud_save')!).version).toBe(1);
    await expect(cloudAccounts.save({coins:43})).rejects.toThrow('autre appareil');
});
