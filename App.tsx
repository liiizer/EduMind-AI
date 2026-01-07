import React, { useState, useEffect, useRef } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { StateVisualizer } from './components/StateVisualizer';
import { TechnicalDocs } from './components/TechnicalDocs';
import { constructSystemPrompt } from './services/promptEngineering';
// CHANGED: Import local service instead of Gemini
import { sendMessageToLocalLLM } from './services/localLlmService';
import { 
  Subject, Grade, TaskMode, PedagogicalState, 
  StudentProfile, ChatMessage, StructuredAIResponse 
} from './types';
import { Send, GraduationCap, Code2, MessageSquare, Server } from 'lucide-react';

export default function App() {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState<'chat' | 'docs'>('chat');

  // --- Session State ---
  const [subject, setSubject] = useState<Subject>(Subject.MATH);
  const [mode, setMode] = useState<TaskMode>(TaskMode.MISTAKE_ANALYSIS);
  const [student, setStudent] = useState<StudentProfile>({
    name: 'Student',
    age: 11,
    grade: Grade.PRIMARY,
    masteryLevel: 'Intermediate'
  });

  // --- Local Backend Configuration ---
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/v1/chat/completions");
  const [modelName, setModelName] = useState("edu-32b-finetuned");

  // --- Chat & Pedagogical State ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm EduMind (Local). I'm connected to your fine-tuned 32B model. Please upload a problem!",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentState, setCurrentState] = useState<PedagogicalState>(PedagogicalState.GUIDING);
  const [lastMetadata, setLastMetadata] = useState<StructuredAIResponse | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Dynamic System Prompt Generation
      const systemPrompt = constructSystemPrompt(subject, student, mode, currentState);

      // 2. Call Local API (vLLM/Ollama)
      // We pass the current API URL and Model Name from settings
      const response = await sendMessageToLocalLLM(
        apiUrl,
        modelName,
        systemPrompt,
        messages,
        userMsg.content
      );

      // 3. State Management Update (Logic Loop)
      setLastMetadata(response);
      
      // Auto-transition state based on model suggestion
      if (response.suggested_next_state && response.suggested_next_state !== currentState) {
        console.log(`State Transition: ${currentState} -> ${response.suggested_next_state}`);
        setCurrentState(response.suggested_next_state);
      }

      // 4. Guardrail Check (Front-end filter simulation)
      let displayContent = response.content_for_user;
      if (response.is_direct_answer_attempt && currentState === PedagogicalState.GUIDING) {
        displayContent = "I noticed you asked for the answer directly. Let's try to solve it step-by-step first. What is your first thought?";
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: displayContent,
        metadata: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "System Error: Could not process logic.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* --- Sidebar Navigation --- */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-20 shrink-0">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <GraduationCap className="w-8 h-8" />
            <span>EduMind AI</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Fine-tuned Educational LLM</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'chat' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Tutoring Session
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'docs' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Code2 className="w-5 h-5" />
            Technical Docs
          </button>
        </nav>

        {activeTab === 'chat' && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
             <div className="text-xs text-center text-gray-500 mb-2 flex items-center justify-center gap-1">
               <Server className="w-3 h-3" />
               Local Inference
             </div>
             <div className="flex justify-center flex-col items-center gap-1">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  {modelName}
                </span>
                <span className="text-[10px] text-gray-400 truncate max-w-full">
                  {apiUrl}
                </span>
             </div>
          </div>
        )}
      </div>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {activeTab === 'chat' ? (
          <>
            {/* Chat Area */}
            <div className="flex-1 flex flex-col w-full h-full relative">
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scrollbar-hide pb-24">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] rounded-2xl p-5 shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 rounded-bl-none flex items-center gap-2 shadow-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
                <div className="max-w-4xl mx-auto relative flex items-center bg-white rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your answer or question here..."
                    className="flex-1 bg-transparent border-none focus:ring-0 p-4 text-gray-700 placeholder-gray-400 outline-none"
                    disabled={isLoading}
                  />
                  <button 
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="p-2 mr-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel (Context & State) */}
            <div className="w-80 bg-gray-50/50 p-4 border-l border-gray-200 overflow-y-auto space-y-4 shrink-0 hidden lg:block">
               <SettingsPanel 
                 student={student} 
                 setStudent={setStudent}
                 subject={subject}
                 setSubject={setSubject}
                 mode={mode}
                 setMode={setMode}
                 // New Props for Local Config
                 apiUrl={apiUrl}
                 setApiUrl={setApiUrl}
                 modelName={modelName}
                 setModelName={setModelName}
               />
               <div className="flex-1 min-h-[400px]">
                 <StateVisualizer 
                   currentState={currentState} 
                   lastMetadata={lastMetadata}
                 />
               </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full overflow-hidden">
             <TechnicalDocs />
          </div>
        )}
      </main>
    </div>
  );
}