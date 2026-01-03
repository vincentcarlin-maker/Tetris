
import React, { useState } from 'react';
import { Image, Sparkles, Check, Save, Loader2, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DB, isSupabaseConfigured } from '../../lib/supabaseClient';

export const NeonSeekGenSection: React.FC<{ mp: any }> = ({ mp }) => {
    const [prompt, setPrompt] = useState('A messy cyberpunk arcade room filled with neon signs, retro cabinets, cables, scattered items like VR headsets, soda cans, tools. High detail, 8k resolution, cinematic lighting, isometric view.');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleGenerate = async () => {
        if (!process.env.API_KEY) {
            alert("API_KEY manquante dans l'environnement.");
            return;
        }

        setIsGenerating(true);
        setGeneratedImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

            // Extraction de l'image (itération sur les parts comme recommandé)
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
                alert("Aucune image générée. Essayez un autre prompt.");
            }

        } catch (error) {
            console.error("Erreur génération image:", error);
            alert("Erreur lors de la génération. Vérifiez la console.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedImage || !isSupabaseConfigured) return;
        
        setIsSaving(true);
        try {
            // Récupérer la config actuelle
            const currentConfig = await DB.getSystemConfig() || {};
            
            // Mettre à jour avec la nouvelle image
            const updatedConfig = {
                ...currentConfig,
                neonSeekConfig: {
                    ...currentConfig.neonSeekConfig,
                    currentImage: generatedImage,
                    lastUpdated: Date.now()
                }
            };
            
            await DB.saveSystemConfig(updatedConfig);
            
            // Broadcast pour mise à jour immédiate chez les clients connectés
            mp.sendAdminBroadcast("Nouveau niveau Neon Seek disponible !", "game_config", { neonSeekConfig: updatedConfig.neonSeekConfig });
            
            alert("Niveau sauvegardé et déployé !");
            setGeneratedImage(null); // Reset pour éviter double save
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

                    <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Image size={20} />}
                        {isGenerating ? 'GÉNÉRATION EN COURS...' : 'GÉNÉRER LA SCÈNE'}
                    </button>
                </div>
            </div>

            {/* PREVIEW ZONE */}
            <div className="flex-1 bg-gray-900/50 rounded-2xl border-2 border-dashed border-white/10 flex items-center justify-center relative overflow-hidden group">
                {generatedImage ? (
                    <img src={generatedImage} alt="Generated Scene" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-600">
                        <Image size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">Aperçu de l'image</p>
                    </div>
                )}
            </div>

            {/* VALIDATION */}
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
