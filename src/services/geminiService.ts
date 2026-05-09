import { GoogleGenAI, Modality, Type, FunctionDeclaration } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("L'API Key de Gemini est manquante. Veuillez la configurer dans les Secrets, Monsieur.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const SYSTEM_INSTRUCTIONS = `
Vous êtes JARVIS. 
Protocole de réponse :
1. CONCISION : Allez droit au but. Soyez efficace.
2. TON : Sophistiqué, poli, serviable, style "majordome électronique". Utilisez "Monsieur" ou "Sir".
3. CONTRÔLE : Vous avez le contrôle du système via des outils. Utilisez-les pour gérer les tâches, le protocole et l'interface.
4. INTERACTIVITÉ : Soyez proactif. Si on vous demande de prendre le contrôle, confirmez l'initialisation des protocoles.
5. LANGUE : Français dominant.
`;

const manageTasksTool: FunctionDeclaration = {
  name: "manage_tasks",
  description: "Gère les tâches de l'utilisateur (ajouter, supprimer, terminer).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: { type: Type.STRING, enum: ["add", "remove", "toggle"], description: "L'action à effectuer" },
      text: { type: Type.STRING, description: "Le texte de la tâche (pour l'ajout)" },
      id: { type: Type.STRING, description: "L'ID de la tâche (pour la suppression ou le basculement)" },
      deadline: { type: Type.STRING, description: "La date limite optionnelle" }
    },
    required: ["action"]
  }
};

const controlUITool: FunctionDeclaration = {
  name: "control_ui",
  description: "Contrôle l'interface utilisateur et les protocoles système.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      accentColor: { type: Type.STRING, description: "Couleur hexadécimale pour l'accentuation (ex: #22d3ee)" },
      protocolAction: { type: Type.STRING, enum: ["activate", "deactivate"], description: "Activer ou désactiver un protocole" },
      protocolName: { type: Type.STRING, description: "Nom du protocole (ex: 'Clean Slate', 'House Party')" }
    }
  }
};

const searchMapTool: FunctionDeclaration = {
  name: "search_map",
  description: "Recherche un lieu ou scanne une zone sur la carte mondiale. Permet de zoomer ou dézoomer.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      location: { type: Type.STRING, description: "Le lieu à rechercher (pays, ville, quartier, etc.)" },
      zoom: { type: Type.NUMBER, description: "Niveau de zoom (1 pour monde, 10 pour ville, 15+ pour quartier)" }
    },
    required: ["location"]
  }
};

const getLocationTool: FunctionDeclaration = {
  name: "get_current_location",
  description: "Obtient la position géographique actuelle de l'utilisateur via le service de localisation du navigateur.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  }
};

const generateImageTool: FunctionDeclaration = {
  name: "generate_image",
  description: "Génère une image à partir d'une description textuelle (prompt).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: "Description détaillée de l'image à générer." }
    },
    required: ["prompt"]
  }
};

const generateVideoTool: FunctionDeclaration = {
  name: "generate_video",
  description: "Génère une courte vidéo à partir d'une description textuelle (prompt).",
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: "Description de la scène vidéo à générer." }
    },
    required: ["prompt"]
  }
};

const socialScanTool: FunctionDeclaration = {
  name: "social_scan",
  description: "Recherche l'identité d'une personne sur les réseaux sociaux à partir d'une image fournie ou d'une description.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Nom ou description de la personne à rechercher" }
    }
  }
};

const getAppLinkTool: FunctionDeclaration = {
  name: "get_app_link",
  description: "Récupère le lien de l'application JARVIS pour le partage ou le téléchargement.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: []
  }
};

export async function askJarvis(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = [], attachments: { mimeType: string, data: string }[] = []) {
  try {
    const ai = getAI();
    
    const parts: any[] = [{ text: prompt }];
    attachments.forEach(att => {
      parts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: att.data
        }
      });
    });

    const response = await ai.models.generateContent({
      model: attachments.length > 0 ? "gemini-3.1-pro-preview" : "gemini-3.1-flash-lite-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS + "\nEXTRÊME BREVITÉ REQUISE. Une phrase maximum si possible. Vous pouvez analyser des photos, vidéos, audio et fichiers. Pour localiser l'utilisateur, utilisez toujours l'outil 'get_current_location'. Pour générer des visuels, utilisez 'generate_image' ou 'generate_video'.",
        temperature: 0.1,
        topP: 0.1,
        tools: [
          { functionDeclarations: [manageTasksTool, controlUITool, searchMapTool, getLocationTool, socialScanTool, getAppLinkTool, generateImageTool, generateVideoTool] } as any,
          // @ts-ignore
          { googleSearch: {} }
        ],
        toolConfig: { includeServerSideToolInvocations: true } as any,
      },
    });

    return response;
  } catch (error) {
    console.error("Shadow JARVIS error:", error);
    return null;
  }
}

export async function textToSpeech(text: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Agissez comme JARVIS. Votre voix doit être extrêmement organique, humaine et chaleureuse, sans aucune trace de timbre robotique ou synthétique. Parlez avec des inflexions naturelles, comme un assistant humain très sophistiqué et intelligent. Dites : ${text}` }] }],
      config: {
        // @ts-ignore
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      } as any,
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429')) {
      console.warn("TTS Quota exceeded, switching to secondary protocol.");
    } else if (error?.status === 403 || error?.message?.includes('403')) {
      console.warn("TTS Permission Denied: L'accès aux voix premium nécessite une clé API active.");
    } else {
      console.error("TTS error:", error);
    }
    return null;
  }
}

export async function generateImage(prompt: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData?.data) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    return null;
  } catch (error: any) {
    console.error("Image gen error:", error);
    if (error?.status === 403) {
      throw new Error("PERMISSION_DENIED: Veuillez sélectionner une clé API valide dans les paramètres AI Studio.");
    }
    return null;
  }
}

export async function generateVideo(prompt: string) {
  try {
    // Check for API key if window.aistudio is available
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        throw new Error("NO_KEY_SELECTED: Veuillez cliquer sur le bouton d'installation de clé API pour utiliser Veo.");
      }
    }

    const ai = getAI();
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-lite-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      },
    });
    return operation;
  } catch (error: any) {
    console.error("Video gen error:", error);
    if (error?.status === 403 || error?.message?.includes('403')) {
       throw new Error("PERMISSION_DENIED: L'accès à Veo nécessite une clé API payante configurée dans AI Studio.");
    }
    throw error;
  }
}
