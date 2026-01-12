import React from 'react';
import { Subject, Grade, TaskMode, StudentProfile } from '../types';
import { Settings, User, BookOpen, AlertTriangle, Server, Database, UserCircle } from 'lucide-react';

interface Props {
  student: StudentProfile;
  setStudent: (s: StudentProfile) => void;
  subject: Subject;
  setSubject: (s: Subject) => void;
  mode: TaskMode;
  setMode: (m: TaskMode) => void;
  apiUrl: string;
  setApiUrl: (url: string) => void;
  modelName: string;
  setModelName: (name: string) => void;
}

export const SettingsPanel: React.FC<Props> = ({ 
  student, setStudent, subject, setSubject, mode, setMode,
  apiUrl, setApiUrl, modelName, setModelName
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Settings className="w-4 h-4 text-blue-600" />
        Session Context
      </h3>

      <div className="space-y-4">
        {/* Local Backend Config */}
        <div className="pb-4 border-b border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <Server className="w-3 h-3" /> Local API URL
          </label>
          <input 
            type="text" 
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="http://localhost:8000/v1/chat/completions"
          />
          
          <label className="block text-xs font-semibold text-gray-500 mt-2 mb-1 flex items-center gap-1">
            <Database className="w-3 h-3" /> Model Name
          </label>
          <input 
            type="text" 
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="edu-32b-finetuned"
          />
        </div>

        {/* Student Name & Grade */}
        <div>
           <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <UserCircle className="w-3 h-3" /> Student Name
          </label>
          <input 
            type="text" 
            value={student.name}
            onChange={(e) => setStudent({...student, name: e.target.value})}
            className="w-full text-sm p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-3"
          />

          <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <User className="w-3 h-3" /> Grade Level
          </label>
          <select 
            value={student.grade}
            onChange={(e) => setStudent({...student, grade: e.target.value as Grade})}
            className="w-full text-sm p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Object.values(Grade).map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Subject
          </label>
          <select 
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            className="w-full text-sm p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Object.values(Subject).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Mode */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Mode
          </label>
          <select 
            value={mode}
            onChange={(e) => setMode(e.target.value as TaskMode)}
            className="w-full text-sm p-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Object.values(TaskMode).map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-4">
          <p className="text-xs text-blue-700 leading-tight">
            <strong>System Prompt:</strong> Dynamic changes will be injected into the local inference request on the next turn.
          </p>
        </div>
      </div>
    </div>
  );
};