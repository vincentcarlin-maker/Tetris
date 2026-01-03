
import React, { useState } from 'react';
import { Image, Sparkles, Check, Save, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

// Polyfill pour éviter le crash si process n'existe pas
if (typeof window !== 'undefined' && typeof (window as any).process === 'undefined') {
    (window as any).process = { env: {} };
}

export const NeonSeekGenSection: React.FC<{ mp: any }> = ({ mp }) => {
    const [prompt, setPrompt] = useState('A messy cyberpunk arcade room filled with neon signs, retro cabinets, cables, scattered items like VR headsets, soda cans, tools. High detail, 8k resolution, cinematic lighting, isometric view.');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setGeneratedImage(null);
        setError(null);

        try {
            // Vérification et demande de la clé API si nécessaire (spécifique AI Studio)
            const win = window as any;
            if (typeof win !== 'undefined' && win.aistudio) {
                const hasKey = await win.aistudio.hasSelectedApiKey();
                if (!hasKey) {
                    await win.aistudio.openSelectKey();
                }
            }

            // Récupération sécurisée de la clé API
            let apiKey = '';
            try {
                // Tentative d'accès direct (pour remplacement au build)
                apiKey = process.env.API_KEY || '';
            } catch (e) {
                // Fallback si process n'est pas défini
                const env = (window as any).process?.env || {};
                apiKey = env.API_KEY || '';
            }

            if (!apiKey) {
                throw new Error("Clé API manquante. Veuillez sélectionner une clé via le bouton.");
            }

            // Initialisation avec la clé
            const ai = new GoogleGenAI({ apiKey: apiKey });
            
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: {
                    parts: [{ text: prompt }]
                },
                config: {
                    imageConfig: {
                        aspectRatio: "1:1",
                        imageSize: "1K"
                    }
                },
            });

            // Extraction de l'image
            let base64Image = null;
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        base64Image = part.inlineData.data;
                        break;
                    }
                }
            }

            if (base64Image) {
                setGeneratedImage(`data:image/png;base64,${base64Image}`);
            } else {
                setError("Aucune image n'a été générée. Le modèle a peut-être refusé le prompt.");
            }

        } catch (err: any) {
            console.error("Erreur génération image:", err);
            // Message d'erreur plus convivial
            let msg = err.message || "Erreur inconnue lors de la génération.";
            if (msg.includes("API key")) msg = "Clé API manquante ou invalide. Veuillez sélectionner une clé.";
            setError(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedImage || !isSupabaseConfigured) return;
        
        setIsSaving(true);
        try {
            const currentConfig = await DB.getSystemConfig() || {};
            const updatedConfig = {
                ...currentConfig,
                neonSeekConfig: {
                    ...currentConfig.neonSeekConfig,
                    currentImage: generatedImage,
                    lastUpdated: Date.now()
                }
            };
            
            await DB.saveSystemConfig(updatedConfig);
            mp.sendAdminBroadcast("Nouveau niveau Neon Seek disponible !", "game_config", { neonSeekConfig: updatedConfig.neonSeekConfig });
            
            alert("Niveau sauvegardé et déployé !");
            setGeneratedImage(null); 
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
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
                        <p className="text-xs text-gray-400">Créez des scènes uniques pour le jeu d'objets cachés.</p>
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

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-3 text-red-400 text-xs font-bold animate-in slide-in-from-top-2">
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2">
                        {typeof window !== 'undefined' && (window as any).aistudio && (
                            <button 
                                onClick={() => (window as any).aistudio.openSelectKey()}
                                className="px-4 py-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
                                title="Changer la clé API"
                            >
                                <RefreshCw size={20} />
                            </button>
                        )}
                        <button 
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Image size={20} />}
                            {isGenerating ? 'GÉNÉRATION EN COURS...' : 'GÉNÉRER LA SCÈNE'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-gray-900/50 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group min-h-[300px]">
                {generatedImage ? (
                    <img src={generatedImage} alt="Generated Scene" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-600">
                        <Image size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">Aperçu de l'image</p>
                    </div>
                )}
            </div>

            {generatedImage && (
                <div className="flex gap-4 animate-in slide-in-from-bottom-4">
                    <button 
                        onClick={() => setGeneratedImage(null)}
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
                        VALIDER ET DÉPLOYER
                    </button>
                </div>
            )}
        </div>
    );
};
