import React, { useState, useEffect, lazy, Suspense } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.jsx"; // Ensure this import exists or use standard UI
import { Loader2, Wifi } from "lucide-react";

// Lazy Components
const ProjectSelector = lazy(() => import('../components/ProjectSelector.js'));
const CodeBrowser = lazy(() => import('../components/CodeBrowser.js'));
const ChatInterface = lazy(() => import('../components/ChatInterface.js'));
const FileViewer = lazy(() => import('../components/FileViewer.js'));
const ActivityLog = lazy(() => import('../components/ActivityLog.js'));
const SwarmVisualizer = lazy(() => import('../components/SwarmVisualizer.js')); // Ensure this is implemented

const INITIAL_STATE = {
  messages: [], // Unified chat history
  agentActivity: [],
  project_status: 'Idle',
  project_path: '',
  files: [],
  isFileListLoading: false,
  selectedFile: null,
  fileContent: '',
  isFileContentLoading: false,
};

const Dashboard = () => {
  const { data, isConnected, sendMessage } = useWebSocket('/ws');
  const [systemState, setSystemState] = useState(INITIAL_STATE);

  useEffect(() => {
    if (data) {
      const { type, payload } = data;
      console.log(`[WS Logic] Processing: ${type}`, payload);

      setSystemState(prev => {
        const newState = { ...prev };

        switch (type) {
          case 'state_update':
            return { ...prev, ...payload };

          case 'agent_thought':
          case 'agent_response':
            // FIX: Map agent events to Chat Messages
            // Avoid duplicates if possible, or just append
            return {
                ...prev,
                messages: [...prev.messages, {
                    id: Date.now(),
                    role: 'assistant',
                    content: payload.text || JSON.stringify(payload), // Fallback to avoid empty bubble
                    agent: payload.agentId
                }]
            };

          case 'agent_start':
          case 'tool_start':
          case 'tool_end':
            return {
                ...prev,
                agentActivity: [
                    { id: Date.now(), type, ...payload },
                    ...prev.agentActivity.slice(0, 49) // Keep last 50, newest first
                ]
            };

          case 'project_switched':
            fetchFiles(payload.path);
            return { ...prev, project_path: payload.path };

          default:
            return prev;
        }
      });
    }
  }, [data]);

  const fetchFiles = async (targetPath) => {
    if (!targetPath) return;
    setSystemState(prev => ({ ...prev, isFileListLoading: true, files: [] }));
    try {
        const res = await fetch(`/api/files?path=${encodeURIComponent(targetPath)}`);
        const files = await res.json();
        setSystemState(prev => ({ ...prev, files, project_path: targetPath, isFileListLoading: false }));
    } catch (e) {
        console.error("File fetch error:", e);
        setSystemState(prev => ({ ...prev, isFileListLoading: false }));
    }
  };

  const handleProjectSelect = (path) => {
    fetchFiles(path);
    if (sendMessage) sendMessage({ type: 'set_project', payload: { path } });
  };

  const handleFileSelect = async (filePath) => {
    setSystemState(prev => ({ ...prev, selectedFile: filePath, isFileContentLoading: true }));
    try {
        const res = await fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`);
        const data = await res.json();
        setSystemState(prev => ({ ...prev, fileContent: data.content || "", isFileContentLoading: false }));
    } catch (e) {
        setSystemState(prev => ({ ...prev, fileContent: `Error: ${e.message}`, isFileContentLoading: false }));
    }
  };

  const handleUserMessage = (text) => {
      // Optimistic Update
      setSystemState(prev => ({
          ...prev,
          messages: [...prev.messages, { id: Date.now(), role: 'user', content: text }]
      }));
      if (sendMessage) sendMessage({ type: 'chat_message', payload: { content: text } });
  };

  return (
    <div className="dark h-screen w-screen bg-black text-zinc-300 font-sans overflow-hidden flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-white/10 bg-zinc-950/50 flex items-center justify-between px-4 shrink-0">
         <div className="flex items-center gap-4">
            <div className="font-bold text-lg text-white tracking-tight">Stigmergy <span className="text-blue-500">AI</span></div>
            <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
            <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin"/>}>
                <ProjectSelector onProjectSelect={handleProjectSelect} />
            </Suspense>
         </div>
         <div className="flex items-center gap-4 text-xs font-mono">
            {systemState.project_path && <span className="text-zinc-500 truncate max-w-[300px]">{systemState.project_path}</span>}
            <div className={`flex items-center gap-1 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                <Wifi className="w-3 h-3" /> {isConnected ? 'Live' : 'Offline'}
            </div>
         </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        {/* Left: Files */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-zinc-950 border-r border-white/10">
             <Suspense fallback={null}>
                 <CodeBrowser
                     files={systemState.files}
                     onFileSelect={handleFileSelect}
                     selectedFile={systemState.selectedFile}
                     isLoading={systemState.isFileListLoading}
                 />
             </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-900" />

        {/* Center: IDE */}
        <ResizablePanel defaultSize={50}>
             <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Editor...</div>}>
                <FileViewer
                    filePath={systemState.selectedFile}
                    content={systemState.fileContent}
                    isLoading={systemState.isFileContentLoading}
                />
            </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-900" />

        {/* Right: Tabs (Chat / Swarm / Logs) */}
        <ResizablePanel defaultSize={30} minSize={20} className="bg-zinc-950 border-l border-white/10">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
                <TabsList className="bg-zinc-900 border-b border-white/10 w-full justify-start rounded-none p-0 h-10">
                    <TabsTrigger value="chat" className="data-[state=active]:bg-zinc-800 rounded-none h-full border-r border-white/10 px-4">Chat</TabsTrigger>
                    <TabsTrigger value="swarm" className="data-[state=active]:bg-zinc-800 rounded-none h-full border-r border-white/10 px-4">Swarm</TabsTrigger>
                    <TabsTrigger value="logs" className="data-[state=active]:bg-zinc-800 rounded-none h-full border-r border-white/10 px-4">Activity</TabsTrigger>
                </TabsList>

                <div className="flex-grow overflow-hidden relative">
                    <TabsContent value="chat" className="h-full p-0 m-0 absolute inset-0">
                        <Suspense fallback={null}>
                            {/* Pass normalized messages */}
                            <ChatInterface
                                messages={systemState.messages}
                                onSendMessage={handleUserMessage}
                            />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="swarm" className="h-full p-0 m-0 absolute inset-0 overflow-y-auto">
                        <Suspense fallback={null}>
                            <SwarmVisualizer activity={systemState.agentActivity} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="logs" className="h-full p-0 m-0 absolute inset-0 overflow-y-auto">
                        <Suspense fallback={null}>
                            <ActivityLog agentActivity={systemState.agentActivity} />
                        </Suspense>
                    </TabsContent>
                </div>
            </Tabs>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
};

export default Dashboard;
