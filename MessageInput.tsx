
import React, { useState, useRef, useCallback } from 'react';
import { SendIcon, PaperclipIcon, XIcon } from './icons';

interface MessageInputProps {
  onSendMessage: (message: string, image?: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, disabled }) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((text.trim() || image) && !isLoading) {
      onSendMessage(text.trim(), image || undefined);
      setText('');
      setImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 bg-slate-900 border-t border-slate-700">
      {image && (
        <div className="relative w-24 h-24 mb-2 p-1 border border-slate-600 rounded-lg">
          <img src={image} alt="Preview" className="w-full h-full object-cover rounded" />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1 text-slate-300 hover:bg-slate-700"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-center bg-slate-700 rounded-lg p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Please upload a book to begin." : "Type your message or attach an image..."}
          className="flex-1 bg-transparent resize-none focus:outline-none px-2 text-slate-200 placeholder-slate-400"
          rows={1}
          disabled={isLoading || disabled}
        />
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png, image/jpeg"
          onChange={handleFileChange}
        />
        <button
          onClick={triggerFileSelect}
          disabled={isLoading || disabled}
          className="p-2 text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          <PaperclipIcon className="w-5 h-5" />
        </button>
        <button
          onClick={handleSend}
          disabled={(!text.trim() && !image) || isLoading || disabled}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
