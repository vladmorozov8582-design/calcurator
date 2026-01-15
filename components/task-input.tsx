import { useState, useRef } from 'react';
import { SendIcon, ImagePlusIcon, XIcon } from './icons';

interface TaskInputProps {
  onSubmit: (task: string, imagesBase64?: string[]) => void;
  isLoading: boolean;
}

export function TaskInput({ onSubmit, isLoading }: TaskInputProps) {
  const [task, setTask] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Store the full Data URL (including mime type)
          setImages(prev => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input so same files can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submit = () => {
    if (task.trim()) {
      onSubmit(task, images.length > 0 ? images : undefined);
      setTask('');
      setImages([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    Array.from(items).forEach(item => {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              setImages(prev => [...prev, ev.target!.result as string]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    });
  };

  const removeImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="glass rounded-2xl p-6 shadow-2xl -mt-24 relative z-0">
        <textarea
          value={task}
          onChange={(e) => setTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (task.trim() || images.length > 0) {
                onSubmit(task, images.length > 0 ? images : undefined);
                setTask('');
                setImages([]);
              }
            }
          }}
          onPaste={handlePaste}
          className="w-full bg-transparent border-none outline-none resize-none min-h-[120px] placeholder:text-white/60 text-white"
          disabled={isLoading}
        />
        
        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img, index) => (
              <div key={index} className="relative group">
                <img
                  src={img}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple // Allow multiple files
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={isLoading}
            />
            <label
              htmlFor="image-upload"
              className={`glass-dark rounded-xl p-2 cursor-pointer hover:bg-white/20 transition-all flex items-center text-white ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <ImagePlusIcon className="w-5 h-5" />
            </label>
          </div>


        </div>
      </div>
    </form>
  );
}
