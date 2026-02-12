import React, { useState, useEffect, lazy, Suspense } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import { cn } from "../lib/utils.js";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog.jsx";
import { Button } from "../components/ui/button.jsx";
import { Loader2, Activity, Wifi } from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.jsx";

// Lazy Components
const ProjectSelector = lazy(() => import('../components/ProjectSelector.js'));
const CodeBrowser = lazy(() => import('../components/CodeBrowser.js'));
const ChatInterface = lazy(() => import('../components/ChatInterface.js'));
const FileViewer = lazy(() => import('../components/FileViewer.js'));
const SystemHealthAlerts = lazy(() => import('../components/SystemHealthAlerts.js'));
const GovernanceDashboard = lazy(() => import('../components/GovernanceDashboard.js'));
const ActivityLog = lazy(() => import('../components/ActivityLog.js'));
const SwarmVisualizer = lazy(() => import('../components/SwarmVisualizer.js'));
const MissionPlanner = lazy(() => import('../components/MissionPlanner.js'));
const DocumentUploader = lazy(() => import('../components/DocumentUploader.js'));

const INITIAL_STATE = {
  logs: [],
  agentActivity: [],
  thoughts: [],
  chatMessages: [],
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
  const [humanApprovalRequest, setHumanApprovalRequest] = useState(null);

  useEffect(() => {
    if (data) {
      const { type, payload } = data;
      console.log(`[WS] Received: ${type}`, payload);

      switch (type) {
        case 'state_update':
          setSystemState(prev => ({ ...prev, ...payload }));
          break;
        case 'log':
             setSystemState(prev => ({ ...prev, logs: [...prev.logs.slice(-100), payload] }));
             break;
        case 'agent_thought':
            setSystemState(prev => ({ ...prev, thoughts: [...prev.thoughts.slice(-50), payload] }));
            break;
        case 'agent_response':
            setSystemState(prev => ({
                ...prev,
                chatMessages: [...prev.chatMessages, { id: Date.now().toString(), role: 'assistant', content: payload.text }],
                thoughts: []
            }));
            break;
        case 'agent_start':
        case 'tool_start':
        case 'tool_end':
            setSystemState(prev => ({ ...prev, agentActivity: [...prev.agentActivity.slice(-50), { type, ...payload }] }));
            break;
        case 'project_switched':
          fetchFiles(payload.path);
          break;
        case 'human_approval_request':
          setHumanApprovalRequest(payload);
          break;
        default:
          break;
      }
    }
  }, [data]);

  const fetchFiles = async (targetPath) => {
    if (!targetPath) return;
    setSystemState(prev => ({ ...prev, isFileListLoading: true, files: [] }));
    try {
        const res = await fetch(`/api/files?path=${encodeURIComponent(targetPath)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const files = await res.json();
        setSystemState(prev => ({ ...prev, files, project_path: targetPath, isFileListLoading: false }));
    } catch (e) {
        console.error("[HTTP] File fetch error:", e);
        setSystemState(prev => ({ ...prev, isFileListLoading: false }));
    }
  };

  const handleProjectSelect = (path) => {
    fetchFiles(path);
    if (sendMessage) sendMessage({ type: 'set_project', payload: { path } });
  };

  const handleSendMessage = (content) => {
      const userMessage = { id: Date.now().toString(), role: 'user', content };
      setSystemState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, userMessage],
          thoughts: []
      }));
      if (sendMessage) sendMessage({ type: 'chat_message', payload: { content } });
  };

  const handleFileSelect = async (filePath) => {
    if (!filePath) return;
    setSystemState(prev => ({ ...prev, selectedFile: filePath, isFileContentLoading: true }));
    try {
        const res = await fetch(`/api/file-content?path=${encodeURIComponent(filePath)}`);
        const data = await res.json();
        setSystemState(prev => ({ ...prev, fileContent: data.content || "", isFileContentLoading: false }));
    } catch (e) {
        setSystemState(prev => ({ ...prev, fileContent: `Error: ${e.message}`, isFileContentLoading: false }));
    }
  };

  const handleApprovalResponse = (decision) => {
    if (!humanApprovalRequest) return;
    sendMessage({
      type: 'human_approval_response',
      payload: {
        requestId: humanApprovalRequest.requestId,
        decision,
      }
    });
    setHumanApprovalRequest(null);
  };

  return (
    <div className="dark h-screen w-screen bg-black text-zinc-300 font-sans overflow-hidden flex flex-col">
      <Suspense fallback={<></>}>
        <Dialog open={!!humanApprovalRequest} onOpenChange={(isOpen) => !isOpen && setHumanApprovalRequest(null)}>
            <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-red-500/50 text-white">
                <DialogHeader>
                    <DialogTitle className="text-red-400 flex items-center gap-2">
                        <Activity className="w-5 h-5" /> Human Approval Required
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        An agent has paused its execution and requires your input to proceed.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <p className="text-sm font-medium text-white">{humanApprovalRequest?.message}</p>
                    {humanApprovalRequest?.data && (
                            <ScrollArea className="h-48 w-full rounded-md border border-white/10 bg-black/50 p-4">
                            <pre className="text-xs font-mono whitespace-pre-wrap text-zinc-300">
                                {JSON.stringify(humanApprovalRequest.data, null, 2)}
                            </pre>
                        </ScrollArea>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="destructive" onClick={() => handleApprovalResponse('rejected')}>
                        Reject
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-500 text-white" onClick={() => handleApprovalResponse('approved')}>
                        Approve
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </Suspense>

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
            <Button
                variant="destructive"
                size="sm"
                className="h-8 text-[10px] uppercase tracking-wider font-bold"
                onClick={() => sendMessage({ type: 'stop_mission' })}
            >
                Stop Mission
            </Button>
         </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-grow">
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

        <ResizablePanel defaultSize={50} className="bg-zinc-900/50">
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Editor...</div>}>
                <FileViewer
                    filePath={systemState.selectedFile}
                    content={systemState.fileContent}
                    isLoading={systemState.isFileContentLoading}
                />
            </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-900" />

        <ResizablePanel defaultSize={30} minSize={20} className="bg-zinc-950 border-l border-white/10">
            <Suspense fallback={<div className="p-4 text-zinc-500 text-sm">Loading Panels...</div>}>
                <Tabs defaultValue="chat" className="h-full flex flex-col">
                    <TabsList className="bg-zinc-900/50 border-b border-white/5 w-full justify-start rounded-none p-0 h-10 shrink-0 overflow-x-auto">
                        <TabsTrigger value="chat" className="data-[state=active]:bg-zinc-800/50 data-[state=active]:text-blue-400 rounded-none h-full border-r border-white/5 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors">Chat</TabsTrigger>
                        <TabsTrigger value="plan" className="data-[state=active]:bg-zinc-800/50 data-[state=active]:text-blue-400 rounded-none h-full border-r border-white/5 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors">Plan</TabsTrigger>
                        <TabsTrigger value="swarm" className="data-[state=active]:bg-zinc-800/50 data-[state=active]:text-blue-400 rounded-none h-full border-r border-white/5 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors">Swarm</TabsTrigger>
                        <TabsTrigger value="activity" className="data-[state=active]:bg-zinc-800/50 data-[state=active]:text-blue-400 rounded-none h-full border-r border-white/5 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors">Activity</TabsTrigger>
                        <TabsTrigger value="health" className="data-[state=active]:bg-zinc-800/50 data-[state=active]:text-blue-400 rounded-none h-full border-r border-white/5 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors">Health</TabsTrigger>
                        <TabsTrigger value="governance" className="data-[state=active]:bg-zinc-800/50 data-[state=active]:text-blue-400 rounded-none h-full border-r border-white/5 px-4 text-[10px] uppercase tracking-widest font-bold transition-colors">Gov</TabsTrigger>
                    </TabsList>

                    <div className="flex-grow overflow-hidden">
                        <TabsContent value="chat" className="h-full p-0 m-0 flex flex-col">
                            <div className="flex-grow overflow-hidden">
                                <ChatInterface
                                    activeProject={systemState.project_path}
                                    engineStatus={systemState.project_status}
                                    messages={systemState.chatMessages}
                                    onSendMessage={handleSendMessage}
                                    thoughtStream={systemState.thoughts}
                                    isConnected={isConnected}
                                />
                            </div>
                            <div className="px-4 pb-4 bg-zinc-950/30">
                                <DocumentUploader />
                            </div>
                        </TabsContent>
                        <TabsContent value="plan" className="h-full p-0 m-0">
                            <ScrollArea className="h-full">
                                <div className="p-4">
                                    <MissionPlanner />
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="swarm" className="h-full p-0 m-0">
                            <div className="h-full bg-black/20 relative">
                                <SwarmVisualizer data={data} />
                            </div>
                        </TabsContent>
                        <TabsContent value="activity" className="h-full p-0 m-0">
                            <ScrollArea className="h-full">
                                <div className="p-4">
                                    <ActivityLog agentActivity={systemState.agentActivity} />
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="health" className="h-full p-0 m-0">
                            <ScrollArea className="h-full">
                                <div className="p-4">
                                    <SystemHealthAlerts healthData={{}} />
                                </div>
                            </ScrollArea>
                        </TabsContent>
                        <TabsContent value="governance" className="h-full p-0 m-0">
                            <ScrollArea className="h-full">
                                <div className="p-4">
                                    <GovernanceDashboard proposals={[]} isAdmin={true} />
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </div>
                </Tabs>
            </Suspense>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
};

export default Dashboard;
