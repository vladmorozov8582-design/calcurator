import { useState } from 'react';
import { Sun, Moon, Settings } from 'lucide-react';
import { CalculatorIcon, MessageSquareIcon, RefreshIcon } from './components/icons';
import { TaskInput } from './components/task-input';
import { SolutionDisplay, Message } from './components/solution-display';
import { Calculator } from './components/calculator';
import { ApiKeySetup } from './components/api-key-setup';
import { projectId, publicAnonKey } from './utils/supabase/info';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCalculator, setShowCalculator] = useState(true);
  const [showApiKeySetup, setShowApiKeySetup] = useState(false);
  const [userId] = useState(() => {
    const stored = localStorage.getItem('userId');
    if (stored) return stored;
    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', newId);
    return newId;
  });

  const handleSaveApiKey = async (apiKey: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c06d0958/api-key`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ apiKey }),
        }
      );

      if (response.ok) {
        setShowApiKeySetup(false);
        alert('API ключ успешно сохранен!');
      } else {
        const error = await response.json();
        alert(`Ошибка при сохранении ключа: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      alert('Ошибка при сохранении API ключа');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolveTask = async (task: string, imagesBase64?: string[]) => {
    setIsLoading(true);

    const userMessage: Message = {
      role: 'user',
      content: task,
      images: imagesBase64
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      // Prepare history messages for API - convert our Message format to OpenRouter format
      const historyForApi = messages.map(msg => {
        if (msg.role === 'user' && msg.images && msg.images.length > 0) {
          // User message with images
          const contentParts: any[] = [
            {
              type: "text",
              text: msg.content
            }
          ];
          
          for (const img of msg.images) {
            contentParts.push({
              type: "image_url",
              image_url: {
                url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`
              }
            });
          }
          
          return {
            role: msg.role,
            content: contentParts
          };
        } else {
          // Simple text message (user or assistant)
          return {
            role: msg.role,
            content: msg.content
          };
        }
      });

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-c06d0958/solve-task`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ 
            userId, 
            task: `${task} (Отвечай на русском языке)`,
            imagesBase64,
            messages: historyForApi
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.solution
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const error = await response.json();
        console.error('Error solving task:', error);
        
        // If API key not found, show setup dialog
        if (error.error && error.error.includes('API key not found')) {
          setShowApiKeySetup(true);
          // Remove the last user message since task wasn't processed
          setMessages(messages);
        } else {
          alert(`Ошибка: ${error.error || 'Не удалось решить задачу'}`);
        }
      }
    } catch (error) {
      console.error('Error solving task:', error);
      alert('Ошибка при решении задачи. Проверьте консоль для деталей.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col p-4 transition-colors duration-300 ${isDarkMode ? 'bg-neutral-950' : 'bg-neutral-100'}`}>
      {/* Header Controls */}
      <div className="w-full max-w-6xl mx-auto flex justify-center gap-4 mb-8 relative z-10 pt-4">
        <button 
          onClick={() => setShowCalculator(!showCalculator)}
          className={`p-3 glass border-0 rounded-2xl transition-colors cursor-pointer ${isDarkMode ? 'text-white hover:bg-white/20' : 'text-neutral-900 hover:bg-black/10'} ${showCalculator ? (isDarkMode ? 'bg-white/20' : 'bg-black/10') : ''}`}
          title={showCalculator ? "Вернуться" : "Калькулятор"}
        >
          <CalculatorIcon className="w-6 h-6" />
        </button>

        {!showCalculator && messages.length > 0 && (
          <button 
            onClick={() => setMessages([])}
            className={`p-3 glass rounded-2xl transition-colors cursor-pointer ${isDarkMode ? 'text-white hover:bg-white/20' : 'text-neutral-900 hover:bg-black/10'}`}
            title="Новая задача"
          >
            <RefreshIcon className="w-6 h-6" />
          </button>
        )}

        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`absolute right-0 top-4 p-3 glass rounded-2xl transition-colors cursor-pointer ${isDarkMode ? 'text-white hover:bg-white/20' : 'text-neutral-900 hover:bg-black/10'}`}
          title={isDarkMode ? "Светлая тема" : "Тёмная тема"}
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>

        <button 
          onClick={() => setShowApiKeySetup(true)}
          className={`absolute right-16 top-4 p-3 glass rounded-2xl transition-colors cursor-pointer ${isDarkMode ? 'text-white hover:bg-white/20' : 'text-neutral-900 hover:bg-black/10'}`}
          title="Настройки API"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        {showCalculator ? (
          <div className="flex-1 flex items-center justify-center min-h-[500px]">
            <Calculator />
          </div>
        ) : (
          <>
            {messages.length > 0 ? (
              <SolutionDisplay 
                messages={messages} 
                onRetry={handleSolveTask}
                isLoading={isLoading}
              />
            ) : (
              <div className="flex-1 flex flex-col justify-start pt-[10vh]">
                <div className="w-full max-w-2xl mx-auto">
                   <TaskInput onSubmit={handleSolveTask} isLoading={isLoading} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* API Key Setup */}
      {showApiKeySetup && (
        <ApiKeySetup 
          onSave={handleSaveApiKey} 
          onClose={() => setShowApiKeySetup(false)}
          isLoading={isLoading} 
        />
      )}
    </div>
  );
}