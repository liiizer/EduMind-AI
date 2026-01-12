import React, { useState, useEffect, useRef } from 'react';
import { SettingsPanel } from './components/SettingsPanel';
import { StateVisualizer } from './components/StateVisualizer';
import { TechnicalDocs } from './components/TechnicalDocs';
import { MistakeBook } from './components/MistakeBook';
import { constructSystemPrompt } from './services/promptEngineering';
import { sendMessageToLocalLLM } from './services/localLlmService';
import { dbService } from './services/db';
import { 
  Subject, Grade, TaskMode, PedagogicalState, 
  StudentProfile, ChatMessage, StructuredAIResponse 
} from './types';
import { Send, GraduationCap, Code2, MessageSquare, Server, RotateCcw, BookX } from 'lucide-react';

export default function App() {
  // --- Global State ---
  // Auth state removed, defaults to true implicitly
  const [activeTab, setActiveTab] = useState<'chat' | 'docs' | 'mistakes'>('chat');

  // --- Session State ---
  const [subject, setSubject] = useState<Subject>(Subject.MATH);
  const [mode, setMode] = useState<TaskMode>(TaskMode.MISTAKE_ANALYSIS);
  const [student, setStudent] = useState<StudentProfile>({
    name: 'Guest Student',
    age: 12,
    grade: Grade.MIDDLE,
    masteryLevel: 'Intermediate',
    email: 'guest@edumind.ai' // Default persistent ID for local DB
  });

  // --- Local Backend Configuration ---
  const [apiUrl, setApiUrl] = useState("http://localhost:8000/v1/chat/completions");
  const [modelName, setModelName] = useState("edu-32b-finetuned");

  // --- Chat & Pedagogical State ---
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentState, setCurrentState] = useState<PedagogicalState>(PedagogicalState.GUIDING);
  const [lastMetadata, setLastMetadata] = useState<StructuredAIResponse | undefined>(undefined);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Load History on Mount (for Guest)
  useEffect(() => {
    const loadHistory = async () => {
      if (student.email) {
        const history = await dbService.getChatHistory(student.email);
        if (history && history.length > 0) {
          setMessages(history);
        } else {
          // Default Welcome Message
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `Welcome! I'm ready to help you with ${student.grade} ${subject}.`,
            timestamp: Date.now()
          }]);
        }
      }
    };
    loadHistory();
  }, [student.email, student.grade, subject]);

  const handleResetSession = async () => {
    const resetMsg: ChatMessage = {
      id: 'reset',
      role: 'assistant',
      content: `Session reset. Ready for ${student.grade} ${subject}.`,
      timestamp: Date.now()
    };
    setMessages([resetMsg]);
    setCurrentState(PedagogicalState.GUIDING);
    setLastMetadata(undefined);
    // Clear history in DB for this user
    await dbService.saveChatHistory(student.email, [resetMsg]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Dynamic System Prompt Generation
      const systemPrompt = constructSystemPrompt(subject, student, mode, currentState);

      // 2. Call Local API (vLLM/Ollama)
      const response = await sendMessageToLocalLLM(
        apiUrl,
        modelName,
        systemPrompt,
        messages, // Use previous state
        userMsg.content
      );

      // 3. State Management Update
      setLastMetadata(response);
      if (response.suggested_next_state && response.suggested_next_state !== currentState) {
        setCurrentState(response.suggested_next_state);
      }

      // 4. Mistake Recording Logic (Data Layer Integration)
      // If we are in mistake analysis mode and the model provides a new concept explanation, assume a mistake was analyzed.
      // In a real system, the LLM would output an explicit "should_save_mistake" flag.
      if (mode === TaskMode.MISTAKE_ANALYSIS && response.knowledge_point_id && response.internal_monologue) {
         await dbService.addMistake({
           userEmail: student.email,
           subject: subject,
           question: userMsg.content.substring(0, 100), // Approximate question
           analysis: response.internal_monologue,
           knowledgePoint: response.knowledge_point_id,
           timestamp: Date.now()
         });
      }

      // 5. Response Construction
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

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      
      // Persist to DB
      await dbService.saveChatHistory(student.email, finalMessages);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "System Error: Could not process logic.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Main App Flow ---
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

        {/* User Profile Snippet */}
        <div className="px-4 py-4 border-b border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {student.name.charAt(0)}
             </div>
             <div className="overflow-hidden">
               <p className="text-sm font-semibold text-gray-700 truncate">{student.name}</p>
               <p className="text-[10px] text-gray-500 truncate">{student.grade}</p>
             </div>
          </div>
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
            onClick={() => setActiveTab('mistakes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'mistakes' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookX className="w-5 h-5" />
            Mistake Book
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

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
           {activeTab === 'chat' && (
             <div className="mb-4">
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
           
           <button 
             onClick={handleResetSession}
             className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-colors"
           >
             <RotateCcw className="w-3 h-3" />
             Reset Session
           </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex overflow-hidden relative">
        
        {activeTab === 'chat' && (
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
        )}

        {activeTab === 'mistakes' && (
           <div className="w-full h-full overflow-hidden bg-gray-50 p-4 md:p-8">
             <MistakeBook userEmail={student.email} />
           </div>
        )}

        {activeTab === 'docs' && (
          <div className="w-full h-full overflow-hidden">
             <TechnicalDocs />
          </div>
        )}
      </main>
    </div>
  );
}