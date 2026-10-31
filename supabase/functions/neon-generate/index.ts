import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { GoogleGenAI, Type } from 'npm:@google/genai@1.34.0';

const allowedOrigin = Deno.env.get('APP_ORIGIN') || '';
const headers = { 'Access-Control-Allow-Origin': allowedOrigin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json', Vary: 'Origin' };
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async request => {
    if (!allowedOrigin || request.headers.get('origin') !== allowedOrigin) return respond({ error: 'Origin denied' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
    try {
        const authorization = request.headers.get('authorization');
        if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Unauthorized' }, 401);
        const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
        const { data: { user }, error } = await client.auth.getUser();
        if (error || !user) return respond({ error: 'Unauthorized' }, 401);
        if (user.app_metadata?.role !== 'admin') return respond({ error: 'Forbidden' }, 403);
        const raw = await request.text();
        if (raw.length > 12000) return respond({ error: 'Request too large' }, 413);
        const { model, prompt } = JSON.parse(raw);
        if (!['gemini-2.5-flash-image', 'gemini-3-pro-image-preview'].includes(model) || typeof prompt !== 'string' || prompt.length > 4000) return respond({ error: 'Invalid request' }, 400);
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) return respond({ error: 'Generation not configured' }, 503);
        const ai = new GoogleGenAI({ apiKey });
        const imageResponse = await ai.models.generateContent({ model, contents: { parts: [{ text: prompt || 'A futuristic cyberpunk hidden object game scene, neon lights, portrait 9:16.' }] }, config: { imageConfig: { aspectRatio: '9:16', ...(model.includes('pro') ? { imageSize: '1K' } : {}) } } });
        const image = imageResponse.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.data)?.inlineData;
        if (!image?.data) return respond({ error: 'No image generated' }, 502);
        const analysis = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [{ inlineData: image }, { text: 'Give this image a short French title and identify five hidden objects with center x/y coordinates in percentages from 0 to 100. Return JSON.' }] }, config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, required: ['title', 'objects'], properties: { title: { type: Type.STRING }, objects: { type: Type.ARRAY, items: { type: Type.OBJECT, required: ['id', 'name', 'x', 'y'], properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, x: { type: Type.NUMBER }, y: { type: Type.NUMBER } } } } } } } });
        const result = JSON.parse(analysis.text || '{}');
        if (typeof result.title !== 'string' || !Array.isArray(result.objects) || result.objects.some((o: any) => typeof o.id !== 'string' || typeof o.name !== 'string' || !Number.isFinite(o.x) || !Number.isFinite(o.y) || o.x < 0 || o.x > 100 || o.y < 0 || o.y > 100)) return respond({ error: 'Invalid analysis' }, 502);
        return respond({ image: `data:${image.mimeType || 'image/png'};base64,${image.data}`, title: result.title, objects: result.objects });
    } catch (error) {
        console.error('Generation failed', error instanceof Error ? error.name : 'UnknownError');
        return respond({ error: 'Generation failed. Check server logs and quota.' }, 502);
    }
});
