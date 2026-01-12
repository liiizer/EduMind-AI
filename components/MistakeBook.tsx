import React, { useEffect, useState } from 'react';
import { MistakeRecord } from '../types';
import { dbService } from '../services/db';
import { BookX, Calendar, Target, AlertTriangle } from 'lucide-react';

interface Props {
  userEmail: string;
}

export const MistakeBook: React.FC<Props> = ({ userEmail }) => {
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMistakes = async () => {
      try {
        const data = await dbService.getUserMistakes(userEmail);
        // Sort by newest first
        setMistakes(data.sort((a, b) => b.timestamp - a.timestamp));
      } catch (e) {
        console.error("Failed to load mistakes", e);
      } finally {
        setLoading(false);
      }
    };
    loadMistakes();
  }, [userEmail]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading your knowledge gap analysis...</div>;
  }

  if (mistakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          <BookX className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-gray-900 font-medium">Mistake Book is Empty</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          When you analyze errors in the chat, they will be automatically archived here for review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 overflow-y-auto h-full scrollbar-hide">
      <div className="flex items-center gap-2 mb-2 px-1">
        <BookX className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-bold text-gray-800">My Mistake Book</h2>
        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{mistakes.length}</span>
      </div>

      {mistakes.map((record) => (
        <div key={record.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
              <Target className="w-3 h-3" />
              {record.subject}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Calendar className="w-3 h-3" />
              {new Date(record.timestamp).toLocaleDateString()}
            </span>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Original Question</h4>
            <p className="text-gray-800 font-medium text-sm line-clamp-2">{record.question}</p>
          </div>

          <div className="bg-red-50 p-3 rounded-lg border border-red-100">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wide mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Knowledge Gap
            </h4>
            <p className="text-gray-700 text-sm leading-relaxed">{record.analysis}</p>
          </div>
          
          <div className="mt-3 flex items-center gap-2">
             <span className="text-xs text-gray-400">Key Concept:</span>
             <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-mono">{record.knowledgePoint}</code>
          </div>
        </div>
      ))}
    </div>
  );
};