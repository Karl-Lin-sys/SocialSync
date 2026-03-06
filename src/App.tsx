/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Settings, Sparkles, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

// Components
import { PlatformCard } from './components/PlatformCard';
import { CampaignForm } from './components/CampaignForm';
import { SettingsModal } from './components/SettingsModal';

export type Platform = 'linkedin' | 'twitter' | 'instagram';

export interface CampaignData {
  linkedin: { text: string; imagePrompt: string; imageUrl?: string };
  twitter: { text: string; imagePrompt: string; imageUrl?: string };
  instagram: { text: string; imagePrompt: string; imageUrl?: string };
}

export interface Settings {
  imageSize: '1K' | '2K' | '4K';
  aspectRatios: {
    linkedin: string;
    twitter: string;
    instagram: string;
  };
}

const DEFAULT_SETTINGS: Settings = {
  imageSize: '1K',
  aspectRatios: {
    linkedin: '16:9',
    twitter: '16:9',
    instagram: '1:1',
  },
};

export default function App() {
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      // @ts-ignore
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        // @ts-ignore
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    } catch (e) {
      console.error('Failed to check API key', e);
    } finally {
      setIsCheckingKey(false);
    }
  };

  const handleConnectKey = async () => {
    try {
      // @ts-ignore
      if (window.aistudio && window.aistudio.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Assume success to avoid race condition
        setHasApiKey(true);
      }
    } catch (e) {
      console.error('Failed to open key selector', e);
      // If error contains "Requested entity was not found", reset state
      if (e instanceof Error && e.message.includes('Requested entity was not found')) {
        setHasApiKey(false);
      }
    }
  };

  const getAiInstance = () => {
    // @ts-ignore
    const apiKey = typeof process !== 'undefined' && process.env && process.env.API_KEY 
      // @ts-ignore
      ? process.env.API_KEY 
      // @ts-ignore
      : process.env.GEMINI_API_KEY;
    return new GoogleGenAI({ apiKey });
  };

  const generateCampaign = async (idea: string, tone: string) => {
    setIsGenerating(true);
    setError(null);
    setCampaign(null);

    try {
      const ai = getAiInstance();
      
      // 1. Generate Text Content
      const textResponse = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: `Generate a social media campaign for the following idea: "${idea}". 
        The tone should be ${tone}. 
        Provide a post for LinkedIn (long-form, professional, engaging), Twitter (short, punchy, < 280 chars), and Instagram (visual-focused, engaging, with hashtags). 
        Also provide a short, highly descriptive image generation prompt for each platform that visually represents the post.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              linkedin: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ['text', 'imagePrompt']
              },
              twitter: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ['text', 'imagePrompt']
              },
              instagram: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ['text', 'imagePrompt']
              }
            },
            required: ['linkedin', 'twitter', 'instagram']
          }
        }
      });

      const campaignData = JSON.parse(textResponse.text || '{}') as CampaignData;
      setCampaign(campaignData);

      // 2. Generate Images in parallel
      const platforms: Platform[] = ['linkedin', 'twitter', 'instagram'];
      
      await Promise.all(platforms.map(async (platform) => {
        try {
          const imageAi = getAiInstance();
          const imageResponse = await imageAi.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
              parts: [{ text: campaignData[platform].imagePrompt }]
            },
            config: {
              // @ts-ignore
              imageConfig: {
                aspectRatio: settings.aspectRatios[platform],
                imageSize: settings.imageSize
              }
            }
          });

          let imageUrl = '';
          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }

          if (imageUrl) {
            setCampaign(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                [platform]: {
                  ...prev[platform],
                  imageUrl
                }
              };
            });
          }
        } catch (imgErr) {
          console.error(`Failed to generate image for ${platform}:`, imgErr);
        }
      }));

    } catch (err) {
      console.error('Campaign generation failed:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateImage = async (platform: Platform, newAspectRatio: string) => {
    if (!campaign) return;
    
    // Update settings
    setSettings(prev => ({
      ...prev,
      aspectRatios: {
        ...prev.aspectRatios,
        [platform]: newAspectRatio
      }
    }));

    // Clear current image
    setCampaign(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [platform]: {
          ...prev[platform],
          imageUrl: undefined
        }
      };
    });

    try {
      const imageAi = getAiInstance();
      const imageResponse = await imageAi.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [{ text: campaign[platform].imagePrompt }]
        },
        config: {
          // @ts-ignore
          imageConfig: {
            aspectRatio: newAspectRatio,
            imageSize: settings.imageSize
          }
        }
      });

      let imageUrl = '';
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setCampaign(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            [platform]: {
              ...prev[platform],
              imageUrl
            }
          };
        });
      }
    } catch (imgErr) {
      console.error(`Failed to regenerate image for ${platform}:`, imgErr);
    }
  };

  if (isCheckingKey) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          <p className="text-zinc-500 font-medium">Initializing SocialSync...</p>
        </div>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Welcome to SocialSync</h1>
            <p className="text-zinc-600">
              To generate high-quality images with Nano Banana Pro, you need to connect your Google Cloud Project API key.
            </p>
          </div>
          <button
            onClick={handleConnectKey}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            Connect API Key
          </button>
          <p className="text-xs text-zinc-400">
            You will be redirected to select a key from a paid Google Cloud project.
            <br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-zinc-600">
              Learn more about billing
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <LayoutDashboard className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight">SocialSync</span>
          </div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Input Section */}
        <section className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              From idea to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">campaign</span> in seconds.
            </h1>
            <p className="text-lg text-zinc-600">
              Enter your concept, choose a tone, and let AI craft tailored posts and images for LinkedIn, Twitter, and Instagram.
            </p>
          </div>

          <CampaignForm 
            onGenerate={generateCampaign} 
            isGenerating={isGenerating} 
          />

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100"
            >
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {campaign && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <PlatformCard 
                platform="linkedin" 
                data={campaign.linkedin} 
                aspectRatio={settings.aspectRatios.linkedin}
                onRegenerateImage={(ratio) => regenerateImage('linkedin', ratio)}
              />
              <PlatformCard 
                platform="twitter" 
                data={campaign.twitter} 
                aspectRatio={settings.aspectRatios.twitter}
                onRegenerateImage={(ratio) => regenerateImage('twitter', ratio)}
              />
              <PlatformCard 
                platform="instagram" 
                data={campaign.instagram} 
                aspectRatio={settings.aspectRatios.instagram}
                onRegenerateImage={(ratio) => regenerateImage('instagram', ratio)}
              />
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </div>
  );
}
