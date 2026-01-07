import React, { useState } from 'react';
import { Copy, FileText, Code, FolderTree } from 'lucide-react';

export const TechnicalDocs: React.FC = () => {
  const [view, setView] = useState<'code' | 'thesis' | 'structure'>('thesis');

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
      description: "定义核心数据模型和枚举（Enums）。包括教学状态机定义、通信协议接口 (StructuredAIResponse) 等。",
      snippet: `export enum PedagogicalState {
  GUIDING = 'GUIDING',
  EXPLAINING = 'EXPLAINING',
  QUIZZING = 'QUIZZING'
}`
    },
    {
      path: "components/StateVisualizer.tsx",
      type: "UI Component",
      description: "将 AI 的“思考过程”可视化。展示当前所处的教学阶段，并渲染隐藏的 JSON 元数据（掌握度评分、内部独白）。",
      snippet: `<div className="mt-auto bg-slate-50 ...">
  <span className="uppercase">Knowledge Trace (Hidden)</span>
  {/* Renders internal_monologue & mastery_score */}
</div>`
    },
    {
      path: "components/SettingsPanel.tsx",
      type: "UI Component",
      description: "上下文配置面板。允许用户调整学生年级、学科、当前任务模式，以及本地 API 的连接地址。",
      snippet: `<select onChange={(e) => setStudent({...student, grade: e.target.value})}>
  {Object.values(Grade).map(g => <option>{g}</option>)}
</select>`
    }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full text-gray-800">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">EduMind AI 项目文档</h1>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
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
              <div>
                <h4 className="font-semibold text-gray-800">3.2 技术架构体系</h4>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-600">
                  <li><strong>交互层（Frontend）：</strong> 基于 React 和 TypeScript 构建，负责用户意图捕获、教学状态可视化及多模态交互。</li>
                  <li><strong>编排层（Orchestration）：</strong> 基于 LangGraph 实现有状态的对话流管理，负责根据学生反馈控制教学节奏。</li>
                  <li><strong>模型层（Model Serving）：</strong> 使用 vLLM/Ollama 部署经过指令微调（SFT）的 32B 教育垂直模型，提供 OpenAI 兼容接口。</li>
                  <li><strong>知识层（RAG）：</strong> 集成 ChromaDB 向量数据库，挂载中小学多学科教材知识库，确保证据来源的准确性。</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">Chapter 4</span> 
              系统需求分析 (System Requirements Analysis)
            </h3>
            <div className="pl-4 border-l-2 border-gray-200 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800">4.1 功能性需求</h4>
                <ul className="list-decimal pl-5 mt-2 space-y-2 text-gray-600">
                  <li><strong>多学科与学段适配：</strong> 系统需支持数学、语文、英语、科学四大学科，并能根据“小学（Primary）”和“初中（Middle）”不同学段，自适应调整回复的语言风格（如小学阶段多用具象类比，初中阶段注重逻辑推演）。</li>
                  <li><strong>教学状态流转：</strong> 系统必须具备“引导（Guiding）”、“解析（Explaining）”、“巩固（Quizzing）”三种状态，并严禁在“引导”阶段直接输出答案。</li>
                  <li><strong>错题诊断与记录：</strong> 系统需具备错题分析模式，识别学生错误的根本原因，并异步记录未掌握的知识点ID。</li>
                  <li><strong>合规性护栏 (Guardrails)：</strong> 系统需具备识别“直接索要答案”意图的能力，并强制拦截，转化为引导性反问。</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">4.2 非功能性需求</h4>
                <ul className="list-decimal pl-5 mt-2 space-y-2 text-gray-600">
                  <li><strong>隐私与数据安全：</strong> 所有推理与数据存储均需本地化完成，不依赖外部公有云 API。</li>
                  <li><strong>响应实时性：</strong> 利用 vLLM 的 PagedAttention 技术优化推理速度。</li>
                  <li><strong>输出结构化：</strong> 模型输出必须遵循 strict JSON Schema。</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">Chapter 5</span> 
              系统设计 (System Design)
            </h3>
            <div className="pl-4 border-l-2 border-gray-200 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-800">5.2.1 动态提示词构建模块 (Dynamic Prompt Engine)</h4>
                <p className="text-gray-600 mt-1 mb-2">该模块是系统的“指令中心”。设计策略如下：</p>
                <div className="bg-white p-4 rounded border border-gray-200 text-sm text-gray-600 space-y-2">
                  <p><strong>身份锚定：</strong> 根据 <code>Subject</code> 和 <code>TaskMode</code> 确定 AI 的角色设定。</p>
                  <p><strong>受众约束：</strong> 读取 <code>Grade</code>。若为 <code>PRIMARY</code>，注入“使用生活化类比”；若为 <code>MIDDLE</code>，注入“强调概念定义”。</p>
                  <p><strong>状态指令注入：</strong> 根据 FSM 的当前状态，动态拼接 <code>behavioralDirectives</code>。</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800">5.2.2 教学状态机模块 (Pedagogical State Machine)</h4>
                <p className="text-gray-600 mt-1 mb-2">设计一个有限状态机（FSM）来管理对话深度：</p>
                <div className="bg-white p-4 rounded border border-gray-200 text-sm text-gray-600">
                  <p className="font-mono mb-1">状态定义：S = {'{S_guiding, S_explaining, S_quizzing}'}</p>
                  <p className="mb-1"><strong>转移条件：</strong></p>
                  <ul className="list-disc pl-5">
                    <li>Guiding → Explaining: 当 <code>student_mastery_score &lt; Threshold</code> 或学生显式提问。</li>
                    <li>Explaining → Quizzing: 当概念已讲清。</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800">5.2.3 结构化输出协议设计</h4>
                <pre className="bg-slate-800 text-slate-200 p-3 rounded text-xs overflow-x-auto mt-2">
{`{
  "content_for_user": "给学生的回复文本",
  "internal_monologue": "模型的内部教学策略思考（思维链）",
  "student_mastery_score": 0-100的置信度评分,
  "suggested_next_state": "推荐的下一个教学状态",
  "is_direct_answer_attempt": "是否检测到作弊行为"
}`}
                </pre>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">Chapter 6</span> 
              系统实现 (System Implementation)
            </h3>
            <div className="pl-4 border-l-2 border-gray-200 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800">6.1 本地大模型服务接口</h4>
                <p className="text-gray-600 mt-1">
                  系统实现了一个适配本地环境的 <code>localLlmService</code>。使用 TypeScript 编写了基于 <code>fetch</code> 的 HTTP 客户端，
                  连接本地 <code>http://localhost:8000/v1/chat/completions</code> 接口，并实现了针对非标准 JSON 输出的清洗逻辑。
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">6.2 动态提示词注入实现</h4>
                <p className="text-gray-600 mt-1">
                  在 <code>services/promptEngineering.ts</code> 中实现了策略模式。
                  通过 <code>constructSystemPrompt</code> 函数接收 <code>StudentProfile</code> 和 <code>PedagogicalState</code> 参数。
                  针对小学阶段（<code>Grade.PRIMARY</code>），提示词引擎会自动追加“Focus on concrete examples”的指令。
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">6.3 前端状态可视化</h4>
                <p className="text-gray-600 mt-1">
                  <strong>StateVisualizer:</strong> 实时渲染教学阶段。通过解析后端返回的 <code>metadata</code>，
                  以进度条形式展示“知识掌握度”和“内部思维链”，实现了 AI 思考过程的白盒化展示。
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};