import { GoogleGenAI, Type, Modality } from "@google/genai";

const MODEL = 'gemini-2.5-flash';

// --- API Key Management ---

const getApiKey = (): string | null => {
  // Check local storage first (user entered), then environment variable
  return localStorage.getItem('gemini_api_key') || (typeof process !== 'undefined' ? process.env.API_KEY : null) || null;
};

// --- Mock Data for Demo Mode ---

const MOCK_TRANSCRIPTIONS: Record<string, { uk: string; us: string }> = {
  "hello": { uk: "həˈləʊ", us: "hɛˈloʊ" },
  "world": { uk: "wɜːld", us: "wɜrld" },
  "phonetic": { uk: "fəˈnɛtɪk", us: "fəˈnɛtɪk" },
  "flow": { uk: "fləʊ", us: "floʊ" },
  "teacher": { uk: "ˈtiːtʃə", us: "ˈtiːtʃər" },
  "student": { uk: "ˈstjuːdənt", us: "ˈstuːdənt" },
  "education": { uk: "ˌɛdjʊˈkeɪʃən", us: "ˌɛdʒəˈkeɪʃən" },
  "namibia": { uk: "nəˈmɪbɪə", us: "nəˈmɪbiə" }
};

const getMockSymbolTutorial = (symbol: string) => ({
  name: `Phoneme /${symbol}/`,
  category: "Demo Category",
  howToProduce: `(Demo Mode) To pronounce /${symbol}/, place your articulators in the standard position. Add your API Key in settings to see the real AI-generated instructions and accurate mouth shapes.`,
  mouthShape: "neutral" as const,
  voicing: "voiced" as const,
  examples: { initial: "start", medial: "middle", final: "end" }
});

// --- Service Functions ---

export const getPhoneticTranscription = async (text: string): Promise<{ uk: string; us: string }> => {
  if (!text.trim()) return { uk: "", us: "" };
  
  const apiKey = getApiKey();

  // DEMO MODE
  if (!apiKey) {
    console.warn("No API Key found. Using Demo Mode.");
    await new Promise(r => setTimeout(r, 600)); // Fake latency
    const lower = text.toLowerCase().trim();
    if (MOCK_TRANSCRIPTIONS[lower]) {
      return MOCK_TRANSCRIPTIONS[lower];
    }
    return { 
      uk: "dɛməʊ (Need API Key)", 
      us: "demoʊ (Need API Key)" 
    };
  }

  // REAL AI MODE
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Convert the English text "${text}" into International Phonetic Alphabet (IPA).`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            uk: { type: Type.STRING, description: "UK (Received Pronunciation) IPA transcription" },
            us: { type: Type.STRING, description: "US (General American) IPA transcription" },
          },
          required: ["uk", "us"],
        },
      },
    });

    const responseText = response.text?.trim() || "{}";
    const result = JSON.parse(responseText);
    return {
      uk: result.uk || "Transcription failed",
      us: result.us || "Transcription failed"
    };

  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    return { uk: "Error", us: "Error" };
  }
};

export const explainIPASymbol = async (symbol: string): Promise<{
  name: string;
  category: string;
  howToProduce: string;
  mouthShape: 'rounded' | 'spread' | 'neutral';
  voicing: 'voiced' | 'voiceless';
  examples: { initial: string; medial: string; final: string };
}> => {
  const apiKey = getApiKey();

  // DEMO MODE
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 800));
    return getMockSymbolTutorial(symbol);
  }

  // REAL AI MODE
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Provide a phonetic tutorial for the IPA symbol /${symbol}/ used in English. 
    Include the technical name, a brief description of how to produce the sound, mouth shape classification, voicing, and one example word for each position.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Technical name (e.g. Voiceless Alveolar Plosive)" },
            category: { type: Type.STRING, description: "Category (e.g. Fricative, Vowel, Plosive)" },
            howToProduce: { type: Type.STRING, description: "Brief instruction on tongue/lip placement" },
            mouthShape: { 
              type: Type.STRING, 
              enum: ["rounded", "spread", "neutral"],
              description: "The shape of the lips during articulation" 
            },
            voicing: { 
              type: Type.STRING, 
              enum: ["voiced", "voiceless"],
              description: "Whether the vocal cords vibrate"
            },
            examples: {
              type: Type.OBJECT,
              properties: {
                initial: { type: Type.STRING, description: "Word starting with sound" },
                medial: { type: Type.STRING, description: "Word with sound in middle" },
                final: { type: Type.STRING, description: "Word ending with sound" },
              },
              required: ["initial", "medial", "final"]
            }
          },
          required: ["name", "category", "howToProduce", "mouthShape", "voicing", "examples"]
        }
      }
    });

    const text = response.text?.trim() || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Symbol Explain Error:", error);
    return getMockSymbolTutorial(symbol); // Fallback to mock on error
  }
};

export const generateSymbolAudio = async (symbol: string): Promise<string | null> => {
  const apiKey = getApiKey();
  
  // DEMO MODE
  if (!apiKey) {
    // Return null to trigger fallback to browser SpeechSynthesis in the UI
    return null; 
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Explicit prompt to isolate the sound
    const prompt = `Pronounce the English IPA sound /${symbol}/ clearly in isolation.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return null;
  }
};

export const draftMessage = async (
  text: string, 
  tone: 'professional' | 'casual' | 'stern', 
  recipient: string
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return `(Demo) Drafted ${tone} message: ${text}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Rewrite the following text to be ${tone} for a ${recipient}: "${text}". Return only the drafted message.`;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Draft Error:", error);
    return text;
  }
};

export const translateToSilozi = async (text: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return `(Demo) Silozi translation of: ${text}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Translate the following English text to Silozi: "${text}". Return only the translation.`;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Translate Error:", error);
    return text;
  }
};

export const generateLessonIdea = async (topic: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return `(Demo) Lesson idea for: ${topic}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Generate a short, engaging lesson idea for the topic: "${topic}". Keep it brief.`;
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });
    return response.text?.trim() || "Could not generate idea.";
  } catch (error) {
    console.error("Gemini Lesson Idea Error:", error);
    return "Error generating lesson idea.";
  }
};