import React from 'react';
import { HelpCircle, Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

const DEFAULT_QUESTIONS = [
  'What are the key points in the uploaded document?',
  'Summarize the main conclusions and recommendations.',
  'What specific data or statistics are mentioned?',
  'Explain the primary methodology used in this file.',
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelect }) => {
  return (
    <div className="my-6 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>Suggested Questions</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {DEFAULT_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 text-left text-xs text-slate-300 hover:text-white transition-all group"
          >
            <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
            <span className="leading-snug">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
