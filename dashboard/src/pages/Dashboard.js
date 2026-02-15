import React, { useState, useEffect, lazy, Suspense, useRef } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs.jsx";
import { Loader2, Wifi, Upload, RefreshCw } from "lucide-react";
import { Button } from "../components/ui/button.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog.jsx";
import { Activity } from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area.jsx";

// Lazy Components
const ProjectSelector = lazy(() => import('../components/ProjectSelector.js'));
const CodeBrowser = lazy(() => import('../components/CodeBrowser.js'));
const ChatInterface = lazy(() => import('../components/ChatInterface.js'));
const DocumentUploader = lazy(() => import('../components/DocumentUploader.js'));
const FileViewer = lazy(() => import('../components/FileViewer.js'));
const SystemHealthAlerts = lazy(() => import('../components/SystemHealthAlerts.js'));
const GovernanceDashboard = lazy(() => import('../components/GovernanceDashboard.js'));
const SwarmVisualizer = lazy(() => import('../components/SwarmVisualizer.js'));
const ActivityLog = lazy(() => import('../components/ActivityLog.js'));

const INITIAL_STATE = {
  messages: [],
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
  const { data, sendMessage, isConnected } = useWebSocket('/ws');
  const [systemState, setSystemState] = useState(INITIAL_STATE);
  const [humanApprovalRequest, setHumanApprovalRequest] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (data) {
      const { type, payload } = data;
      console.log(`[WS] ${type}`, payload);

      setSystemState(prev => {
        switch (type) {
          case 'state_update':
            return { ...prev, ...payload };

          case 'agent_thought':
          case 'agent_response':
            if (!payload.text) return prev;
            // Avoid duplicate identical messages (e.g. if thought and response are the same)
            const lastMessage = prev.messages[prev.messages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content === payload.text && lastMessage.agent === (payload.agentId || 'System')) {
                return prev;
            }
            return {
                ...prev,
                messages: [...prev.messages, {
                    id: Date.now() + Math.random(),
                    role: 'assistant',
                    content: payload.text,
                    agent: payload.agentId || 'System'
                }]
            };

          case 'thought_stream':
            return {
                ...prev,
                messages: [...prev.messages, {
                    id: Date.now() + Math.random(),
                    role: 'system',
                    content: payload.thought,
                    agent: 'ThoughtStream'
                }]
            };

          case 'log':
            if (payload.level === 'error') {
                return {
                    ...prev,
                    messages: [...prev.messages, {
                        id: Date.now() + Math.random(),
                        role: 'system',
                        content: `Error: ${payload.message}`,
                        agent: 'System'
                    }]
                };
            }
            return prev;

          case 'tool_start':
            // CRITICAL RESTORATION: Show tools in chat
            return {
                ...prev,
                messages: [...prev.messages, {
                    id: Date.now() + Math.random(),
                    role: 'system',
                    content: `Executing: ${payload.tool}`,
                    details: payload.args
                }],
                agentActivity: [{ id: Date.now(), type, ...payload }, ...prev.agentActivity.slice(0, 49)]
            };

          case 'tool_end':
          case 'agent_start':
            return {
                ...prev,
                agentActivity: [{ id: Date.now(), type, ...payload }, ...prev.agentActivity.slice(0, 49)]
            };

          case 'project_switched':
            fetchFiles(payload.path);
            return { ...prev, project_path: payload.path };

          case 'human_approval_request':
            setHumanApprovalRequest(payload);
            return prev;

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
      setSystemState(prev => ({
          ...prev,
          messages: [...prev.messages, { id: Date.now(), role: 'user', content: text }]
      }));
      if (sendMessage) sendMessage({ type: 'chat_message', payload: { content: text } });
  };

  const handleApprovalResponse = (decision) => {
    if (!humanApprovalRequest) return;
    sendMessage({ type: 'human_approval_response', payload: { requestId: humanApprovalRequest.requestId, decision } });
    setHumanApprovalRequest(null);
  };

  // --- RESTORED: Document Upload ---
  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = async (e) => {
      const file = e.target.files[0];
      if (!file || !systemState.project_path) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
          const response = await fetch('/api/upload?target=project', {
              method: 'POST',
              body: formData
          });
          if (!response.ok) throw new Error(await response.text());

          alert("File uploaded. Telling agent...");
          fetchFiles(systemState.project_path);
          handleUserMessage(`I uploaded ${file.name}. Please analyze it.`);
      } catch(err) { alert("Upload failed: " + err.message); }
  };

  return (
    <div className="dark h-screen w-screen bg-black text-zinc-300 font-sans overflow-hidden flex flex-col">
      <Suspense fallback={<></>}>
        <Dialog open={!!humanApprovalRequest} onOpenChange={(isOpen) => !isOpen && setHumanApprovalRequest(null)}>
            <DialogContent className="bg-zinc-900 border-red-500/50 text-white">
                <DialogHeader><DialogTitle>Human Approval Required</DialogTitle><DialogDescription>{humanApprovalRequest?.message}</DialogDescription></DialogHeader>
                <DialogFooter>
                    <Button variant="destructive" onClick={() => handleApprovalResponse('rejected')}>Reject</Button>
                    <Button className="bg-green-600" onClick={() => handleApprovalResponse('approved')}>Approve</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </Suspense>

      <div className="h-14 border-b border-white/10 bg-zinc-950/50 flex items-center justify-between px-4 shrink-0">
         <div className="flex items-center gap-4">
            <div className="font-bold text-lg text-white">Stigmergy <span className="text-blue-500">AI</span></div>
            <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
            <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin"/>}><ProjectSelector onProjectSelect={handleProjectSelect} /></Suspense>
         </div>
         <div className="flex items-center gap-4 text-xs font-mono">
            {systemState.project_path && <span className="text-zinc-500 truncate max-w-[300px]">{systemState.project_path}</span>}
            <div className={`flex items-center gap-1 ${isConnected ? 'text-green-500' : 'text-red-500'}`}><Wifi className="w-3 h-3" /> {isConnected ? 'Live' : 'Offline'}</div>
         </div>
      </div>

      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-zinc-950 border-r border-white/10 flex flex-col">
             <div className="p-2 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
                 <span className="text-xs font-bold text-zinc-400 pl-2">EXPLORER</span>
                 <div className="flex gap-1">
                     <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                     <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-blue-900/20" onClick={handleUploadClick} title="Upload Document"><Upload className="w-3 h-3 text-blue-400" /></Button>
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => fetchFiles(systemState.project_path)} title="Refresh"><RefreshCw className="w-3 h-3" /></Button>
                 </div>
             </div>
             <div className="flex-grow overflow-hidden">
                <Suspense fallback={null}>
                    <CodeBrowser files={systemState.files} onFileSelect={handleFileSelect} selectedFile={systemState.selectedFile} isLoading={systemState.isFileListLoading} />
                </Suspense>
             </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-900" />

        <ResizablePanel defaultSize={50}>
             <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Editor...</div>}>
                <FileViewer filePath={systemState.selectedFile} content={systemState.fileContent} isLoading={systemState.isFileContentLoading} />
            </Suspense>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-900" />

        <ResizablePanel defaultSize={30} minSize={20} className="bg-zinc-950 border-l border-white/10">
            <Tabs defaultValue="chat" className="h-full flex flex-col">
                <TabsList className="bg-zinc-900 border-b border-white/10 w-full justify-start rounded-none p-0 h-10">
                    <TabsTrigger value="chat" className="data-[state=active]:bg-zinc-800 rounded-none h-full border-r border-white/10 px-4 flex-1">Chat</TabsTrigger>
                    <TabsTrigger value="swarm" className="data-[state=active]:bg-zinc-800 rounded-none h-full border-r border-white/10 px-4 flex-1">Swarm</TabsTrigger>
                    <TabsTrigger value="system" className="data-[state=active]:bg-zinc-800 rounded-none h-full border-r border-white/10 px-4 flex-1">System</TabsTrigger>
                </TabsList>

                <div className="flex-grow overflow-hidden relative">
                    <TabsContent value="chat" className="h-full p-0 m-0 absolute inset-0">
                        <Suspense fallback={null}><ChatInterface messages={systemState.messages} onSendMessage={handleUserMessage} /></Suspense>
                    </TabsContent>
                    <TabsContent value="swarm" className="h-full p-0 m-0 absolute inset-0 overflow-y-auto">
                        <Suspense fallback={null}><SwarmVisualizer activity={systemState.agentActivity} /></Suspense>
                    </TabsContent>
                    <TabsContent value="system" className="h-full p-0 m-0 absolute inset-0 overflow-y-auto bg-black">
                        <Suspense fallback={null}>
                            <div className="p-4 space-y-4">
                                <DocumentUploader onUploadSuccess={() => fetchFiles(systemState.project_path)} />
                                <SystemHealthAlerts healthData={{}} />
                                <GovernanceDashboard proposals={[]} isAdmin={true} />
                                <ActivityLog agentActivity={systemState.agentActivity} />
                            </div>
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
