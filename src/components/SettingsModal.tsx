import { motion, AnimatePresence } from 'motion/react';
import { X, Settings as SettingsIcon, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import type { Settings } from '../App';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
}

const IMAGE_SIZES = ['1K', '2K', '4K'];
const ASPECT_RATIOS = ['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'];

export function SettingsModal({ isOpen, onClose, settings, onSave }: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-zinc-100">
            <div className="flex items-center gap-2 text-zinc-900 font-semibold">
              <SettingsIcon className="w-5 h-5" />
              Global Settings
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Image Size */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                <ImageIcon className="w-4 h-4" />
                Default Image Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                {IMAGE_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => onSave({ ...settings, imageSize: size as Settings['imageSize'] })}
                    className={`p-3 text-center rounded-xl border transition-all ${
                      settings.imageSize === size
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-500 font-medium'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 text-zinc-600'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                Higher resolutions take longer to generate and cost more credits.
              </p>
            </div>

            {/* Default Aspect Ratios */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-700">
                Default Aspect Ratios
              </label>
              <div className="space-y-3">
                {(['linkedin', 'twitter', 'instagram'] as const).map((platform) => (
                  <div key={platform} className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                    <span className="text-sm font-medium text-zinc-700 capitalize">{platform}</span>
                    <select
                      value={settings.aspectRatios[platform]}
                      onChange={(e) => onSave({
                        ...settings,
                        aspectRatios: {
                          ...settings.aspectRatios,
                          [platform]: e.target.value
                        }
                      })}
                      className="bg-white border border-zinc-200 text-zinc-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
                    >
                      {ASPECT_RATIOS.map((ratio) => (
                        <option key={ratio} value={ratio}>{ratio}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
