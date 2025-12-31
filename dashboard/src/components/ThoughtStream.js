import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion.jsx';
import { ScrollArea } from './ui/scroll-area.jsx';

const ThoughtStream = ({ thoughts }) => {
  if (!thoughts || thoughts.length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full mt-2">
      <AccordionItem value="item-1">
        <AccordionTrigger className="text-xs text-zinc-400 hover:text-zinc-200">
          View Thought Process...
        </AccordionTrigger>
        <AccordionContent>
          <ScrollArea className="h-48 w-full bg-zinc-900/50 p-2 rounded-md">
            <div className="space-y-2">
              {thoughts.map((thought, index) => (
                <div key={index} className="text-xs text-zinc-300 p-2 bg-black/20 rounded">
                  <pre className="whitespace-pre-wrap font-mono">{JSON.stringify(thought, null, 2)}</pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ThoughtStream;
