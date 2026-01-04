
import React, { useState, useEffect, useRef } from 'react';
import { Image, Sparkles, Check, Save, Loader2, RefreshCw, AlertTriangle, Key, Search, ScanEye, Trash2, Plus, Crosshair, Edit3, Cpu, Layers } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import { HiddenObject, SeekLevel } from '../neon_seek/types';

const GENERATION_MODELS = [
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Standard)', type: 'GEMINI' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro (Haute Qualité)', type: 'GEMINI' },
    { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0 (Ultra Réaliste)', type: 'IMAGEN' }
];

export const NeonSeekGenSection: React.FC<{ mp: any }> = ({ mp }) => {
    const { neonSeekConfig } = useGlobal();
    const [selectedSlot, setSelectedSlot] = useState<number>(1);
    const [levelTitle, setLevelTitle] = useState('');
    const [levelDesc, setLevelDesc] = useState('');
    const [levelDifficulty, setLevelDifficulty] = useState<'FACILE' | 'MOYEN' | 'EXPERT'>('MOYEN');
    const [levelReward, setLevelReward] = useState<number>(100);
    
    const [prompt, setPrompt] = useState('A mysterious cyberpunk interior, high detail, portrait 9:16, neon lights, scattered tech items.');
    const [selectedModel, setSelectedModel] = useState(GENERATION_MODELS[0].id);
    
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [detectedObjects, setDetectedObjects] = useState<HiddenObject[]>([]);
    
    const [status, setStatus] = useState<'IDLE' | 'GENERATING_IMAGE' | 'ANALYZING_OBJECTS' | 'READY'>('IDLE');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const imagePreviewRef = useRef<HTMLDivElement>(null);

    // Charger les données du slot sélectionné depuis la config globale
    useEffect(() => {
        const slotData = neonSeekConfig?.customLevels?.[selectedSlot];
        if (slotData) {
            setGeneratedImage(slotData.image);
            setDetectedObjects(slotData.objects || []);
            setLevelTitle(slotData.title || `NIVEAU ${selectedSlot}`);
            setLevelDesc(slotData.description || '');
            setLevelDifficulty(slotData.difficulty || 'MOYEN');
            setLevelReward(slotData.reward || 100);
        } else {
            // Reset pour un nouveau slot
            setGeneratedImage(null);
            setDetectedObjects([]);
            setLevelTitle(`NIVEAU ${selectedSlot}`);
            setLevelDesc('');
            setLevelDifficulty('MOYEN');
            setLevelReward(100);
        }
        setSuccess(null);
        setError(null);
    }, [selectedSlot, neonSeekConfig]);

    const handleSelectKey = async () => {
        const win = window as any;
        if (win?.aistudio) await win.aistudio.openSelectKey();
    };

    const handleGenerate = async () => {
        setStatus('GENERATING_IMAGE');
        setError(null);
        setSuccess(null);

        try {
            const apiKey = process.env.API_KEY;
            if (!apiKey) {
                await handleSelectKey();
                throw new Error("Clé API requise.");
            }

            const ai = new GoogleGenAI({ apiKey });
            let base64Image = null;
            const modelConfig = GENERATION_MODELS.find(m => m.id === selectedModel);

            if (modelConfig?.type === 'IMAGEN') {
                const response = await ai.models.generateImages({
                    model: selectedModel,
                    prompt: prompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '9:16' },
                });
                base64Image = response.generatedImages?.[0]?.image?.imageBytes;
            } else {
                const response = await ai.models.generateContent({
                    model: selectedModel,
                    contents: { parts: [{ text: prompt }] },
                    config: { imageConfig: { aspectRatio: "9:16", ...(selectedModel.includes('pro') ? { imageSize: "1K" } : {}) } },
                });
                if (response.candidates?.[0].content.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) { base64Image = part.inlineData.data; break; }
                    }
                }
            }

            if (!base64Image) throw new Error("Échec de la génération.");
            const fullImageStr = `data:image/png;base64,${base64Image}`;
            setGeneratedImage(fullImageStr);

            setStatus('ANALYZING_OBJECTS');
            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: base64Image } },
                        { text: "Analyze this image. 1. Generate a cool, short Cyberpunk title (in French) for this level based on the visual theme (e.g. 'CYBER LAB', 'NÉON MARKET'). 2. Identify 5 small objects for a hidden object game. Give their EXACT GEOMETRIC CENTER in %. JSON Response." }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "A short cyberpunk title in French." },
                            objects: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        name: { type: Type.STRING },
                                        x: { type: Type.NUMBER },
                                        y: { type: Type.NUMBER },
                                        radius: { type: Type.NUMBER }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (analysisResponse.text) {
                const result = JSON.parse(analysisResponse.text);
                if (result.title) setLevelTitle(result.title.toUpperCase());
                if (result.objects) setDetectedObjects(result.objects.map((o: any) => ({ ...o, found: false })));
                setStatus('READY');
            }
        } catch (err: any) {
            setError(err.message);
            setStatus('IDLE');
        }
    };

    const handleImageClick = (e: React.MouseEvent) => {
        if (!generatedImage || !imagePreviewRef.current) return;
        const rect = imagePreviewRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setDetectedObjects(prev => [...prev, { id: `m_${Date.now()}`, name: `Objet ${prev.length + 1}`, x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)), radius: 7, found: false }]);
    };

    const handleSave = async () => {
        if (!generatedImage || detectedObjects.length === 0 || !isSupabaseConfigured) return;
        setIsSaving(true);
        try {
            const currentConfig = await DB.getSystemConfig() || {};
            const customLevels = currentConfig.neonSeekConfig?.customLevels || {};
            
            customLevels[selectedSlot] = {
                id: `custom_${selectedSlot}`,
                title: levelTitle.toUpperCase(),
                description: levelDesc,
                difficulty: levelDifficulty,
                image: generatedImage,
                objects: detectedObjects,
                reward: levelReward
            };

            const updatedConfig = {
                ...currentConfig,
                neonSeekConfig: { ...currentConfig.neonSeekConfig, customLevels }
            };
            
            await DB.saveSystemConfig(updatedConfig);
            mp.sendAdminBroadcast(`Niveau ${selectedSlot} mis à jour !`, "game_config", { neonSeekConfig: updatedConfig.neonSeekConfig });
            setSuccess(`Niveau ${selectedSlot} déployé !`);
        } catch (e) {
            setError("Erreur de sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in max-w-6xl mx-auto">
            {/* Slot Selector & Global Settings */}
            <div className="bg-gray-800 p-6 rounded-3xl border border-white/10 shadow-2xl flex flex-col md:flex-row gap-6 items-center">
                <div className="flex flex-col gap-2 shrink-0">
                    <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Layers size={12}/> Sélection du Slot
                    </label>
                    <select 
                        value={selectedSlot}
                        onChange={(e) => setSelectedSlot(parseInt(e.target.value))}
                        className="bg-black border-2 border-blue-500/50 rounded-2xl px-6 py-3 text-xl font-black text-white focus:border-blue-400 outline-none appearance-none cursor-pointer text-center"
                    >
                        {Array.from({length: 20}, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>NIVEAU {n}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Titre du Niveau</label>
                        <input type="text" value={levelTitle} onChange={e => setLevelTitle(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none" placeholder="Ex: SECTEUR OMEGA" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Difficulté</label>
                        <select value={levelDifficulty} onChange={e => setLevelDifficulty(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none">
                            <option value="FACILE">FACILE</option>
                            <option value="MOYEN">MOYEN</option>
                            <option value="EXPERT">EXPERT</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Récompense (Coins)</label>
                        <input type="number" value={levelReward} onChange={e => setLevelReward(parseInt(e.target.value))} className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                </div>
            </div>

            {/* Generator Panel */}
            <div className="bg-gray-800 p-6 rounded-3xl border border-white/10 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Modèle IA</label>
                        <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white font-bold">
                            {GENERATION_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Prompt visuel</label>
                        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-12 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white resize-none" />
                    </div>
                </div>
                
                <button 
                    onClick={handleGenerate}
                    disabled={status.includes('ING')}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black tracking-widest rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {status === 'GENERATING_IMAGE' ? <><Loader2 className="animate-spin" /> GÉNÉRATION...</> : status === 'ANALYZING_OBJECTS' ? <><ScanEye className="animate-pulse" /> ANALYSE & TITRAGE...</> : <><RefreshCw size={20} /> GÉNÉRER L'IMAGE DU NIVEAU {selectedSlot}</>}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                    <div 
                        ref={imagePreviewRef}
                        onClick={handleImageClick}
                        className="w-full bg-gray-900 rounded-[40px] border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden aspect-[9/16] max-h-[600px] shadow-inner cursor-crosshair"
                    >
                        {generatedImage ? (
                            <>
                                <img src={generatedImage} className="w-full h-full object-contain" alt="Preview" />
                                {detectedObjects.map((obj, idx) => (
                                    <div key={obj.id} className="absolute border-2 border-green-500 rounded-full flex items-center justify-center bg-green-500/20" style={{ left: `${obj.x}%`, top: `${obj.y}%`, width: `${obj.radius * 2}%`, height: `${obj.radius * (2 * 16/9)}%`, transform: 'translate(-50%, -50%)' }}>
                                        <span className="bg-green-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">{idx + 1}</span>
                                    </div>
                                ))}
                            </>
                        ) : <div className="text-gray-700 font-black uppercase text-center opacity-20"><Image size={80} className="mx-auto mb-2"/>Aucun visuel</div>}
                    </div>
                </div>

                <div className="flex flex-col gap-4 h-full min-h-[600px]">
                    <div className="bg-gray-800/50 border border-white/10 rounded-[40px] overflow-hidden flex flex-col flex-1 shadow-2xl backdrop-blur-md">
                        <div className="p-6 border-b border-white/5 bg-gray-900/40 flex justify-between items-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Search size={14}/> Objets à trouver ({detectedObjects.length})</h3>
                            <button onClick={() => setDetectedObjects([])} className="text-[10px] font-bold text-red-400 uppercase">Vider</button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                            {detectedObjects.map((obj, idx) => (
                                <div key={obj.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-2xl border border-white/5 group">
                                    <div className="w-8 h-8 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-blue-400">{idx + 1}</div>
                                    <input type="text" value={obj.name} onChange={e => setDetectedObjects(prev => prev.map(o => o.id === obj.id ? { ...o, name: e.target.value } : o))} className="flex-1 bg-transparent border-none text-sm font-bold text-white outline-none" />
                                    <button onClick={() => setDetectedObjects(prev => prev.filter(o => o.id !== obj.id))} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-black/60 border-t border-white/10">
                            {error && <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-xs font-bold mb-4">{error}</div>}
                            {success && <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 text-green-400 text-xs font-black text-center italic mb-4">{success}</div>}
                            <button 
                                onClick={handleSave}
                                disabled={isSaving || !generatedImage || detectedObjects.length === 0}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                DÉPLOYER NIVEAU {selectedSlot}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
