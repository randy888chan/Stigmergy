import React, { useRef, useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import { ScrollArea } from "./ui/scroll-area.jsx";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ChatInterface = ({ messages = [], onSendMessage }) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollRef.current) {
        scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-black">
      <ScrollArea className="flex-grow p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
             <div className="text-center text-zinc-600 text-sm mt-10">
                Ready to help. Ask me anything about your code.
             </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg p-3 text-sm prose prose-invert ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-zinc-800 text-zinc-200 rounded-tl-none border border-white/10'
                }`}
              >
                {msg.agent && <div className="text-xs text-zinc-500 mb-1 font-bold">{msg.agent}</div>}
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/10 bg-zinc-900/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type instructions here..."
            className="bg-black border-white/10 text-zinc-300 focus-visible:ring-blue-500"
          />
          <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-500">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
