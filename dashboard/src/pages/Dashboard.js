import React, { useState, useEffect, lazy, Suspense } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import { cn } from "../lib/utils.js";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable.jsx";
import { Separator } from "../components/ui/separator.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog.jsx";
import { ScrollArea } from "../components/ui/scroll-area.jsx";

// Lazy Components
const ProjectSelector = lazy(() => import('../components/ProjectSelector.js'));
const CodeBrowser = lazy(() => import('../components/CodeBrowser.js'));
const ChatInterface = lazy(() => import('../components/ChatInterface.js'));
const FileViewer = lazy(() => import('../components/FileViewer.js'));
const SystemHealthAlerts = lazy(() => import('../components/SystemHealthAlerts.js'));
const GovernanceDashboard = lazy(() => import('../components/GovernanceDashboard.js'));
const ActivityLog = lazy(() => import('../components/ActivityLog.js'));

const INITIAL_STATE = {
  logs: [],
  agentActivity: [],
  thoughts: [],
  project_status: 'Idle',
  project_path: '',
  files: [],
  isFileListLoading: false,
  selectedFile: null,
  fileContent: '',
  isFileContentLoading: false,
};

const Dashboard = () => {
  const { data, sendMessage } = useWebSocket('/ws');
  const [systemState, setSystemState] = useState(INITIAL_STATE);
  const [humanApprovalRequest, setHumanApprovalRequest] = useState(null);
  const [thoughtStream, setThoughtStream] = useState([]);
  const [healthData, setHealthData] = useState({ alerts: [] });

  // --- WebSocket Synchronization ---
  useEffect(() => {
    if (data) {
      const { type, payload } = data;
      switch (type) {
        case 'state_update':
          setSystemState(prevState => ({ ...prevState, ...payload }));
          break;
        case 'project_switched':
          setSystemState(prevState => ({
            ...prevState,
            project_path: payload.path,
            project_status: 'Project Set',
            logs: [...prevState.logs, `Project switched to ${payload.path}`],
          }));
          break;
        case 'log':
             setSystemState(prevState => ({ ...prevState, logs: [...prevState.logs.slice(-100), payload] }));
             break;
        case 'agent_thought':
            setSystemState(prevState => ({ ...prevState, thoughts: [...prevState.thoughts.slice(-100), payload] }));
            break;
        case 'agent_start':
        case 'tool_start':
        case 'tool_end':
            setSystemState(prevState => ({ ...prevState, agentActivity: [...prevState.agentActivity.slice(-100), { type, ...payload }] }));
            break;
        case 'human_approval_request':
          setHumanApprovalRequest(payload);
          break;
        case 'thought_stream':
          setThoughtStream(prevStream => [payload, ...prevStream].slice(0, 50));
          break;
        case 'system_health_update':
          setHealthData(payload);
          break;
        default:
          break;
      }
    }
  }, [data]);

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

  // --- Robust File Fetcher ---
  const fetchFiles = async (targetPath) => {
    if (!targetPath) return;

    setSystemState(prev => ({ ...prev, isFileListLoading: true, files: [] }));

    try {
        console.log("Fetching files for:", targetPath);
        const res = await fetch(`/api/files?path=${encodeURIComponent(targetPath)}`);
        if (!res.ok) throw new Error("Failed to load files");

        const files = await res.json();
        setSystemState(prev => ({
            ...prev,
            files,
            project_path: targetPath, // Update active path
            isFileListLoading: false
        }));
    } catch (e) {
        console.error("File fetch error:", e);
        setSystemState(prev => ({ ...prev, isFileListLoading: false }));
    }
  };

  // --- Handle Selection ---
  const handleProjectSelect = (path) => {
    console.log("Project Selected:", path);
    // 1. Update State & Fetch HTTP
    fetchFiles(path);
    // 2. Notify Server via WS (Optional/Backup)
    if (sendMessage) sendMessage({ type: 'set_project', payload: { path } });
  };

  // --- Handle File Selection (IDE) ---
  const handleFileSelect = async (filePath) => {
    if (!filePath) return;

    setSystemState(prev => ({ ...prev, selectedFile: filePath, isFileContentLoading: true }));

    try {
        // Use project_path to resolve relative files
        const fullPath = filePath.startsWith('/') ? filePath : systemState.project_path + '/' + filePath;

        const res = await fetch(`/api/file-content?path=${encodeURIComponent(fullPath)}`);
        const data = await res.json();

        setSystemState(prev => ({
            ...prev,
            fileContent: data.content || "",
            isFileContentLoading: false
        }));
    } catch (e) {
        setSystemState(prev => ({
            ...prev,
            fileContent: `Error: ${e.message}`,
            isFileContentLoading: false
        }));
    }
  };

  return (
    <div className="dark h-screen w-screen bg-black text-zinc-300 font-sans overflow-hidden">
      {/* Human Handoff Modal */}
      <Suspense fallback={<></>}>
          <Dialog open={!!humanApprovalRequest} onOpenChange={(isOpen) => !isOpen && setHumanApprovalRequest(null)}>
              <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                      <DialogTitle>Human Approval Required</DialogTitle>
                      <DialogDescription>
                          An agent has paused its execution and requires your input to proceed.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <p className="text-sm font-medium">{humanApprovalRequest?.message}</p>
                      {humanApprovalRequest?.data && (
                           <ScrollArea className="h-72 w-full rounded-md border p-4">
                              <pre className="text-xs whitespace-pre-wrap">
                                  {JSON.stringify(humanApprovalRequest.data, null, 2)}
                              </pre>
                          </ScrollArea>
                      )}
                  </div>
                  <DialogFooter>
                      <Button variant="destructive" onClick={() => handleApprovalResponse('rejected')}>
                          Reject
                      </Button>
                      <Button variant="default" onClick={() => handleApprovalResponse('approved')}>
                          Approve
                      </Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      </Suspense>

      <ResizablePanelGroup direction="vertical">
        {/* Header */}
        <ResizablePanel defaultSize={8} minSize={8} maxSize={8} className="border-b border-white/10 bg-zinc-950/50">
          <div className="flex items-center justify-between px-4 h-full">
             <div className="flex items-center gap-4">
                <div className="font-bold text-lg text-white tracking-tight">Stigmergy <span className="text-blue-500">AI</span></div>
                <div className="h-4 w-[1px] bg-white/10 mx-2"></div>
                <Suspense fallback={<Loader2 className="w-4 h-4 animate-spin"/>}>
                    <ProjectSelector onProjectSelect={handleProjectSelect} />
                </Suspense>
             </div>
             <div className="text-xs font-mono text-zinc-500">
                {systemState.project_path || "No Project Selected"}
             </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-zinc-900" />

        {/* Main Content */}
        <ResizablePanel defaultSize={92}>
          <ResizablePanelGroup direction="horizontal">

            {/* Left: Files */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-zinc-950">
                <Card className="h-full rounded-none border-0 bg-transparent">
                    <CardHeader className="py-3 px-4 border-b border-white/10">
                        <CardTitle className="text-sm font-medium text-zinc-400">Explorer</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 h-[calc(100%-3rem)]">
                        <Suspense fallback={<div className="p-4 text-xs">Loading tree...</div>}>
                            <CodeBrowser
                                files={systemState.files}
                                onFileSelect={handleFileSelect}
                                selectedFile={systemState.selectedFile}
                                isLoading={systemState.isFileListLoading}
                            />
                        </Suspense>
                    </CardContent>
                </Card>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-zinc-900" />

            {/* Center: IDE / Chat */}
            <ResizablePanel defaultSize={50}>
                <ResizablePanelGroup direction="vertical">
                     {/* Top: IDE */}
                     <ResizablePanel defaultSize={60}>
                        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Editor...</div>}>
                            <FileViewer
                                filePath={systemState.selectedFile}
                                content={systemState.fileContent}
                                isLoading={systemState.isFileContentLoading}
                            />
                        </Suspense>
                     </ResizablePanel>

                     <ResizableHandle withHandle className="bg-zinc-900" />

                     {/* Bottom: Chat */}
                     <ResizablePanel defaultSize={40}>
                        <Suspense fallback={null}>
                            <ChatInterface
                                engineStatus={systemState.project_status}
                                activeProject={systemState.project_path}
                                thoughtStream={thoughtStream}
                            />
                        </Suspense>
                     </ResizablePanel>
                </ResizablePanelGroup>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-zinc-900" />

            {/* Right: Tools / Logs */}
            <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full bg-zinc-950 border-l border-white/10 p-4 overflow-y-auto">
                    <Suspense fallback={null}>
                        <SystemHealthAlerts healthData={healthData} />
                        <div className="mt-4">
                           <GovernanceDashboard proposals={[]} isAdmin={true} />
                        </div>
                        <div className="mt-4">
                            <ActivityLog agentActivity={systemState.agentActivity} />
                        </div>
                    </Suspense>
                </div>
            </ResizablePanel>

          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Dashboard;
