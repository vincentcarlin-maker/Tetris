
import { GoogleGenAI } from "@google/genai";

/**
 * Génère un arrière-plan urbain détaillé via l'API Gemini
 */
export const generateCityBackground = async (): Promise<string | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `Top-down blueprint and detailed satellite view of a futuristic cyberpunk city. 
        Style: Semi-realistic arcade game asset, high resolution. 
        Features: 
        - Complex grid of main avenues and narrow alleys.
        - Detailed intersections with zebra crossings and traffic lights.
        - Varied rooftops: skyscrapers with neon signs, industrial warehouses with vents, residential complexes with gardens.
        - Specific zones: high-tech commercial district (glowing), quiet residential areas, and gritty industrial docks.
        - Small details: parked tiny hover-cars, street lamps, trees in small parks, a blue neon canal with bridges.
        Colors: Dark blue base with vibrant cyan, magenta, and amber neon lights. 
        Perfectly flat top-down perspective for a 2D game background.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                imageConfig: {
                    aspectRatio: "1:1"
                }
            }
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Gemini Map Generation Error:", error);
        return null;
    }
};
