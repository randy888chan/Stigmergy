import React from 'react';
import { useChat } from '@ai-sdk/react';
import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';

// These are the states where the engine is actively working and cannot accept new goals.
export const BUSY_STATUSES = [
  'ENRICHMENT_PHASE',
  'PLANNING_PHASE',
  'CODING_PHASE',
  'TESTING_PHASE',
  'DEBUGGING_PHASE',
  'EXECUTING',
  'Running', // A general busy state
];

export const ChatInterface = ({ engineStatus, activeProject }) => {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    // The Vercel AI SDK `useChat` hook defaults to `/api/chat`.
    // We pass the active project path in the body of the request.
    body: {
      project_path: activeProject,
    },
    // Only enable the hook if a project is selected.
    // While there's no 'enabled' flag, UI controls will prevent submission.
  });

  const isBusy = BUSY_STATUSES.includes(engineStatus);
  // Guard against `input` being undefined on initial render.
  const canSubmit = (input || '').trim() && activeProject && !isBusy;

  // We wrap the default handleSubmit to respect our custom canSubmit logic.
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow p-1">
        <div className="space-y-4 p-3">
          {messages.length > 0 ? (
            messages.map(m => (
              <div key={m.id} className="flex">
                <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${
                  m.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground pt-4">
              Define a new mission for the selected project.
            </div>
          )}
        </div>
      </ScrollArea>
      <form onSubmit={handleFormSubmit} className="flex items-center gap-2 p-1 border-t">
        <Input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={!activeProject ? "Set a project first..." : isBusy ? "Engine is busy..." : "Enter your mission objective..."}
          disabled={!activeProject || isBusy}
          className="flex-grow"
        />
        <Button type="submit" disabled={!canSubmit}>
          {isBusy ? 'Busy' : 'Send'}
        </Button>
      </form>
    </div>
  );
};