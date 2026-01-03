
import React, { useState, useEffect } from 'react';
import { Image, Sparkles, Check, Save, Loader2, RefreshCw, AlertTriangle, Key, Search, ScanEye } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';
import { useGlobal } from '../../context/GlobalContext';

// Polyfill pour éviter le crash si process n'existe pas
if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
}

export const NeonSeekGenSection: React.FC<{ mp: any }> = ({ mp }) => {
    const { neonSeekConfig } = useGlobal();
    const [prompt, setPrompt] = useState('A messy cyberpunk arcade room filled with neon signs, retro cabinets, cables, scattered items like VR headsets, soda cans, tools. High detail, 8k resolution, cinematic lighting, isometric view.');
    
    // On stocke l'image et les objets détectés
    const [generatedImage, setGeneratedImage] = useState<string | null>(() => neonSeekConfig?.currentImage || null);
    const [detectedObjects, setDetectedObjects] = useState<any[]>(() => neonSeekConfig?.objects || []);
    
    const [status, setStatus] = useState<'IDLE' | 'GENERATING_IMAGE' | 'ANALYZING_OBJECTS' | 'READY'>('IDLE');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [canSelectKey, setCanSelectKey] = useState(false);

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
            
            // 1. GÉNÉRATION DE L'IMAGE
            const imageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { imageConfig: { aspectRatio: "1:1" } },
            });

            let base64Image = null;
            if (imageResponse.candidates && imageResponse.candidates[0].content.parts) {
                for (const part of imageResponse.candidates[0].content.parts) {
                    if (part.inlineData) {
                        base64Image = part.inlineData.data;
                        break;
                    }
                }
            }

            if (!base64Image) throw new Error("Aucune image générée.");
            
            const fullImageStr = `data:image/png;base64,${base64Image}`;
            setGeneratedImage(fullImageStr);

            // 2. ANALYSE DE L'IMAGE POUR TROUVER LES OBJETS
            setStatus('ANALYZING_OBJECTS');

            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: base64Image } },
                        { text: "Identify 5 distinct, small, and findable objects in this image for a 'Hidden Object' game. Return a JSON list. For each object: 'id' (short string), 'name' (French name), 'x' (approximate horizontal percentage 0-100 from left), 'y' (approximate vertical percentage 0-100 from top), 'radius' (detection radius in percentage, usually 5 to 10)." }
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
                                x: { type: Type.NUMBER, description: "Percentage form 0 to 100" },
                                y: { type: Type.NUMBER, description: "Percentage form 0 to 100" },
                                radius: { type: Type.NUMBER, description: "Percentage form 0 to 100" }
                            }
                        }
                    }
                }
            });

            const jsonText = analysisResponse.text;
            if (jsonText) {
                const objects = JSON.parse(jsonText);
                // On ajoute 'found: false' pour le jeu
                const gameObjects = objects.map((o: any) => ({ ...o, found: false }));
                setDetectedObjects(gameObjects);
                setStatus('READY');
            } else {
                throw new Error("L'IA n'a pas pu identifier d'objets.");
            }

        } catch (err: any) {
            console.error("Erreur complète:", err);
            let msg = err.message || "Erreur inconnue.";
            if (msg.includes("403")) msg = "Accès refusé. Vérifiez votre clé API.";
            setError(msg);
            setStatus('IDLE');
        }
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
                    objects: detectedObjects, // On sauvegarde les objets détectés
                    lastUpdated: Date.now()
                }
            };
            
            await DB.saveSystemConfig(updatedConfig);
            mp.sendAdminBroadcast("Nouveau niveau Neon Seek disponible !", "game_config", { neonSeekConfig: updatedConfig.neonSeekConfig });
            
            setSuccess("Niveau complet (Image + Objets) sauvegardé !");
        } catch (e) {
            console.error(e);
            setError("Erreur lors de la sauvegarde dans la base de données.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleReject = () => {
        setGeneratedImage(null);
        setDetectedObjects([]);
        setStatus('IDLE');
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            <div className="bg-gray-800 p-6 rounded-2xl border border-white/10 shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-wider">Générateur Neon Seek</h2>
                        <p className="text-xs text-gray-400">Créez une scène ET laissez l'IA trouver les objets cachés.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Prompt de génération</label>
                        <textarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none transition-all resize-none mt-1"
                            placeholder="Décrivez la scène..."
                        />
                    </div>
                    
                    {success && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 flex items-center gap-3 text-green-400 text-xs font-bold animate-in slide-in-from-top-2">
                            <Check size={16} />
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400 text-xs animate-in slide-in-from-top-2">
                            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold mb-1">Erreur</p>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        {canSelectKey && (
                            <button onClick={handleSelectKey} className="px-4 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95" title="Clé API">
                                <Key size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleGenerate}
                            disabled={status !== 'IDLE' && status !== 'READY'}
                            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {status === 'GENERATING_IMAGE' ? (
                                <><Loader2 className="animate-spin" /> GÉNÉRATION IMAGE...</>
                            ) : status === 'ANALYZING_OBJECTS' ? (
                                <><ScanEye className="animate-pulse" /> ANALYSE OBJETS...</>
                            ) : (
                                <><Image size={20} /> GÉNÉRER LE NIVEAU</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 h-full min-h-[300px]">
                {/* Aperçu Image */}
                <div className="flex-1 bg-gray-900/50 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group min-h-[300px]">
                    {generatedImage ? (
                        <>
                            <img src={generatedImage} alt="Generated Scene" className="w-full h-full object-contain" />
                            {/* Overlay des objets détectés pour débug visuel */}
                            {detectedObjects.map((obj: any) => (
                                <div 
                                    key={obj.id}
                                    className="absolute border-2 border-green-500/50 rounded-full flex items-center justify-center group/marker hover:bg-green-500/20 hover:border-green-400 cursor-help"
                                    style={{
                                        left: `${obj.x}%`,
                                        top: `${obj.y}%`,
                                        width: `${obj.radius * 2}%`,
                                        height: `${obj.radius * 2}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                    title={obj.name}
                                >
                                    <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                                    <span className="absolute -top-6 bg-black/80 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover/marker:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                        {obj.name}
                                    </span>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="text-center text-gray-600">
                            <Image size={48} className="mx-auto mb-2 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">Aperçu</p>
                        </div>
                    )}
                </div>

                {/* Liste des Objets */}
                {detectedObjects.length > 0 && (
                    <div className="w-full md:w-64 bg-gray-800 p-4 rounded-2xl border border-white/10 flex flex-col">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Search size={14}/> Objets ({detectedObjects.length})
                        </h4>
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                            {detectedObjects.map((obj: any) => (
                                <div key={obj.id} className="bg-black/20 p-2 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                                    <span className="font-bold text-white">{obj.name}</span>
                                    <span className="text-[9px] font-mono text-gray-500">
                                        {Math.round(obj.x)},{Math.round(obj.y)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {generatedImage && status === 'READY' && (
                <div className="flex gap-4 animate-in slide-in-from-bottom-4 pb-8">
                    <button 
                        onClick={handleReject}
                        className="flex-1 py-4 bg-gray-800 text-gray-300 font-bold rounded-xl border border-white/10 hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} /> REJETER
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-[2] py-4 bg-green-600 hover:bg-green-500 text-white font-black tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        VALIDER LE NIVEAU
                    </button>
                </div>
            )}
        </div>
    );
};
