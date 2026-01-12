import React, { useState } from 'react';
import { Copy, FileText, Code, FolderTree, BookOpen, Workflow, Server, Database, User, Monitor, ArrowRight, BrainCircuit, ShieldCheck, FileJson, Layers, Save, HardDrive } from 'lucide-react';

export const TechnicalDocs: React.FC = () => {
  const [view, setView] = useState<'code' | 'thesis' | 'structure' | 'design_doc' | 'diagrams'>('design_doc');

  const pythonCode = `
# 后端逻辑实现 (FastAPI + vLLM + LangGraph)

from typing import Dict, TypedDict, Literal
from langgraph.graph import StateGraph, END
from vllm import LLM, SamplingParams
import chromadb

# --- 1. 基础设施设置 ---

# 初始化向量数据库用于教材检索 (RAG)
chroma_client = chromadb.PersistentClient(path="./knowledge_db")
collection = chroma_client.get_or_create_collection(name="k12_textbooks")

# 初始化本地微调的 32B 模型
llm = LLM(model="./fine-tuned-qwen-32b-edu", trust_remote_code=True)
sampling_params = SamplingParams(temperature=0.7, max_tokens=1024)

# --- 2. 状态定义 (有状态工作流) ---

class EduState(TypedDict):
    messages: list
    student_info: Dict[str, str]  # {age, grade, mastery}
    pedagogical_phase: Literal['guiding', 'explaining', 'quizzing'] # 教学阶段
    knowledge_id: str
    mastery_score: int

# --- 3. 核心节点逻辑 ---

def model_node(state: EduState):
    """根据当前教学阶段生成回复"""
    phase = state['pedagogical_phase']
    
    # 动态系统提示词注入
    sys_prompt = build_dynamic_prompt(
        grade=state['student_info']['grade'],
        phase=phase
    )
    
    # RAG 检索 (仅在解析阶段启用)
    context = ""
    if phase == 'explaining':
        results = collection.query(query_texts=[state['messages'][-1].content], n_results=1)
        context = f"参考教材: {results['documents'][0]}"

    prompt = f"{sys_prompt}\nContext: {context}\nUser: {state['messages'][-1].content}"
    
    # 执行推理
    outputs = llm.generate([prompt], sampling_params)
    response_text = outputs[0].outputs[0].text
    
    # 解析隐藏的 JSON (结构化输出与护栏)
    parsed_json = extract_json_guardrail(response_text) 
    
    return {
        "messages": [parsed_json['content_for_user']],
        "pedagogical_phase": parsed_json['suggested_next_state'], # 状态自动流转
        "mastery_score": parsed_json['student_mastery_score']
    }

def error_logging_node(state: EduState):
    """异步错题记录 (错题本逻辑)"""
    if state['mastery_score'] < 60:
        # 保存到 PostgreSQL 或 Mongo
        save_mistake_to_db(
            user_id=state['student_info']['id'],
            question=state['messages'][-2].content,
            knowledge_id=state['knowledge_id']
        )
    return state

# --- 4. 图谱构建 (Graph Construction) ---

workflow = StateGraph(EduState)
workflow.add_node("educator", model_node)
workflow.add_node("logger", error_logging_node)

workflow.set_entry_point("educator")
workflow.add_edge("educator", "logger")
workflow.add_edge("logger", END)

app = workflow.compile()
`;

  const structureData = [
    {
      path: "services/db.ts",
      type: "Data Layer",
      description: "客户端持久化层。封装 IndexedDB 操作，实现用户鉴权信息、聊天记录以及错题本数据的本地存储与检索。",
      snippet: `async addMistake(record: MistakeRecord): Promise<void> {
  const db = await this.openDB();
  const transaction = db.transaction(['mistakes'], 'readwrite');
  // ... stores structured mistake data
}`
    },
    {
      path: "App.tsx",
      type: "Controller",
      description: "应用的主控制器。负责管理全局状态（用户信息、教学状态机状态）、处理用户输入，并编排与本地 LLM 的交互循环。",
      snippet: `// Auto-transition state based on model suggestion
if (response.suggested_next_state !== currentState) {
  setCurrentState(response.suggested_next_state);
}`
    },
    {
      path: "services/promptEngineering.ts",
      type: "Core Logic",
      description: "系统的“大脑”。根据当前的教学状态（引导、解析、测验）和学生画像，动态生成 System Prompt。这是实现“防搜题”和“苏格拉底式引导”的关键。",
      snippet: `switch (currentState) {
  case PedagogicalState.GUIDING:
    behavioralDirectives = \`
    - DO NOT provide direct answers.
    - Ask guiding questions...\`;
    break;`
    },
    {
      path: "services/localLlmService.ts",
      type: "Service",
      description: "负责与本地推理服务 (vLLM/Ollama) 通信。强制要求模型输出 JSON 格式，并包含清洗 markdown 标记的容错逻辑。",
      snippet: `const response = await fetch(endpoint, {
  body: JSON.stringify({
    messages: apiMessages,
    response_format: { type: "json_object" }
  })
});`
    },
    {
      path: "types.ts",
      type: "Definitions",
      description: "定义核心数据模型和枚举（Enums）。包括教学状态机定义、通信协议接口 (StructuredAIResponse) 以及数据库实体定义。",
      snippet: `export interface MistakeRecord {
  id?: number;
  userEmail: string;
  question: string;
  analysis: string;
  // ...
}`
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full text-gray-800">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">EduMind AI 项目文档</h1>
        
        <div className="flex bg-gray-100 p-1 rounded-lg flex-wrap">
           <button 
            onClick={() => setView('diagrams')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'diagrams' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Workflow className="w-4 h-4" />
            系统图表
          </button>
           <button 
            onClick={() => setView('design_doc')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'design_doc' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            设计与实现
          </button>
          <button 
            onClick={() => setView('code')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Code className="w-4 h-4" />
            技术实现
          </button>
          <button 
            onClick={() => setView('thesis')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'thesis' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            论文大纲
          </button>
           <button 
            onClick={() => setView('structure')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              view === 'structure' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            项目结构
          </button>
        </div>
      </div>

      {/* --- DIAGRAMS VIEW --- */}
      {view === 'diagrams' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-16 pb-20">
          
          {/* Architecture Diagram */}
          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-2">
              <Layers className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">1. 系统架构图 (System Architecture)</h2>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-xl border border-slate-200 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                
                {/* Layer 1: Client & Persistence */}
                <div className="border-2 border-dashed border-blue-200 bg-white p-6 rounded-lg relative flex flex-col justify-between">
                  <div className="absolute -top-3 left-4 bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                    Client Layer
                  </div>
                  <div className="flex flex-col gap-4 mt-2 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-md shadow-sm">
                      <Monitor className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-bold text-gray-800">React SPA</div>
                        <div className="text-xs text-gray-500">Presentation</div>
                      </div>
                    </div>
                  </div>

                  {/* Persistence Sub-layer */}
                  <div className="border-t-2 border-gray-100 pt-4 mt-2">
                    <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-md shadow-sm">
                      <HardDrive className="w-5 h-5 text-indigo-600" />
                      <div>
                        <div className="text-sm font-bold text-gray-800">IndexedDB</div>
                        <div className="text-xs text-gray-500">Client Persistence</div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow to Middle */}
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                </div>

                {/* Layer 2: Application Logic */}
                <div className="border-2 border-dashed border-purple-200 bg-white p-6 rounded-lg relative">
                  <div className="absolute -top-3 left-4 bg-purple-100 text-purple-800 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                    Orchestration Layer
                  </div>
                   <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-md shadow-sm">
                      <BrainCircuit className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="text-sm font-bold text-gray-800">Prompt Engine</div>
                        <div className="text-xs text-gray-500">Dynamic Injection</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-md shadow-sm">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-sm font-bold text-gray-800">Guardrails</div>
                        <div className="text-xs text-gray-500">Output Parser</div>
                      </div>
                    </div>
                  </div>
                   {/* Arrow to Right */}
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                </div>

                {/* Layer 3: Model Service */}
                <div className="border-2 border-dashed border-green-200 bg-white p-6 rounded-lg relative">
                  <div className="absolute -top-3 left-4 bg-green-100 text-green-800 px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider">
                    Model Layer (Local)
                  </div>
                   <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-md shadow-sm">
                      <Server className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-sm font-bold text-gray-800">Inference Engine</div>
                        <div className="text-xs text-gray-500">vLLM / Ollama (FastAPI)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md shadow-sm opacity-80">
                      <Database className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm font-bold text-gray-800">32B Model</div>
                        <div className="text-xs text-gray-500">Weights (GGUF/AWQ)</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              <p className="text-center text-xs text-gray-400 mt-6 font-mono">Figure 5.1: High-level System Component Architecture (Updated with Persistence)</p>
            </div>
          </section>

          {/* DFD */}
          <section>
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 pb-2">
              <Workflow className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800">2. 数据流向图 (Data Flow Diagram - Level 1)</h2>
            </div>

            <div className="overflow-x-auto pb-4">
              <div className="min-w-[900px] flex flex-col gap-8">
                
                {/* Main Process Flow */}
                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm flex items-center justify-between gap-4 relative z-10">
                  
                  {/* Entity: User */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200 shadow-sm">
                      <User className="w-8 h-8 text-blue-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Student</span>
                  </div>

                  <ArrowRight className="w-6 h-6 text-gray-300" />

                  {/* Process: Controller */}
                  <div className="flex flex-col items-center gap-2 w-32">
                    <div className="w-full py-3 bg-white border-2 border-gray-800 rounded-lg text-center shadow-md">
                      <span className="text-xs font-bold text-gray-900 block">P1</span>
                      <span className="text-xs font-medium text-gray-600">Controller</span>
                    </div>
                  </div>

                  <div className="h-0.5 w-6 bg-gray-300"></div>

                  {/* Process: Prompt Engineering */}
                  <div className="flex flex-col items-center gap-2 w-36">
                    <div className="w-full py-3 bg-purple-50 border-2 border-purple-600 rounded-lg text-center shadow-md">
                      <span className="text-xs font-bold text-purple-900 block">P2</span>
                      <span className="text-xs font-medium text-purple-700">Prompt Engine</span>
                    </div>
                  </div>

                  <div className="h-0.5 w-6 bg-gray-300"></div>

                  {/* Process: LLM */}
                  <div className="flex flex-col items-center gap-2 w-32">
                    <div className="w-full py-3 bg-green-50 border-2 border-green-600 rounded-lg text-center shadow-md">
                      <span className="text-xs font-bold text-green-900 block">P3</span>
                      <span className="text-xs font-medium text-green-700">Inference</span>
                    </div>
                  </div>

                  <div className="h-0.5 w-6 bg-gray-300"></div>

                  {/* Process: Output Parser */}
                   <div className="flex flex-col items-center gap-2 w-36">
                    <div className="w-full py-3 bg-orange-50 border-2 border-orange-600 rounded-lg text-center shadow-md">
                      <span className="text-xs font-bold text-orange-900 block">P4</span>
                      <span className="text-xs font-medium text-orange-700">JSON Parser</span>
                    </div>
                  </div>

                   <ArrowRight className="w-6 h-6 text-gray-300" />

                   {/* Entity: UI */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center border-2 border-gray-300 shadow-sm">
                      <FileJson className="w-8 h-8 text-gray-600" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">UI Render</span>
                  </div>
                </div>

                {/* Data Store Layer */}
                <div className="flex justify-around px-20">
                   {/* D1: User Store */}
                   <div className="flex flex-col items-center relative">
                      <div className="h-8 w-0.5 bg-gray-300 mb-2 border-l border-dashed border-gray-400"></div>
                      <div className="w-40 py-2 bg-indigo-50 border-x-2 border-indigo-600 shadow-sm text-center">
                        <span className="text-xs font-bold text-indigo-900 block">D1: Users</span>
                        <span className="text-[10px] text-indigo-700">IndexedDB</span>
                      </div>
                      <div className="absolute -top-10 left-1/2 w-32 h-10 border-l border-b border-gray-300 -translate-x-full rounded-bl-xl -z-10"></div>
                   </div>

                   {/* D2: Chat History */}
                   <div className="flex flex-col items-center relative">
                      <div className="h-8 w-0.5 bg-gray-300 mb-2 border-l border-dashed border-gray-400"></div>
                      <div className="w-40 py-2 bg-indigo-50 border-x-2 border-indigo-600 shadow-sm text-center">
                        <span className="text-xs font-bold text-indigo-900 block">D2: Chat Logs</span>
                        <span className="text-[10px] text-indigo-700">IndexedDB</span>
                      </div>
                       {/* Connection lines would act conceptually here in a real SVG, implying P1/P4 writes here */}
                   </div>

                   {/* D3: Mistake Book */}
                   <div className="flex flex-col items-center relative">
                      <div className="h-8 w-0.5 bg-gray-300 mb-2 border-l border-dashed border-gray-400"></div>
                      <div className="w-40 py-2 bg-indigo-50 border-x-2 border-indigo-600 shadow-sm text-center">
                         <span className="text-xs font-bold text-indigo-900 block">D3: Mistakes</span>
                         <span className="text-[10px] text-indigo-700">IndexedDB</span>
                      </div>
                   </div>
                </div>

              </div>
              <p className="text-center text-xs text-gray-400 mt-6 font-mono">Figure 5.2: Data Flow Diagram with Client-Side Persistence</p>
            </div>
          </section>

          {/* Sequence Description */}
           <section>
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-bold text-gray-700">数据字典 (Data Dictionary - Updated)</h3>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
               <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                          <th scope="col" className="px-6 py-3">Entity Name</th>
                          <th scope="col" className="px-6 py-3">Storage</th>
                          <th scope="col" className="px-6 py-3">Description</th>
                      </tr>
                  </thead>
                  <tbody>
                      <tr className="bg-white border-b">
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 font-mono">StudentProfile</th>
                          <td className="px-6 py-4"><span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded">IndexedDB: Users</span></td>
                          <td className="px-6 py-4">Stores auth credentials and personalization settings (Grade, Mastery).</td>
                      </tr>
                      <tr className="bg-white border-b">
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 font-mono">ChatHistory</th>
                          <td className="px-6 py-4"><span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded">IndexedDB: Chats</span></td>
                          <td className="px-6 py-4">Persists conversation context to maintain state across reloads.</td>
                      </tr>
                      <tr className="bg-white border-b">
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 font-mono">MistakeRecord</th>
                          <td className="px-6 py-4"><span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded">IndexedDB: Mistakes</span></td>
                          <td className="px-6 py-4">Structured error analysis records containing question, analysis, and knowledge point ID.</td>
                      </tr>
                       <tr className="bg-white">
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 font-mono">StructuredResponse</th>
                          <td className="px-6 py-4">Transient</td>
                          <td className="px-6 py-4">JSON Output containing visible text, hidden thoughts, and next state signal.</td>
                      </tr>
                  </tbody>
              </table>
            </div>
           </section>

        </div>
      )}
      
      {/* --- DESIGN DOC VIEW (PDF STYLE) --- */}
      {view === 'design_doc' && (
  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto pb-24">
    <div className="text-center mb-12 border-b-2 border-gray-800 pb-6">
      <h2 className="text-2xl font-serif font-bold text-gray-900 tracking-wide mb-2">第五章 面向K-12的自适应垂直大模型教育系统设计与实现</h2>
      <p className="text-gray-500 text-sm font-serif">Chapter 5: Design and Implementation of Adaptive Vertical LLM System for K-12 Education</p>
    </div>

    <div className="prose prose-slate max-w-none text-justify font-serif leading-relaxed text-gray-800">
      {/* 5.1 Overview */}
      <h3 className="text-xl font-bold text-gray-900 mt-10 mb-4 border-l-4 border-gray-800 pl-3">5.1 系统概述</h3>
      <p className="indent-8 mb-4">
        当前，生成式人工智能（Generative AI）在教育领域的应用正处于爆发式增长阶段。然而，通用的商用大模型（如 ChatGPT、Claude）在直接应用于 K-12 教育场景时，往往存在“过度服务”的问题——即直接给出习题答案，而非引导学生思考。这不仅违背了教育的初衷，还可能助长学生的惰性思维。此外，教育数据涉及未成年人的隐私，直接上传至公有云端存在合规风险。
      </p>
      <p className="indent-8 mb-4">
        针对上述痛点，本章设计并实现了一个名为 <strong>EduMind AI</strong> 的自适应垂直教育大模型系统。该系统基于“本地优先（Local-First）”的架构理念，采用前后端分离的设计模式。前端通过 React 构建交互式单页应用，后端对接本地微调后的 32B 参数量级大模型（基于 vLLM 推理框架）。
      </p>
      <p className="indent-8 mb-6">
        EduMind AI 的核心创新在于其“教学状态机（Pedagogical State Machine）”的设计。系统不再是一个简单的问答机器人，而是一个具备教学策略的智能体。它能够识别当前的教学阶段（引导、解析、测验），并结合学生的年级与掌握程度，动态调整对话策略。同时，系统引入了客户端持久化层（IndexedDB），确保了在离线或弱网环境下，学生的学习记录与错题数据依然能够被完整保存与回溯。
      </p>

      {/* 5.2 Requirements */}
      <h3 className="text-xl font-bold text-gray-900 mt-10 mb-4 border-l-4 border-gray-800 pl-3">5.2 系统需求分析</h3>
      
      <h4 className="text-lg font-bold text-gray-800 mt-6 mb-3">5.2.1 功能性需求</h4>
      <p className="indent-8 mb-2">系统需满足以下核心功能需求，以支撑完整的教学闭环：</p>
      <ul className="list-disc space-y-2 pl-5 mb-4 marker:text-gray-400">
        <li><strong>多轮自适应对话：</strong> 系统需支持数学、语文、英语、科学等多个学科的辅导，并能根据学生画像（如小学三年级 vs 初中二年级）自动调整语言风格与解释深度。</li>
        <li><strong>苏格拉底式引导机制：</strong> 当处于“引导阶段”时，系统必须严格拦截直接索要答案的请求，转而通过反问、提示等方式引导学生自主探索。</li>
        <li><strong>全链路状态可视化：</strong> 为了增强系统的可解释性，前端需实时展示 AI 的“思考过程”，包括当前的教学状态、对学生掌握度的评分（0-100）以及内部独白（Internal Monologue）。</li>
        <li><strong>错题自动归档（Mistake Book）：</strong> 系统需具备错题分析能力。当检测到学生对某个知识点存在理解偏差时，需自动提取原题与知识点解析，并持久化存储至本地数据库，形成“错题本”供后续复习。</li>
        <li><strong>用户会话管理：</strong> 支持用户注册、登录，并能保存历史聊天记录，确保学习过程的连续性。</li>
      </ul>

      <h4 className="text-lg font-bold text-gray-800 mt-6 mb-3">5.2.2 非功能性需求</h4>
      <ul className="list-disc space-y-2 pl-5 mb-6 marker:text-gray-400">
        <li><strong>数据隐私与安全：</strong> 所有个人敏感数据（PII）及聊天记录必须存储在用户本地设备（IndexedDB）或私有部署的服务器中，严禁传输至第三方公有云。</li>
        <li><strong>响应实时性：</strong> 交互界面需具备极低的延迟。本地模型推理通过流式传输或优化后的推理引擎（vLLM）实现，确保首字生成时间（TTFT）在可接受范围内。</li>
        <li><strong>系统鲁棒性：</strong> 针对大模型输出的不确定性，系统需具备强大的容错解析能力，能够处理非标准的 JSON 格式或 Markdown 包裹内容，防止前端崩溃。</li>
      </ul>

      {/* 5.3 Design */}
      <h3 className="text-xl font-bold text-gray-900 mt-10 mb-4 border-l-4 border-gray-800 pl-3">5.3 系统设计</h3>

      <h4 className="text-lg font-bold text-gray-800 mt-6 mb-3">5.3.1 系统架构设计</h4>
      <p className="indent-8 mb-4">
        本系统采用分层架构设计，自上而下分为<strong>表现层（Presentation Layer）</strong>、<strong>持久化层（Persistence Layer）</strong>、<strong>业务逻辑层（Business Logic Layer）</strong>与<strong>模型服务层（Model Service Layer）</strong>。
      </p>
      <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-sm font-mono mb-6">
        <ul className="space-y-3">
          <li className="flex gap-2">
            <span className="font-bold text-blue-700 w-24">[表现层]</span>
            <span>React 18 + Tailwind CSS。负责 UI 渲染、状态可视化组件（StateVisualizer）及用户交互。</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-indigo-700 w-24">[持久化层]</span>
            <span>IndexedDB (Client-Side)。利用浏览器的原生 NoSQL 数据库，存储 UserProfile、ChatHistory 及 MistakeRecords，实现数据的本地闭环。</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-purple-700 w-24">[业务层]</span>
            <span>TypeScript Services。包含提示词工程（PromptEngineering）、状态机逻辑及数据访问对象（DAO）。</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-green-700 w-24">[模型层]</span>
            <span>Local Inference Server。基于 vLLM 或 Ollama 部署的微调版 Qwen/Llama-32B 模型，提供 OpenAI 兼容的 REST API。</span>
          </li>
        </ul>
      </div>

      <h4 className="text-lg font-bold text-gray-800 mt-6 mb-3">5.3.2 数据库设计 (IndexedDB Schema)</h4>
      <p className="indent-8 mb-4">
        为了支持离线访问与数据隐私，系统在客户端构建了非关系型数据库。主要包含三个对象仓库（Object Stores）：
      </p>
      <ul className="list-decimal space-y-2 pl-5 mb-4 text-sm font-mono text-gray-600 bg-gray-50 p-4 rounded border border-gray-100">
        <li>
          <strong>users</strong>: 存储用户凭证与偏好。
          <br/>KeyPath: <code>email</code> (String)
          <br/>Properties: <code>name, grade, masteryLevel, password...</code>
        </li>
        <li>
          <strong>chats</strong>: 存储完整的对话历史。
          <br/>KeyPath: <code>userEmail</code> (String)
          <br/>Properties: <code>messages[] (JSON Array), updatedAt (Timestamp)</code>
        </li>
        <li>
          <strong>mistakes</strong>: 存储结构化的错题记录。
          <br/>KeyPath: <code>id</code> (AutoIncrement)
          <br/>Index: <code>userEmail</code> (用于快速检索某用户的错题)
          <br/>Properties: <code>question, analysis, knowledgePoint, subject, timestamp</code>
        </li>
      </ul>

      <h4 className="text-lg font-bold text-gray-800 mt-6 mb-3">5.3.3 通信协议设计</h4>
      <p className="indent-8 mb-4">
        系统核心依赖于大模型的结构化输出。为了确保前后端逻辑的准确对接，定义了严格的 JSON 响应模式（Schema）。模型不仅返回给用户的文本，还需返回控制系统状态的元数据：
      </p>
      <pre className="bg-gray-800 text-gray-100 p-4 rounded text-xs overflow-x-auto mb-6">
{`interface StructuredAIResponse {
  content_for_user: string;       // 显性回复
  internal_monologue: string;     // 隐性思维链 (CoT)
  knowledge_point_id: string;     // 关联知识点ID
  student_mastery_score: number;  // 掌握度评分 (0-100)
  suggested_next_state: Enum;     // 状态机流转信号 (GUIDING/EXPLAINING/QUIZZING)
  is_direct_answer_attempt: bool; // 护栏触发标志
}`}
      </pre>

      {/* 5.4 Implementation */}
      <h3 className="text-xl font-bold text-gray-900 mt-10 mb-4 border-l-4 border-gray-800 pl-3">5.4 系统实现</h3>

      <h4 className="text-lg font-bold text-gray-800 mt-6 mb-3">5.4.1 动态提示词引擎 (Prompt Engine) 实现</h4>
      <p className="indent-8 mb-4">
        实现代码位于 <code>services/promptEngineering.ts</code>。该模块实现了核心的策略注入逻辑。函数 <code>constructSystemPrompt</code> 接收当前的应用状态（Subject, StudentProfile, PedagogicalState），动态拼接系统指令。
      </p>
      <p className="indent-8 mb-4">
        例如，当状态机处于 <code>GUIDING</code> 状态时，引擎会自动注入负向约束：“DO NOT provide direct answers. Focus on the Process.”。当学生年级为 <code>PRIMARY</code>（小学）时，引擎会注入语言风格约束：“Use simple analogies suitable for a 10-year-old.”。这种动态性保证了模型在长对话中依然能紧贴教学目标，而不会退化为普通的聊天机器人。
      </p>

      <h4 className="text-lg font-bold text-gray-800 mt-6 mb-3">5.4.2 客户端数据持久化实现</h4>
      <p className="indent-8 mb-4">
        实现代码位于 <code>services/db.ts</code>。采用了 Promise 封装的 IndexedDB API。
      </p>
      <ul className="list-disc space-y-2 pl-5 mb-4">
        <li><strong>数据库连接：</strong> 通过 <code>indexedDB.open('EduMindDB', 1)</code> 建立连接，并在 <code>onupgradeneeded</code> 事件中初始化 Object Stores 和 Indexes。</li>
        <li><strong>事务处理：</strong> 所有的读写操作（如 <code>addMistake</code>, <code>saveChatHistory</code>）均被封装在独立的 Transaction 中，确保了数据的一致性。如果写入过程中发生异常，事务会自动回滚。</li>
        <li><strong>错题本逻辑：</strong> 在 <code>App.tsx</code> 的交互循环中，当系统处于“错题分析模式”且模型输出了有效的知识点 ID 时，系统会自动触发 <code>dbService.addMistake()</code>，将当前的问答对归档。UI 层通过 <code>useLiveQuery</code> 或 <code>useEffect</code> 监听数据变化，实时更新“错题本”视图。</li>
      </ul>

      <h4 className="text-lg font-bold text-gray-800 mt-6 mb-3">5.4.3 本地推理服务集成</h4>
      <p className="indent-8 mb-4">
        实现代码位于 <code>services/localLlmService.ts</code>。该模块充当了前端与本地大模型之间的网关。
      </p>
      <p className="indent-8 mb-4">
        为了提高系统的健壮性，实现中加入了一个“清洗层”。由于大模型（即使是微调后的）偶尔会在 JSON 模式下输出 Markdown 代码块标记（如 ```json ... ```），<code>sendMessageToLocalLLM</code> 函数在解析响应前，会使用正则表达式去除这些无关字符。此外，还实现了超时处理与错误兜底机制，当本地服务不可用时，能够向用户反馈友好的错误提示，而不是直接白屏。
      </p>

      {/* 5.5 Summary */}
      <h3 className="text-xl font-bold text-gray-900 mt-10 mb-4 border-l-4 border-gray-800 pl-3">5.5 本章小结</h3>
      <p className="indent-8 mb-4">
        本章详细阐述了 EduMind AI 系统的全栈设计与实现过程。从架构层面，验证了“React + IndexedDB + Local LLM”这一轻量级、隐私优先的技术栈在教育场景下的可行性。从功能层面，通过实现动态提示词引擎与教学状态机，成功解决了大模型“甚至直接给答案”的教育痛点。
      </p>
      <p className="indent-8 mb-6">
        特别是新增的客户端持久化层，使得系统具备了生产级的可用性，支持用户数据的长期保存与错题的系统化回顾。该系统的实现不仅为垂直领域大模型的落地提供了工程参考，也为未来个性化智能教育的发展探索了新的路径。
      </p>
    </div>
  </div>
)}

      {/* --- STRUCTURE VIEW --- */}
      {view === 'structure' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="mb-8">
             <h2 className="text-xl font-semibold text-gray-800 mb-2">项目文件结构说明</h2>
             <p className="text-gray-600">本系统基于 React (Frontend) + vLLM (Backend) 架构。以下核心文件共同实现了动态提示词注入与有状态的教学流程。</p>
           </div>
           
           <div className="grid grid-cols-1 gap-6">
             {structureData.map((file, idx) => (
               <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                 <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                   <div className="font-mono text-sm font-bold text-blue-700 flex items-center gap-2">
                     <FileText className="w-4 h-4 text-gray-400" />
                     {file.path}
                   </div>
                   <span className="text-xs font-medium px-2 py-1 bg-white border border-gray-200 rounded text-gray-500">
                     {file.type}
                   </span>
                 </div>
                 <div className="p-4">
                   <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                     {file.description}
                   </p>
                   {file.snippet && (
                     <div className="bg-slate-900 rounded-md p-3 overflow-x-auto">
                       <pre className="text-xs font-mono text-slate-300">
                         {file.snippet}
                       </pre>
                     </div>
                   )}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* --- CODE VIEW --- */}
      {view === 'code' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">1. 架构概览</h2>
            <p className="text-gray-600 mb-4">
              EduMind AI 采用混合架构。前端 (React) 负责管理用户会话、可视化教学状态并处理动态提示词配置，
              而后端 (Python/vLLM) 负责承载微调后的 32B 模型进行高负载推理。
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>模型层:</strong> 基于 Qwen/Llama 32B 在 K-12 多学科教育数据集上进行的指令微调 (SFT)。</li>
              <li><strong>编排层:</strong> 使用 LangGraph 管理教学状态机 (引导 -> 原理解析 -> 巩固练习)。</li>
              <li><strong>知识库:</strong> 集成 ChromaDB 向量数据库，用于 RAG (检索增强生成) 以获取精准的教材定义。</li>
              <li><strong>协议层:</strong> 强制模型输出 JSON 格式，将“内部思维链 (Internal Monologue)”与“给用户的回复”分离。</li>
            </ul>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">2. 后端实现详情 (Python)</h2>
            <div className="relative group">
              <div className="absolute top-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy className="w-5 h-5 cursor-pointer" />
              </div>
              <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto text-sm font-mono leading-relaxed border border-slate-700 shadow-xl">
                {pythonCode}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* --- THESIS OUTLINE VIEW --- */}
      {view === 'thesis' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-12 pb-20">
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">硕士学位论文：面向K-12教育的垂直大模型应用系统设计与实现</h2>
            <p className="text-blue-700">Design and Implementation of a Vertical LLM Application System for K-12 Education</p>
          </div>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">Chapter 3</span> 
              系统概述 (System Overview)
            </h3>
            <div className="pl-4 border-l-2 border-gray-200 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800">3.1 建设目标</h4>
                <p className="text-gray-600 mt-1 leading-relaxed">
                  本系统（EduMind AI）旨在构建一个基于本地化部署的32B参数量级大语言模型的智能助教系统。系统核心目标是解决通用大模型在教育场景中“直接给出答案”导致的教学效果缺失问题，通过引入<strong>教学法状态机（Pedagogical State Machine）</strong>和<strong>动态系统提示词（Dynamic System Prompting）</strong>技术，实现从“搜题工具”向“苏格拉底式引导导师”的转变。
                </p>
              </div>
            </div>
          </section>
          {/* ... (Previous outline content preserved implicitly or abbreviated for space in this update, but conceptually here) ... */}
           <div className="p-4 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded text-sm">
             注：详细的第五章设计与实现内容请切换至“设计与实现 (PDF风格)”视图查看。
           </div>
        </div>
      )}
    </div>
  );
};