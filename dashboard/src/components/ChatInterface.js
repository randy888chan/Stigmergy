import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Textarea } from './ui/textarea.jsx';
import { Button } from './ui/button.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';
import { Send } from 'lucide-react';
import ThoughtStream from './ThoughtStream.js';

export const BUSY_STATUSES = [
  'CODING_PHASE',
  'TESTING_PHASE',
  'DEBUGGING_PHASE',
  'EXECUTING',
  'Running',
];

export const ChatInterface = ({ engineStatus, activeProject, thoughtStream, messages, onSendMessage, isConnected }) => {
  const [input, setInput] = useState('');

  const isBusy = BUSY_STATUSES.includes(engineStatus);
  const canSubmit = input.trim() && activeProject && !isBusy && isConnected;

  const handleInputChange = (e) => setInput(e.target.value);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent p-4 rounded-lg">
      <ScrollArea className="flex-grow mb-4">
        <div className="space-y-6 pr-4">
          {messages.length > 0 ? (
            messages.map(m => (
              <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 prose prose-invert max-w-xl ${
                  m.role === 'user'
                    ? 'ml-auto bg-blue-600/80 backdrop-blur-sm rounded-2xl rounded-tr-none text-white'
                    : 'bg-white/5 border border-white/10 rounded-2xl rounded-tl-none'
                }`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {m.content}
                  </ReactMarkdown>
                  {m.role !== 'user' && thoughtStream && thoughtStream.length > 0 && (
                      <ThoughtStream thoughts={thoughtStream} />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-md text-zinc-500 pt-10">
              Start a new mission by selecting a project and defining your objective.
            </div>
          )}
          {isBusy && messages.length > 0 && messages[messages.length-1].role === 'user' && (
              <div className="flex flex-col items-start">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl rounded-tl-none">
                      <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          Processing Mission...
                      </div>
                      {thoughtStream && thoughtStream.length > 0 && (
                          <ThoughtStream thoughts={thoughtStream} />
                      )}
                  </div>
              </div>
          )}
        </div>
      </ScrollArea>
      <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-700 shadow-2xl">
        <form onSubmit={handleFormSubmit} className="flex items-center gap-4">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={
                !isConnected ? "Reconnecting to engine..." :
                !activeProject ? "Please select a project to begin..." :
                isBusy ? "The agents are working..." :
                "Describe the mission objective..."
            }
            disabled={!activeProject || isBusy || !isConnected}
            className="flex-grow bg-transparent border-0 focus:ring-0 focus:outline-none resize-none"
            rows={2}
          />
          <Button type="submit" disabled={!canSubmit} size="icon" className="rounded-full">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
