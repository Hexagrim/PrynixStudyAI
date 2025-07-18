
import React, { useState, useCallback } from 'react';
import { BookUploader } from './components/BookUploader';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';
import { streamChatResponse } from './services/geminiService';
import type { ChatMessage } from './types';
import { BookIcon, MenuIcon, XIcon } from './components/icons';

const App: React.FC = () => {
  const [bookPages, setBookPages] = useState<string[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const handleBookUploaded = useCallback((pages: string[]) => {
    setBookPages(pages);
    setChatHistory([
      {
        role: 'model',
        text: `I've finished reading the book with ${pages.length} pages. Ask me anything about its content!`,
      },
    ]);
    setError(null);
    setIsSidebarOpen(false); // Close sidebar on mobile after a book is loaded
  }, []);

  const handleSendMessage = useCallback(async (message: string, image?: string) => {
    if (isLoading) return;
    if (bookPages.length === 0) {
      setError("Please upload or select a book before starting the chat.");
      setIsSidebarOpen(true); // Open the sidebar if no book is selected
      return;
    }

    setError(null);
    setIsLoading(true);

    const newUserMessage: ChatMessage = { role: 'user', text: message, image };
    setChatHistory(prev => [...prev, newUserMessage]);

    const modelMessage: ChatMessage = { role: 'model', text: '' };
    setChatHistory(prev => [...prev, modelMessage]);

    try {
      const stream = streamChatResponse(bookPages, newUserMessage);

      for await (const chunk of stream) {
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMessage = newHistory[newHistory.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.text += chunk;
          }
          return newHistory;
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
      console.error(e);
      setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMessage = newHistory[newHistory.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.text = `Sorry, I ran into an error: ${errorMessage}`;
          }
          return newHistory;
        });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, bookPages]);

  return (
    <div className="flex h-screen font-sans text-slate-200 bg-slate-900 md:flex-row flex-col">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <BookIcon className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold text-slate-100 truncate">Prynix Study Helper</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-1 text-slate-300 hover:text-white">
          <MenuIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
            className="md:hidden fixed inset-0 bg-black/60 z-20" 
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
        ></div>
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`
            fixed inset-y-0 left-0 z-30
            flex flex-col
            w-full max-w-sm bg-slate-950 
            border-r border-slate-800
            transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 md:w-1/3 md:max-w-sm md:flex-shrink-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4 flex-grow flex flex-col min-h-0">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center mb-6">
            <BookIcon className="w-8 h-8 mr-3 text-blue-400" />
            <h1 className="text-2xl font-bold text-slate-100">Prynix Book Helper</h1>
          </div>
          
          {/* Mobile Panel Header */}
          <div className="md:hidden flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-100">Select or Upload Book</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-slate-300 hover:text-white">
                  <XIcon className="w-6 h-6" />
              </button>
          </div>
          
          <BookUploader onBookUploaded={handleBookUploaded} bookPages={bookPages} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-col flex-1 min-h-0">
        <ChatWindow messages={chatHistory} isLoading={isLoading} />
        {error && <div className="px-4 py-2 text-center text-red-400 bg-red-900/50">{error}</div>}
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} disabled={bookPages.length === 0} />
      </main>
    </div>
  );
};

export default App;
