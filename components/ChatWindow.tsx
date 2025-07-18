
import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '../types';
import { Spinner } from './Spinner';
import { UserIcon, BotIcon } from './icons';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-800">
      {messages.map((message, index) => (
        <div key={index} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
          {message.role === 'model' && (
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
              <BotIcon className="w-5 h-5 text-slate-300" />
            </div>
          )}
          <div className={`max-w-xl p-4 rounded-xl ${message.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
            {message.image && (
              <img src={message.image} alt="User upload" className="max-w-xs rounded-lg mb-2" />
            )}
            <div className="prose prose-invert prose-p:my-0 prose-headings:my-2 prose-ul:my-2 prose-ol:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
            </div>
          </div>
          {message.role === 'user' && (
             <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-5 h-5 text-slate-300" />
            </div>
          )}
        </div>
      ))}
      {isLoading && messages[messages.length - 1]?.role === 'model' && (
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
            <BotIcon className="w-5 h-5 text-slate-300" />
          </div>
          <div className="max-w-xl p-4 rounded-xl bg-slate-700 rounded-bl-none flex items-center">
            <Spinner />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
