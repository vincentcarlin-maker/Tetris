
import React, { useState, useEffect, useRef } from 'react';
import { Image, Sparkles, Check, Save, Loader2, RefreshCw, AlertTriangle, Key, Search, ScanEye, Trash2, Plus, Crosshair, Edit3, Cpu } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';
import { HiddenObject } from '../neon_seek/types';

// Polyfill pour éviter le crash si process n'existe pas
if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
}

const GENERATION_MODELS = [
    { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash (Standard)', type: 'GEMINI' },
    { id: 'gemini-3-pro-image-preview', name: 'Gemini 3 Pro (Haute Qualité)', type: 'GEMINI' },
    { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0 (Ultra Réaliste)', type: 'IMAGEN' }
];

export const NeonSeekGenSection: React.FC<{ mp: any }> = ({ mp }) => {
    const { neonSeekConfig } = useGlobal();
    const [prompt, setPrompt] = useState('A messy cyberpunk arcade room filled with neon signs, retro cabinets, cables, scattered items like VR headsets, soda cans, tools. High detail, 8k resolution, cinematic lighting, portrait orientation, vertical composition.');
    const [selectedModel, setSelectedModel] = useState(GENERATION_MODELS[0].id);
    
    const [generatedImage, setGeneratedImage] = useState<string | null>(() => neonSeekConfig?.currentImage || null);
    const [detectedObjects, setDetectedObjects] = useState<HiddenObject[]>(() => neonSeekConfig?.objects || []);
    
    const [status, setStatus] = useState<'IDLE' | 'GENERATING_IMAGE' | 'ANALYZING_OBJECTS' | 'READY'>('IDLE');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [canSelectKey, setCanSelectKey] = useState(false);

    const imagePreviewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const win = window as any;
        setCanSelectKey(typeof win !== 'undefined' && !!win.aistudio);
    }, []);

    const handleSelectKey = async () => {
        const win = window as any;
        if (typeof win !== 'undefined' && win.aistudio) {
            try {
                await win.aistudio.openSelectKey();
            } catch (e) {
                console.error(e);
                setError("Erreur lors de l'ouverture du sélecteur de clé.");
            }
        }
    };

    const getApiKey = async () => {
        let apiKey = '';
        try {
            apiKey = process.env.API_KEY || '';
        } catch (e) {
            const env = (window as any).process?.env || {};
            apiKey = env.API_KEY || '';
        }

        if (!apiKey || apiKey === 'undefined' || apiKey === '') {
            const win = window as any;
            if (typeof win !== 'undefined' && win.aistudio) {
                await handleSelectKey();
                throw new Error("Veuillez sélectionner une clé API puis réessayer.");
            } else {
                throw new Error("CONFIGURATION REQUISE : Clé API manquante.");
            }
        }
        return apiKey;
    };

    const handleGenerate = async () => {
        setStatus('GENERATING_IMAGE');
        setGeneratedImage(null);
        setDetectedObjects([]);
        setError(null);
        setSuccess(null);

        try {
            const apiKey = await getApiKey();
            const ai = new GoogleGenAI({ apiKey: apiKey });
            
            let base64Image = null;
            const modelConfig = GENERATION_MODELS.find(m => m.id === selectedModel);

            // LOGIQUE DIFFÉRENTE SELON LE TYPE DE MODÈLE (GEMINI vs IMAGEN)
            if (modelConfig?.type === 'IMAGEN') {
                const response = await ai.models.generateImages({
                    model: selectedModel,
                    prompt: prompt,
                    config: {
                        numberOfImages: 1,
                        outputMimeType: 'image/png',
                        aspectRatio: '9:16', 
                    },
                });
                base64Image = response.generatedImages?.[0]?.image?.imageBytes;
            } else {
                // GEMINI MODELS
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

                if (response.candidates && response.candidates[0].content.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            base64Image = part.inlineData.data;
                            break;
                        }
                    }
                }
            }

            if (!base64Image) throw new Error("Aucune image générée. Vérifiez les quotas ou le modèle.");
            
            const fullImageStr = `data:image/png;base64,${base64Image}`;
            setGeneratedImage(fullImageStr);

            setStatus('ANALYZING_OBJECTS');

            // Analyse toujours faite par Gemini Flash pour la rapidité/coût
            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: base64Image } },
                        { text: "INSTRUCTIONS CRITIQUES : Identifiez 5 petits objets distincts dans cette image. Pour chaque objet, déterminez son CENTRE GÉOMÉTRIQUE EXACT (pas un bord ou un détail excentré). Les coordonnées doivent être des pourcentages (0-100). Répondez uniquement en JSON. Propriétés : 'id' (slug), 'name' (Français), 'x' (0-100), 'y' (0-100), 'radius' (entre 5 et 8 selon la taille de l'objet)." }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
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
            });

            const jsonText = analysisResponse.text;
            if (jsonText) {
                const objects = JSON.parse(jsonText);
                const gameObjects = objects.map((o: any) => ({ ...o, found: false }));
                setDetectedObjects(gameObjects);
                setStatus('READY');
            } else {
                throw new Error("L'IA n'a pas pu identifier d'objets.");
            }

        } catch (err: any) {
            console.error("Erreur complète:", err);
            let msg = err.message || "Erreur inconnue.";
            if (msg.includes("429")) msg = "Quota dépassé. Attendez ou changez de clé.";
            setError(msg);
            setStatus('IDLE');
        }
    };

    // --- MANIPULATION MANUELLE ---
    
    const handleImageClick = (e: React.MouseEvent) => {
        if (!generatedImage || !imagePreviewRef.current) return;
        
        const rect = imagePreviewRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const newObj: HiddenObject = {
            id: `manual_${Date.now()}`,
            name: `Objet ${detectedObjects.length + 1}`,
            x: parseFloat(x.toFixed(2)),
            y: parseFloat(y.toFixed(2)),
            radius: 7,
            found: false
        };
        
        setDetectedObjects(prev => [...prev, newObj]);
        setSuccess(null);
    };

    const updateObjectName = (id: string, newName: string) => {
        setDetectedObjects(prev => prev.map(o => o.id === id ? { ...o, name: newName } : o));
    };

    const removeObject = (id: string) => {
        setDetectedObjects(prev => prev.filter(o => o.id !== id));
    };

    const handleSave = async () => {
        if (!generatedImage || detectedObjects.length === 0 || !isSupabaseConfigured) return;
        
        setIsSaving(true);
        setError(null);
        setSuccess(null);
        try {
            const currentConfig = await DB.getSystemConfig() || {};
            const updatedConfig = {
                ...currentConfig,
                neonSeekConfig: {
                    ...currentConfig.neonSeekConfig,
                    currentImage: generatedImage,
                    objects: detectedObjects,
                    lastUpdated: Date.now()
                }
            };
            
            await DB.saveSystemConfig(updatedConfig);
            mp.sendAdminBroadcast("Nouveau niveau Neon Seek disponible !", "game_config", { neonSeekConfig: updatedConfig.neonSeekConfig });
            
            setSuccess("Niveau déployé avec succès !");
        } catch (e) {
            console.error(e);
            setError("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in">
            {/* Header / Generator Panel */}
            <div className="bg-gray-800 p-6 rounded-2xl border border-white/10 shadow-xl shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-wider">Configuration Neon Seek</h2>
                            <p className="text-xs text-gray-400">Générez une image ou cliquez dessus pour placer des objets.</p>
                        </div>
                    </div>
                    {canSelectKey && (
                        <button onClick={handleSelectKey} className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all active:scale-95 shadow-lg border border-white/10" title="Changer clé API">
                            <Key size={20} />
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 flex items-center gap-1"><Image size={10} /> Modèle de Génération</label>
                            <div className="relative">
                                <select 
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none appearance-none cursor-pointer font-bold"
                                >
                                    {GENERATION_MODELS.map(model => (
                                        <option key={model.id} value={model.id}>{model.name}</option>
                                    ))}
                                </select>
                                <Cpu size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black text-gray-500 uppercase ml-1">Prompt de génération</label>
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none transition-all resize-none"
                                placeholder="Décrivez la scène..."
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleGenerate}
                        disabled={status === 'GENERATING_IMAGE' || status === 'ANALYZING_OBJECTS'}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {status === 'GENERATING_IMAGE' ? (
                            <><Loader2 className="animate-spin" /> GÉNÉRATION IMAGE ({selectedModel.includes('imagen') ? 'IMAGEN' : 'GEMINI'})...</>
                        ) : status === 'ANALYZING_OBJECTS' ? (
                            <><ScanEye className="animate-pulse" /> IA ANALYSE LES OBJETS...</>
                        ) : (
                            <><RefreshCw size={20} /> GÉNÉRER UN NOUVEAU SECTEUR</>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                
                {/* Visual Preview / Interaction Area */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Crosshair size={14}/> Aperçu Portrait (9:16)
                        </h3>
                        {generatedImage && (
                            <span className="text-[10px] text-yellow-400 font-bold bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-500/20 animate-pulse">
                                CLIQUEZ SUR L'IMAGE POUR PLACER UN OBJET
                            </span>
                        )}
                    </div>
                    
                    <div 
                        ref={imagePreviewRef}
                        onClick={handleImageClick}
                        className={`w-full bg-gray-900/50 rounded-[32px] border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden aspect-[9/16] max-h-[650px] shadow-inner ${generatedImage ? 'cursor-crosshair' : ''}`}
                    >
                        {generatedImage ? (
                            <>
                                <img src={generatedImage} alt="Generated Scene" className="w-full h-full object-cover select-none pointer-events-none" />
                                {detectedObjects.map((obj, idx) => (
                                    <div 
                                        key={obj.id}
                                        className="absolute border-2 border-green-500/80 rounded-full flex items-center justify-center bg-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.4)] pointer-events-none"
                                        style={{
                                            left: `${obj.x}%`,
                                            top: `${obj.y}%`,
                                            width: `${obj.radius * 2}%`,
                                            height: `${obj.radius * (2 * 16/9)}%`, 
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        <div className="w-5 h-5 bg-green-500 text-black text-[10px] font-black rounded-full flex items-center justify-center border border-white">
                                            {idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div className="text-center text-gray-700 flex flex-col items-center gap-4">
                                <Image size={80} className="opacity-10" />
                                <p className="text-sm font-black uppercase tracking-[0.3em] max-w-[200px] leading-relaxed">
                                    Lancez une génération pour commencer l'édition
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Objects Management List */}
                <div className="flex flex-col gap-4 h-full">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <Search size={14}/> Liste des Fragments ({detectedObjects.length})
                        </h3>
                        {detectedObjects.length > 0 && (
                            <button 
                                onClick={() => setDetectedObjects([])}
                                className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase"
                            >
                                Tout vider
                            </button>
                        )}
                    </div>

                    <div className="bg-gray-800/50 border border-white/10 rounded-[32px] overflow-hidden flex flex-col flex-1 min-h-[400px] shadow-2xl backdrop-blur-md">
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                            {detectedObjects.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 opacity-30 italic">
                                    <Plus size={40}/>
                                    <p className="text-xs font-bold uppercase tracking-widest">Aucun objet placé</p>
                                </div>
                            ) : (
                                detectedObjects.map((obj, idx) => (
                                    <div key={obj.id} className="flex items-center gap-3 p-3 bg-black/40 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                                        <div className="w-8 h-8 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-blue-400">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    value={obj.name}
                                                    onChange={(e) => updateObjectName(obj.id, e.target.value)}
                                                    className="w-full bg-transparent border-none text-sm font-bold text-white outline-none focus:text-purple-300 transition-colors"
                                                    placeholder="Nom de l'objet..."
                                                />
                                                <Edit3 size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-600 group-hover:text-gray-400 pointer-events-none" />
                                            </div>
                                            <div className="flex gap-2 mt-0.5">
                                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter">X: {obj.x}%</span>
                                                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter">Y: {obj.y}%</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => removeObject(obj.id)}
                                            className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Summary & Save Action */}
                        <div className="p-6 bg-black/60 border-t border-white/10">
                            {success && (
                                <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 text-green-400 text-xs font-black text-center italic mb-4 animate-in zoom-in">
                                    {success}
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-400 text-xs font-bold mb-4">
                                    <AlertTriangle size={14} className="inline mr-2"/> {error}
                                </div>
                            )}
                            <button 
                                onClick={handleSave}
                                disabled={isSaving || !generatedImage || detectedObjects.length === 0}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black tracking-widest rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                                DÉPLOYER LE NIVEAU PORTRAIT
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
