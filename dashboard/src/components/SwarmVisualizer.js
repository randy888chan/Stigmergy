import React from 'react';
import { Bot, Terminal, CheckCircle, AlertCircle } from 'lucide-react';

const SwarmVisualizer = ({ activity }) => {
  if (!activity || activity.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2">
        <Bot className="w-12 h-12 opacity-20" />
        <p className="text-sm">No swarm activity yet.</p>
        <p className="text-xs">Start a mission to see agents in action.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {activity.map((item) => (
        <div key={item.id} className="flex gap-3 items-start border-b border-white/5 pb-3 last:border-0">
          <div className="mt-1">
            {item.type === 'agent_start' && <Bot className="w-4 h-4 text-blue-400" />}
            {item.type === 'tool_start' && <Terminal className="w-4 h-4 text-yellow-400" />}
            {item.type === 'tool_end' && <CheckCircle className="w-4 h-4 text-green-400" />}
            {item.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs text-zinc-500 font-mono mb-1">
              {new Date(item.id || Date.now()).toLocaleTimeString()}
            </div>
            <div className="text-sm text-zinc-300 font-medium">
              {item.type === 'agent_start' && `Activated: ${item.agentId}`}
              {item.type === 'tool_start' && `Running: ${item.tool}`}
              {item.type === 'tool_end' && `Finished: ${item.tool}`}
            </div>
            {item.args && (
              <pre className="text-xs text-zinc-500 mt-1 bg-black/20 p-1 rounded overflow-x-auto">
                {JSON.stringify(item.args, null, 2)}
              </pre>
            )}
            {item.result && (
               <div className="text-xs text-green-500/50 mt-1 truncate">
                 Result: {typeof item.result === 'string' ? item.result : 'Object'}
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SwarmVisualizer;
