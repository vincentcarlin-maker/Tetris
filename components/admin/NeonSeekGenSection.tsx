
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

            setStatus('ANALYZING_OBJECTS');

            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/png', data: base64Image } },
                        { text: "CRITICAL: Act as a high-precision computer vision model. Identify 5 small, distinct objects in this image for a game. For each object, give the EXACT PIXEL-PERFECT COORDINATES. Return a JSON list. Properties: 'id' (slug), 'name' (French name), 'x' (0-100 float, center of object), 'y' (0-100 float, center of object), 'radius' (5-10, size of the object detection zone)." }
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

    const handleReject = () => {
        setGeneratedImage(null);
        setDetectedObjects([]);
        setStatus('IDLE');
        setError(null);
        setSuccess(null);
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            <div className="bg-gray-800 p-6 rounded-2xl border border-white/10 shadow-xl shrink-0">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-wider">Éditeur Neon Seek</h2>
                        <p className="text-xs text-gray-400">Générez et validez des niveaux HD.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-purple-500 outline-none transition-all resize-none mt-1"
                        placeholder="Prompt..."
                    />
                    
                    <div className="flex gap-2">
                        {canSelectKey && (
                            <button onClick={handleSelectKey} className="px-4 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
                                <Key size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleGenerate}
                            disabled={status !== 'IDLE' && status !== 'READY'}
                            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {status === 'GENERATING_IMAGE' ? (
                                <><Loader2 className="animate-spin" /> GÉNÉRATION...</>
                            ) : status === 'ANALYZING_OBJECTS' ? (
                                <><ScanEye className="animate-pulse" /> ANALYSE IA...</>
                            ) : (
                                <><Image size={20} /> CRÉER NOUVEAU NIVEAU</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pb-8">
                {/* Image géante */}
                <div className="w-full bg-gray-900/50 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden min-h-[500px] shadow-inner">
                    {generatedImage ? (
                        <>
                            <img src={generatedImage} alt="Generated Scene" className="w-full h-full object-contain" />
                            {detectedObjects.map((obj: any) => (
                                <div 
                                    key={obj.id}
                                    className="absolute border-2 border-green-500/80 rounded-full flex items-center justify-center group/marker hover:bg-green-500/20 hover:border-green-400 cursor-help"
                                    style={{
                                        left: `${obj.x}%`,
                                        top: `${obj.y}%`,
                                        width: `${obj.radius * 2}%`,
                                        height: `${obj.radius * 2}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                >
                                    <span className="absolute -top-7 bg-black/90 text-white text-[10px] px-2 py-1 rounded-md border border-white/10 opacity-0 group-hover/marker:opacity-100 whitespace-nowrap pointer-events-none transition-opacity font-bold">
                                        {obj.name}
                                    </span>
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="text-center text-gray-700">
                            <Image size={80} className="mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-black uppercase tracking-[0.3em]">L'aperçu HD apparaîtra ici</p>
                        </div>
                    )}
                </div>

                {/* Liste des Objets et Actions */}
                {detectedObjects.length > 0 && (
                    <div className="animate-in slide-in-from-bottom-4 space-y-4">
                        <div className="bg-gray-800 p-4 rounded-2xl border border-white/10">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Search size={14}/> OBJETS IDENTIFIÉS ({detectedObjects.length})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {detectedObjects.map((obj: any) => (
                                    <div key={obj.id} className="bg-black/30 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-3 text-xs">
                                        <span className="font-bold text-green-400">{obj.name}</span>
                                        <span className="text-[9px] font-mono text-gray-500">{Math.round(obj.x)}%, {Math.round(obj.y)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {success && (
                            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-400 text-sm font-black text-center italic">
                                {success}
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400 text-sm font-bold">
                                <AlertTriangle size={16} className="inline mr-2"/> {error}
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button onClick={handleReject} className="flex-1 py-5 bg-gray-800 text-gray-400 font-black rounded-2xl border border-white/10 hover:bg-gray-700 transition-all uppercase tracking-widest">
                                Rejeter
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-[2] py-5 bg-green-600 hover:bg-green-500 text-white font-black tracking-widest text-lg rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.3)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                                VALIDER ET DÉPLOYER LE NIVEAU
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
