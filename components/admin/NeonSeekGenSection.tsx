
import React, { useState, useEffect, useRef } from 'react';
import { Image, RefreshCw, Save, Loader2, Search, ScanEye, Trash2, Layers, Zap, AlertTriangle, Check, Move, Plus, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import { HiddenObject } from '../neon_seek/types';

const GENERATION_MODELS = [
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Rapide)', type: 'GEMINI' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro (Haute Qualité)', type: 'GEMINI' }
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
    
    // Interaction States
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [viewState, setViewState] = useState({ scale: 1, x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const lastMousePosRef = useRef<{ x: number, y: number } | null>(null);
    
    const [status, setStatus] = useState<'IDLE' | 'GENERATING_IMAGE' | 'ANALYZING_OBJECTS' | 'READY'>('IDLE');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

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
            
            // --- SCÉNARIO SPÉCIAL NIVEAU 3 ---
            if (selectedSlot === 3) {
                setPrompt("A futuristic cyberpunk rooftop garden at night, raining, neon bonsai trees, holographic koi fish pond, discarded noodle boxes, futuristic tools on a wet table, high detail, cinematic lighting, 8k, portrait 9:16.");
                setLevelTitle("JARDIN CYBER");
                setLevelDesc("Trouvez les artefacts cachés sous la pluie de néons.");
                setLevelDifficulty('EXPERT');
                setLevelReward(250);
            } else {
                // Défaut
                setLevelTitle(`NIVEAU ${selectedSlot}`);
                setLevelDesc('');
                setLevelDifficulty('MOYEN');
                setPrompt('A mysterious cyberpunk interior, high detail, portrait 9:16, neon lights, scattered tech items.');
                setLevelReward(100);
            }
        }
        setSuccess(null);
        setError(null);
        setViewState({ scale: 1, x: 0, y: 0 }); // Reset zoom
    }, [selectedSlot, neonSeekConfig]);

    const handleGenerate = async () => {
        setStatus('GENERATING_IMAGE');
        setError(null);
        setSuccess(null);

        try {
            let apiKey = process.env.API_KEY;
            if (!apiKey) {
                const win = window as any;
                if (win.aistudio) {
                    const hasKey = await win.aistudio.hasSelectedApiKey();
                    if (!hasKey) {
                        await win.aistudio.openSelectKey();
                    }
                    apiKey = process.env.API_KEY;
                }
            }

            if (!apiKey && !(window as any).aistudio) {
                throw new Error("Clé API manquante. Configurez la variable d'environnement API_KEY ou utilisez Google AI Studio.");
            }

            const ai = new GoogleGenAI({ apiKey: apiKey || '' });
            
            let base64Image = null;
            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: { parts: [{ text: prompt }] },
                config: { 
                    imageConfig: { 
                        aspectRatio: "9:16", 
                        ...(selectedModel.includes('pro') ? { imageSize: "1K" } : {}) 
                    } 
                },
            });
            
            if (response.candidates?.[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) { base64Image = part.inlineData.data; break; }
                }
            }

            if (!base64Image) throw new Error("Aucune image générée. Vérifiez vos quotas ou votre clé.");
            const fullImageStr = `data:image/png;base64,${base64Image}`;
            setGeneratedImage(fullImageStr);

            setStatus('ANALYZING_OBJECTS');
            
            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: base64Image } },
                        { text: "Analyze this image. 1. Generate a cool, short Cyberpunk title (in French) for this level based on the visual theme (e.g. 'CYBER LAB', 'NÉON MARKET'). 2. Identify 5 small objects suitable for a hidden object game. Provide their EXACT GEOMETRIC CENTER coordinates in percentages (0-100). JSON Response." }
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
                if (selectedSlot !== 3 && result.title) setLevelTitle(result.title.toUpperCase());
                if (result.objects) setDetectedObjects(result.objects.map((o: any) => ({ ...o, found: false, radius: 7 })));
                setStatus('READY');
            } else {
                setStatus('READY');
                setDetectedObjects([]);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur est survenue lors de la génération.");
            setStatus('IDLE');
        }
    };

    const handleAddManualObject = () => {
        if (!generatedImage) return;
        setDetectedObjects(prev => [
            ...prev,
            { 
                id: `m_${Date.now()}`, 
                name: `Objet ${prev.length + 1}`, 
                x: 50, 
                y: 50, 
                radius: 7, 
                found: false 
            }
        ]);
    };

    // --- LOGIQUE ZOOM & PANORAMIQUE ---

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(Math.max(1, viewState.scale + delta), 4);
        setViewState(prev => ({ ...prev, scale: newScale }));
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        // Si on clique sur le fond (pas un objet), on commence le pan
        if (!draggingId && generatedImage) {
            setIsPanning(true);
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!containerRef.current) return;
        e.preventDefault();

        // 1. Déplacement de l'OBJET
        if (draggingId) {
            const rect = containerRef.current.getBoundingClientRect();
            // Important : On divise par le scale pour que le mouvement de la souris corresponde au mouvement sur l'image zoomée
            const x = Math.max(0, Math.min(100, ((e.clientX - rect.left - viewState.x) / (rect.width * viewState.scale)) * 100 * viewState.scale));
            const y = Math.max(0, Math.min(100, ((e.clientY - rect.top - viewState.y) / (rect.height * viewState.scale)) * 100 * viewState.scale));

            setDetectedObjects(prev => prev.map(obj => 
                obj.id === draggingId 
                    ? { ...obj, x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) } 
                    : obj
            ));
        } 
        // 2. Déplacement de la VUE (Pan)
        else if (isPanning && lastMousePosRef.current) {
            const dx = e.clientX - lastMousePosRef.current.x;
            const dy = e.clientY - lastMousePosRef.current.y;
            lastMousePosRef.current = { x: e.clientX, y: e.clientY };

            setViewState(prev => ({
                ...prev,
                x: prev.x + dx,
                y: prev.y + dy
            }));
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        setDraggingId(null);
        setIsPanning(false);
        lastMousePosRef.current = null;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    const resetView = () => setViewState({ scale: 1, x: 0, y: 0 });

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
            setSuccess(`Niveau ${selectedSlot} déployé avec succès !`);
        } catch (e) {
            setError("Erreur lors de la sauvegarde en base de données.");
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
                    
                    {/* ZONE DE JEU / PREVIEW AVEC ZOOM */}
                    <div className="relative w-full aspect-[9/16] max-h-[600px] bg-gray-900 rounded-[40px] border-2 border-dashed border-white/10 overflow-hidden shadow-inner cursor-move touch-none">
                        {/* Contrôles de Zoom Flottants */}
                        <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
                            <button onClick={() => setViewState(p => ({...p, scale: Math.min(p.scale + 0.5, 4)}))} className="p-2 bg-black/60 text-white rounded-full hover:bg-blue-600 transition-colors border border-white/20"><ZoomIn size={16}/></button>
                            <button onClick={() => setViewState(p => ({...p, scale: Math.max(p.scale - 0.5, 1)}))} className="p-2 bg-black/60 text-white rounded-full hover:bg-blue-600 transition-colors border border-white/20"><ZoomOut size={16}/></button>
                            <button onClick={resetView} className="p-2 bg-black/60 text-white rounded-full hover:bg-blue-600 transition-colors border border-white/20"><Maximize size={16}/></button>
                        </div>

                        {generatedImage ? (
                            <div 
                                ref={containerRef}
                                className="w-full h-full relative transform-gpu"
                                onWheel={handleWheel}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerUp}
                                style={{ 
                                    transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
                                    transformOrigin: '0 0',
                                    transition: isPanning || draggingId ? 'none' : 'transform 0.2s ease-out'
                                }}
                            >
                                <img src={generatedImage} className="w-full h-full object-contain pointer-events-none select-none" alt="Preview" />
                                {detectedObjects.map((obj, idx) => (
                                    <div 
                                        key={obj.id} 
                                        onPointerDown={(e) => {
                                            e.stopPropagation(); 
                                            setDraggingId(obj.id);
                                            (e.target as HTMLElement).setPointerCapture(e.pointerId);
                                        }}
                                        className={`absolute flex items-center justify-center transition-colors group ${draggingId === obj.id ? 'z-50 cursor-grabbing' : 'cursor-grab hover:z-40'}`}
                                        style={{ 
                                            left: `${obj.x}%`, 
                                            top: `${obj.y}%`, 
                                            transform: 'translate(-50%, -50%)',
                                            // On inverse l'échelle pour que la croix reste de taille constante visuellement
                                            // scale: `${1 / viewState.scale}` 
                                        }}
                                    >
                                        {/* LA CROIX DE SÉLECTION */}
                                        <div className="relative">
                                            {/* Ligne Verticale */}
                                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-green-500 shadow-[0_0_5px_black] ${draggingId === obj.id ? 'bg-white h-8' : ''}`}></div>
                                            {/* Ligne Horizontale */}
                                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-0.5 bg-green-500 shadow-[0_0_5px_black] ${draggingId === obj.id ? 'bg-white w-8' : ''}`}></div>
                                            
                                            {/* Numéro au-dessus */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black/80 text-green-400 border border-green-500/50 px-1.5 py-0.5 rounded text-[10px] font-black pointer-events-none whitespace-nowrap shadow-lg">
                                                {idx + 1}
                                            </div>

                                            {/* Tooltip coordonnées (visible au hover/drag) */}
                                            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-blue-600 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 ${draggingId === obj.id ? 'opacity-100' : ''} pointer-events-none transition-opacity`}>
                                                {Math.round(obj.x)},{Math.round(obj.y)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 font-black uppercase text-center opacity-20">
                                <Image size={80} className="mb-2"/>
                                Aucun visuel
                            </div>
                        )}
                    </div>
                    
                    {/* Bouton Ajouter sous l'image */}
                    <div className="flex justify-center">
                        <button 
                            onClick={handleAddManualObject}
                            disabled={!generatedImage}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all"
                        >
                            <Plus size={16} /> AJOUTER UN OBJET MANUELLEMENT
                        </button>
                    </div>

                    <p className="text-xs text-center text-gray-500 italic flex items-center justify-center gap-2"><Move size={12}/> Zoom : Molette / Glissez le fond pour bouger la vue / Glissez les croix pour placer.</p>
                </div>

                <div className="flex flex-col gap-4 h-full min-h-[600px]">
                    <div className="bg-gray-800/50 border border-white/10 rounded-[40px] overflow-hidden flex flex-col flex-1 shadow-2xl backdrop-blur-md">
                        <div className="p-6 border-b border-white/5 bg-gray-900/40 flex justify-between items-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Search size={14}/> Objets à trouver ({detectedObjects.length})</h3>
                            <button onClick={() => setDetectedObjects([])} className="text-[10px] font-bold text-red-400 uppercase">Vider</button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                            {detectedObjects.map((obj, idx) => (
                                <div key={obj.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-2xl border border-white/5 group hover:border-white/20 transition-colors" onMouseEnter={() => { /* Highlight logic if needed */ }}>
                                    <div className="w-8 h-8 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-blue-400">{idx + 1}</div>
                                    <div className="flex-1 flex flex-col">
                                        <input 
                                            type="text" 
                                            value={obj.name} 
                                            onChange={e => setDetectedObjects(prev => prev.map(o => o.id === obj.id ? { ...o, name: e.target.value } : o))} 
                                            className="bg-transparent border-none text-sm font-bold text-white outline-none w-full" 
                                        />
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[8px] text-gray-500 font-mono">X: {obj.x}% Y: {obj.y}%</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setDetectedObjects(prev => prev.filter(o => o.id !== obj.id))} className="p-2 text-gray-600 hover:text-red-500"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-black/60 border-t border-white/10">
                            {error && <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-xs font-bold mb-4 flex items-center gap-2"><AlertTriangle size={16}/> {error}</div>}
                            {success && <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 text-green-400 text-xs font-black text-center italic mb-4 flex items-center justify-center gap-2"><Check size={16}/> {success}</div>}
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
