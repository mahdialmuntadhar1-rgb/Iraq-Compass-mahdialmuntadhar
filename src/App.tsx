import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Image as ImageIcon, 
  User, 
  Bot, 
  Loader2, 
  Plus, 
  History,
  Settings,
  ArrowUpRight,
  Menu,
  X,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { streamChat, generateImage, Message } from './services/gemini';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const isImageRequest = input.startsWith('/image ');
    const prompt = isImageRequest ? input.replace('/image ', '') : input;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (isImageRequest) {
        const modelMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: 'Generating your image...',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, modelMessage]);

        const imageUrl = await generateImage(prompt);
        if (imageUrl) {
          setMessages(prev => prev.map(m => 
            m.id === modelMessage.id ? { ...m, content: `![Generated Image](${imageUrl})` } : m
          ));
        } else {
          setMessages(prev => prev.map(m => 
            m.id === modelMessage.id ? { ...m, content: 'Failed to generate image. Please try a different prompt.' } : m
          ));
        }
      } else {
        const newMessages = [...messages, userMessage];
        const modelMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: '',
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, modelMessage]);

        let fullContent = '';
        const stream = streamChat(newMessages);
        
        for await (const chunk of stream) {
          if (chunk) {
            fullContent += chunk;
            setMessages(prev => prev.map(m => 
              m.id === modelMessage.id ? { ...m, content: fullContent } : m
            ));
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: 'error',
        role: 'model',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-brand-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth > 1024) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed lg:relative z-50 w-72 h-full bg-white border-r border-brand-200 flex flex-col"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-950 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-serif text-xl font-bold tracking-tight">Lumina</span>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
                <X className="w-5 h-5 text-brand-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 space-y-2">
              <button 
                onClick={clearChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-brand-950 text-white rounded-xl hover:bg-brand-800 transition-colors mb-6 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Conversation</span>
              </button>

              <div className="space-y-1">
                <p className="px-4 text-[10px] uppercase tracking-widest text-brand-400 font-bold mb-2">Recent</p>
                {['Creative Writing', 'Data Analysis', 'Travel Planning'].map((item, i) => (
                  <button key={i} className="w-full flex items-center gap-3 px-4 py-2.5 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors text-sm text-left">
                    <History className="w-4 h-4 opacity-50" />
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-brand-100">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-brand-600 hover:bg-brand-100 rounded-lg transition-colors text-sm">
                <Settings className="w-4 h-4 opacity-50" />
                <span>Settings</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-brand-100 bg-white/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-brand-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-brand-600" />
            </button>
            <h2 className="font-serif text-lg font-medium text-brand-900">General Assistant</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-brand-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-brand-600">
              Gemini 3.1 Pro
            </div>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <h1 className="font-serif text-5xl lg:text-7xl font-bold text-brand-950 tracking-tight leading-none">
                  How can I assist you <br /> <span className="italic text-brand-400">today?</span>
                </h1>
                <p className="text-brand-500 text-lg max-w-md mx-auto">
                  Experience the next generation of intelligence with Lumina.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {[
                  { title: 'Write a poem', desc: 'In the style of Emily Dickinson', icon: Sparkles },
                  { title: 'Analyze data', desc: 'Summarize key trends from a report', icon: ArrowUpRight },
                  { title: 'Generate an image', desc: 'A futuristic city in the clouds', icon: ImageIcon },
                  { title: 'Plan a trip', desc: 'To the Amalfi Coast in spring', icon: History },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(item.title)}
                    className="p-6 bg-white border border-brand-200 rounded-2xl hover:border-brand-400 hover:shadow-md transition-all text-left group"
                  >
                    <item.icon className="w-5 h-5 text-brand-400 mb-3 group-hover:text-brand-950 transition-colors" />
                    <h3 className="font-medium text-brand-950 mb-1">{item.title}</h3>
                    <p className="text-xs text-brand-500">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-12">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-6 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'model' && (
                    <div className="w-10 h-10 rounded-full bg-brand-950 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className={`max-w-[85%] group relative ${message.role === 'user' ? 'bg-brand-950 text-white p-4 rounded-2xl shadow-sm' : ''}`}>
                    {message.role === 'user' ? (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    ) : (
                      <>
                        <div className="markdown-body">
                          <Markdown>{message.content}</Markdown>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="absolute -right-12 top-0 p-2 text-brand-400 hover:text-brand-950 opacity-0 group-hover:opacity-100 transition-all"
                          title="Copy to clipboard"
                        >
                          {copiedId === message.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-brand-600" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-6 justify-start">
                  <div className="w-10 h-10 rounded-full bg-brand-950 flex items-center justify-center shrink-0 animate-pulse">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex items-center gap-2 text-brand-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs font-medium uppercase tracking-widest">Lumina is thinking</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-brand-50">
          <div className="max-w-3xl mx-auto relative">
            <div className="glass rounded-2xl p-2 flex items-end gap-2 shadow-lg">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Lumina..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-brand-900 placeholder-brand-400 p-3 resize-none max-h-40 min-h-[52px]"
                rows={1}
              />
              <div className="flex items-center gap-1 p-1">
                <button 
                  onClick={() => setInput(prev => prev.startsWith('/image ') ? prev : `/image ${prev}`)}
                  className="p-2 text-brand-400 hover:text-brand-950 hover:bg-brand-100 rounded-xl transition-all"
                  title="Generate Image"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-xl transition-all ${
                    input.trim() && !isLoading 
                      ? 'bg-brand-950 text-white shadow-md hover:bg-brand-800' 
                      : 'text-brand-300'
                  }`}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-brand-400 mt-3 uppercase tracking-widest font-medium">
              Powered by Google Gemini • Lumina AI v1.0
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

