import { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Loader2 } from 'lucide-react';

interface CampaignFormProps {
  onGenerate: (idea: string, tone: string) => void;
  isGenerating: boolean;
}

const TONES = [
  { id: 'professional', label: 'Professional', desc: 'Authoritative and clean' },
  { id: 'witty', label: 'Witty', desc: 'Clever and engaging' },
  { id: 'urgent', label: 'Urgent', desc: 'Action-oriented and fast' },
  { id: 'casual', label: 'Casual', desc: 'Friendly and approachable' },
];

export function CampaignForm({ onGenerate, isGenerating }: CampaignFormProps) {
  const [idea, setIdea] = useState('');
  const [tone, setTone] = useState('professional');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isGenerating) return;
    onGenerate(idea, tone);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 space-y-6">
      <div className="space-y-2">
        <label htmlFor="idea" className="block text-sm font-medium text-zinc-700">
          What's your idea?
        </label>
        <textarea
          id="idea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g., Announcing our new AI-powered analytics dashboard that saves 10 hours a week..."
          className="w-full min-h-[120px] p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y"
          required
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-zinc-700">
          Select Tone
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              className={`p-3 text-left rounded-xl border transition-all ${
                tone === t.id
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500'
                  : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600'
              }`}
            >
              <div className="font-medium text-sm mb-1">{t.label}</div>
              <div className="text-xs opacity-70">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!idea.trim() || isGenerating}
        className="w-full py-4 px-6 bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Campaign...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            Generate Campaign
          </>
        )}
      </button>
    </form>
  );
}
