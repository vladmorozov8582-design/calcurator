import { useState } from 'react';
import { KeyIcon, XIcon, ExternalLinkIcon } from './icons';

interface ApiKeySetupProps {
  onSave: (apiKey: string) => void;
  onClose?: () => void;
  isLoading: boolean;
}

export function ApiKeySetup({ onSave, onClose, isLoading }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onSave(apiKey.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="glass rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <XIcon className="w-6 h-6" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-white/10 rounded-xl">
            <KeyIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-white">Настройка API ключа</h2>
        </div>

        <p className="text-white/80 mb-4">
          Для работы решателя задач необходим API ключ от OpenRouter. Ключ будет сохранен безопасно в базе данных.
        </p>

        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-300 hover:text-blue-200 transition-colors mb-6"
        >
          Получить API ключ на OpenRouter
          <ExternalLinkIcon className="w-4 h-4" />
        </a>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="api-key" className="block text-white/90 mb-2">
              OpenRouter API ключ
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="w-full glass-dark rounded-xl px-4 py-3 text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/30"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!apiKey.trim() || isLoading}
            className="w-full glass-dark rounded-xl px-6 py-3 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </form>
      </div>
    </div>
  );
}