import { useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Copy, CheckCircle2, Image as ImageIcon, Loader2, Settings2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Platform } from '../App';

interface PlatformCardProps {
  platform: Platform;
  data: { text: string; imagePrompt: string; imageUrl?: string };
  aspectRatio: string;
  onRegenerateImage: (aspectRatio: string) => void;
}

const PLATFORM_CONFIG = {
  linkedin: {
    icon: 'in',
    color: 'bg-blue-600',
    title: 'LinkedIn',
    desc: 'Professional & Long-form',
  },
  twitter: {
    icon: 'X',
    color: 'bg-black',
    title: 'Twitter / X',
    desc: 'Short & Punchy',
  },
  instagram: {
    icon: 'ig',
    color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500',
    title: 'Instagram',
    desc: 'Visual & Hashtags',
  },
};

const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];

export function PlatformCard({ platform, data, aspectRatio, onRegenerateImage }: PlatformCardProps) {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const config = PLATFORM_CONFIG[platform];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleRegenerate = async (ratio: string) => {
    setIsRegenerating(true);
    setShowSettings(false);
    await onRegenerateImage(ratio);
    setIsRegenerating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${config.color}`}>
            {config.icon}
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 leading-tight">{config.title}</h3>
            <p className="text-xs text-zinc-500">{config.desc}</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
          title="Copy text"
        >
          {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Image Section */}
      <div className="relative bg-zinc-100 aspect-video group overflow-hidden">
        {data.imageUrl ? (
          <img
            src={data.imageUrl}
            alt={`${platform} generated image`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-xs font-medium">Generating image...</span>
          </div>
        )}

        {/* Image Controls Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              disabled={isRegenerating || !data.imageUrl}
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Settings2 className="w-4 h-4" />
              {aspectRatio}
            </button>
            
            {showSettings && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-zinc-200 p-2 grid grid-cols-2 gap-1 w-48 z-10">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => handleRegenerate(ratio)}
                    className={`px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                      ratio === aspectRatio 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'hover:bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={() => handleRegenerate(aspectRatio)}
            disabled={isRegenerating || !data.imageUrl}
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
            title="Regenerate Image"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="prose prose-sm prose-zinc max-w-none flex-1">
          <ReactMarkdown>{data.text}</ReactMarkdown>
        </div>
        
        {/* Image Prompt (Hidden by default, useful for debugging/context) */}
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <ImageIcon className="w-3 h-3" />
            <span className="font-medium uppercase tracking-wider">Image Prompt</span>
          </div>
          <p className="text-xs text-zinc-500 line-clamp-2" title={data.imagePrompt}>
            {data.imagePrompt}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
