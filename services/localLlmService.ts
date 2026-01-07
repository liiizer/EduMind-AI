import { ChatMessage, StructuredAIResponse, PedagogicalState } from '../types';

/**
 * Service to communicate with a local LLM (vLLM, Ollama, etc.)
 * Assumes an OpenAI-compatible endpoint (standard for most local inference servers).
 * 
 * Recommended Startup Command for vLLM:
 * python -m vllm.entrypoints.openai.api_server --model /path/to/your/finetuned-32b --served-model-name edu-32b --port 8000
 */
export const sendMessageToLocalLLM = async (
  endpoint: string,
  modelName: string,
  systemPrompt: string,
  history: ChatMessage[],
  userMessage: string
): Promise<StructuredAIResponse> => {

  // 1. Construct standard OpenAI-format messages
  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...history.map(h => ({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.role === 'assistant' && h.metadata ? JSON.stringify(h.metadata) : h.content
    })),
    { role: "user", content: userMessage }
  ];

  try {
    // 2. Send Request to Local Endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer verify-token' // Uncomment if your local server requires a key
      },
      body: JSON.stringify({
        model: modelName,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2048, // Ensure enough tokens for JSON structure
        response_format: { type: "json_object" } // Enable JSON mode if supported (vLLM supports this)
      })
    });

    if (!response.ok) {
      throw new Error(`Local API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;

    if (!rawContent) throw new Error("Empty response from local model");

    // 3. Robust JSON Parsing
    try {
      // Clean potential markdown blocks often output by LLMs even in JSON mode
      const cleanedJson = rawContent.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedJson);
    } catch (e) {
      console.error("JSON Parse Failure", rawContent);
      throw new Error("Failed to parse structured output from Local LLM");
    }

  } catch (error) {
    console.error("Local Inference Error:", error);
    
    // Return a safe fallback state so the UI doesn't crash
    return {
      content_for_user: "⚠️ Connection Error: I cannot reach your local model. Please check if vLLM/Ollama is running on port 8000.",
      internal_monologue: `Connection failed to ${endpoint}. Error: ${error}`,
      knowledge_point_id: "ERR_CONN",
      student_mastery_score: 0,
      suggested_next_state: PedagogicalState.GUIDING,
      is_direct_answer_attempt: false
    };
  }
};