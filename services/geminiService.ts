import { GoogleGenAI } from "@google/genai";
import { ChatMessage, StructuredAIResponse, PedagogicalState } from '../types';

let genAI: GoogleGenAI | null = null;

export const initializeGemini = () => {
  if (process.env.API_KEY) {
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
};

export const sendMessageToEduMind = async (
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string
): Promise<StructuredAIResponse> => {
  if (!genAI) {
    initializeGemini();
    if (!genAI) throw new Error("API Key missing");
  }

  // Updated to a valid model name supported by the API.
  // 'gemini-3-flash-preview' is recommended for low-latency text tasks.
  const model = 'gemini-3-flash-preview';

  // Filter history to simple format for context window
  // We include the full JSON metadata in history so the model sees its own previous 
  // hidden state (internal_monologue, suggested_next_state), preserving the state machine context.
  const chatHistory = history.map(h => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.role === 'assistant' && h.metadata ? JSON.stringify(h.metadata) : h.content }]
  }));

  try {
    const response = await genAI.models.generateContent({
      model: model,
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json", // Enforce JSON output for structure
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from model");

    try {
      // Parse the structured output
      const parsed: StructuredAIResponse = JSON.parse(text);
      return parsed;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Text:", text);
      // Attempt to recover if it's just a markdown block wrapper
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      try {
        return JSON.parse(cleanedText);
      } catch (e) {
        throw new Error("Failed to parse model response as JSON");
      }
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    let errorMessage = "I'm having trouble connecting to my knowledge base. Let's try that again.";
    let internalLog = "System Error.";

    if (error.status === 404 || (error.message && error.message.includes('404'))) {
      errorMessage = `Model not found (${model}). Please check if the API key has access to this model.`;
      internalLog = `API Error 404: The model '${model}' is not available.`;
    } else if (error.status === 429) {
      errorMessage = "I'm a bit overwhelmed right now. Please give me a moment.";
      internalLog = "Rate limit exceeded.";
    }

    // Fallback response in case of parsing error or API failure
    return {
      content_for_user: errorMessage,
      internal_monologue: internalLog,
      knowledge_point_id: "ERR_SYS",
      student_mastery_score: 0,
      suggested_next_state: PedagogicalState.GUIDING,
      is_direct_answer_attempt: false
    };
  }
};