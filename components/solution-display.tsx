import { useState, useRef, useEffect } from 'react';
import { CopyIcon, CheckIcon } from './icons';
import { Edit2, Send, X } from 'lucide-react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
}

interface SolutionDisplayProps {
  messages: Message[];
  onRetry?: (text: string) => void;
  isLoading?: boolean;
}

export function SolutionDisplay({ messages, onRetry, isLoading }: SolutionDisplayProps) {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [correction, setCorrection] = useState('');
  const prevLoadingRef = useRef(isLoading);

  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      setIsEditing(false);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        e.preventDefault();
        if (contentRef.current) {
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            const range = document.createRange();
            range.selectNodeContents(contentRef.current);
            selection.addRange(range);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = () => {
    if (!correction.trim() || isLoading) return;
    onRetry?.(correction);
    setCorrection('');
  };

  const copyContent = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      showCopiedFeedback(id);
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback', err);
      try {
        const textArea = document.createElement("textarea");
        textArea.value = content;
        
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          showCopiedFeedback(id);
        } else {
          console.error('Fallback copy failed');
        }
      } catch (fallbackErr) {
        console.error('Copy failed completely', fallbackErr);
      }
    }
  };

  const showCopiedFeedback = (id: string) => {
    setCopiedBlocks(prev => new Set(prev).add(id));
    setTimeout(() => {
      setCopiedBlocks(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }, 2000);
  };

  const renderFormattedText = (text: string) => {
    const cleanText = text.replace(/(\[[\s\S]*?\]|\/(?:[^\/]+)\/|\\(?:[^\\]+)\\|\*[\s\S]*?\*|\{[\s\S]*?\})/g, (match) => match.slice(1, -1));
    return cleanText.split(/(\^(?:\d+|[a-zA-Z])|_(?:\d+|[a-zA-Z]))/g).map((part, i) => {
      if (part.startsWith('^')) {
        return <sup key={i}>{part.slice(1)}</sup>;
      }
      if (part.startsWith('_')) {
        return <sub key={i}>{part.slice(1)}</sub>;
      }
      return part;
    });
  };

  const renderMessageContent = (content: string, msgIndex: number) => {
    const parts: JSX.Element[] = [];
    let currentIndex = 0;
    let blockIndex = 0;

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const beforeCode = content.slice(currentIndex, match.index);
      const language = match[1] || 'python';
      const code = match[2];
      
      if (beforeCode) {
        const currentTextId = `msg-${msgIndex}-text-${blockIndex++}`;
        parts.push(
          <div key={currentTextId} className="mb-4 relative group">
            <div className="whitespace-pre-wrap pr-8">
              {beforeCode}
            </div>
            <button
              onClick={() => copyContent(beforeCode, currentTextId)}
              className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white bg-black/20 rounded-lg backdrop-blur-sm select-none"
              title="Копировать текст"
            >
              {copiedBlocks.has(currentTextId) ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      }

      const currentCodeId = `msg-${msgIndex}-code-${blockIndex++}`;
      parts.push(
        <div key={currentCodeId} className="mb-4 relative group">
          <div className="glass-dark rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 select-none">
              <span className="text-sm text-white/70">{language}</span>
              <button
                onClick={() => copyContent(code, currentCodeId)}
                className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
              >
                {copiedBlocks.has(currentCodeId) ? (
                  <CheckIcon className="w-4 h-4" />
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto">
              <code className="text-sm text-white/90 font-mono">
                {code}
              </code>
            </pre>
          </div>
        </div>
      );

      currentIndex = match.index + match[0].length;
    }

    const remainingText = content.slice(currentIndex);
    if (remainingText) {
      const currentTextId = `msg-${msgIndex}-text-${blockIndex++}`;
      parts.push(
        <div key={currentTextId} className="whitespace-pre-wrap relative group">
          <div className="pr-8">
            {renderFormattedText(remainingText)}
          </div>
          <button
            onClick={() => copyContent(remainingText, currentTextId)}
            className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white bg-black/20 rounded-lg backdrop-blur-sm select-none"
            title="Копировать текст"
          >
            {copiedBlocks.has(currentTextId) ? (
              <CheckIcon className="w-4 h-4" />
            ) : (
              <CopyIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      );
    }

    if (parts.length === 0) {
       const currentTextId = `msg-${msgIndex}-text-${blockIndex++}`;
       return (
         <div className="whitespace-pre-wrap relative group">
            <div className="pr-8">{renderFormattedText(content)}</div>
            <button
              onClick={() => copyContent(content, currentTextId)}
              className="absolute top-0 right-0 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/50 hover:text-white bg-black/20 rounded-lg backdrop-blur-sm select-none"
              title="Копировать текст"
            >
              {copiedBlocks.has(currentTextId) ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <CopyIcon className="w-4 h-4" />
              )}
            </button>
         </div>
       );
    }

    return parts;
  };

  return (
    <div className="flex gap-4 h-[600px]">
      <div className="glass rounded-2xl p-6 shadow-2xl text-white flex-1 overflow-y-auto flex flex-col relative transition-all duration-300">
        {onRetry && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-4 right-4 p-2 glass rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white z-10"
            title={isEditing ? "Закрыть" : "Исправить"}
          >
            {isEditing ? <X className="w-5 h-5"/> : <Edit2 className="w-5 h-5"/>}
          </button>
        )}
        
        <div className="flex-1 space-y-6" ref={contentRef}>
          {messages.filter(msg => msg.role === 'assistant').map((msg, index) => (
            <div 
              key={index} 
              className={`flex flex-col items-start`}
            >
              <div 
                className={`max-w-[90%] rounded-2xl p-4 glass-dark rounded-tl-none`}
              >
                <div className="space-y-2">
                  {renderMessageContent(msg.content, index)}
                </div>
              </div>
              <span className="text-xs text-white/40 mt-1 px-2 select-none">
                AI
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex flex-col items-start animate-in fade-in duration-300">
              <div className="max-w-[90%] rounded-2xl p-4 glass-dark rounded-tl-none">
                <div className="flex gap-2 items-center h-6 px-2">
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              <span className="text-xs text-white/40 mt-1 px-2 select-none">AI</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {isEditing && (
        <div className="glass rounded-2xl p-4 w-80 flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="text-white font-medium">Корректировка</h3>
          </div>
          <textarea 
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            disabled={isLoading}
            autoFocus
            placeholder="Предложите изменения или попросите исправить ошибку..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none text-sm disabled:opacity-50"
            onKeyDown={(e) => {
              if(e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !correction.trim()}
            className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Отправить</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
