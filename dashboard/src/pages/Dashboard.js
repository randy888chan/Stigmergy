import React, { useState, useEffect, lazy, Suspense } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import { cn } from "../lib/utils.js";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable.jsx";
import { Separator } from "../components/ui/separator.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog.jsx";
import { Button } from "../components/ui/button.jsx";
import { ScrollArea } from "../components/ui/scroll-area.jsx";
import CurrentObjective from '../components/CurrentObjective.js';

// Lazy-load components
const ProjectSelector = lazy(() => import('../components/ProjectSelector.js'));
const CodeBrowser = lazy(() => import('../components/CodeBrowser.js'));
const ActivityLog = lazy(() => import('../components/ActivityLog.js'));
const ChatInterface = lazy(() => import('../components/ChatInterface.js'));
const DocumentUploader = lazy(() => import('../components/DocumentUploader.js'));
const FileViewer = lazy(() => import('../components/FileViewer.js'));
const AgentPerformanceMonitor = lazy(() => import('../components/AgentPerformanceMonitor.js'));
const ToolHealthMonitor = lazy(() => import('../components/ToolHealthMonitor.js'));
const SystemHealthAlerts = lazy(() => import('../components/SystemHealthAlerts.js'));
const MissionPlanner = lazy(() => import('../components/MissionPlanner.js'));
const GovernanceDashboard = lazy(() => import('../components/GovernanceDashboard.js'));
const ThoughtStream = lazy(() => import('../components/ThoughtStream.js'));
const ExecutiveSummary = lazy(() => import('../components/ExecutiveSummary.js'));
const SwarmVisualizer = lazy(() => import('../components/SwarmVisualizer.js'));


const INITIAL_STATE = {
  logs: [],
  agentActivity: [],
  thoughts: [],
  project_status: 'Idle',
  project_path: '',
  goal: '',
  files: [],
  isFileListLoading: false,
  filesError: null,
  selectedFile: null,
  fileContent: '',
  isFileContentLoading: false,
};

const Dashboard = () => {
  const { data, sendMessage } = useWebSocket('ws://localhost:3010/ws');
  const [systemState, setSystemState] = useState(INITIAL_STATE);
  const [thoughtStream, setThoughtStream] = useState([]);
  const [currentObjective, setCurrentObjective] = useState(null);
  const [healthData, setHealthData] = useState(null);
  const [humanApprovalRequest, setHumanApprovalRequest] = useState(null);
  const fetchFiles = async () => {
    setSystemState(prevState => ({ ...prevState, files: [], filesError: null, isFileListLoading: true }));
    try {
      const response = await fetch(`/api/files`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch files');
      }
      const files = await response.json();
      setSystemState(prevState => ({ ...prevState, files, isFileListLoading: false }));
    } catch (error) {
      console.error("Error fetching files:", error);
      setSystemState(prevState => ({ ...prevState, files: [], filesError: error.message, isFileListLoading: false }));
    }
  };

  useEffect(() => {
    if (data) {
      const { type, payload } = data;
      switch (type) {
        case 'state_update':
          setSystemState(prevState => ({ ...prevState, ...payload }));
          break;
        case 'project_switched':
          const newPath = payload.path;
          setSystemState(prevState => ({
            ...INITIAL_STATE,
            project_path: newPath,
            project_status: 'Project Set',
            logs: [...prevState.logs, `Project switched to ${newPath}`],
          }));
          fetchFiles();
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
        case 'system_health_update':
          setHealthData(payload);
          break;
        case 'objective_update':
          setCurrentObjective(payload);
          break;
        case 'thought_stream':
          setThoughtStream(prevStream => [payload, ...prevStream].slice(0, 50));
          break;
        case 'human_approval_request':
          setHumanApprovalRequest(payload);
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
    setHumanApprovalRequest(null); // Close the dialog after responding
  };

  const handleProjectSelect = (selectedPath) => {
    if (selectedPath) {
      sendMessage({ type: 'set_project', payload: { path: selectedPath } });
    }
  };

  const handleFileSelect = async (filePath) => {
    if (!filePath) return;
    setSystemState(prevState => ({
      ...prevState,
      selectedFile: filePath,
      isFileContentLoading: true,
      fileContent: '',
    }));
    try {
      const response = await fetch(`http://localhost:3010/api/file-content?path=${encodeURIComponent(filePath)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSystemState(prevState => ({
        ...prevState,
        fileContent: data.content,
        isFileContentLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch file content:", error);
      setSystemState(prevState => ({
        ...prevState,
        fileContent: `Error loading file: ${error.message}`,
        isFileContentLoading: false,
      }));
    }
  };

  return (
    <div className="dark h-screen w-screen bg-background text-foreground">
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


      <ResizablePanelGroup direction="vertical" className="h-full w-full">
        <ResizablePanel defaultSize={10} minSize={10} maxSize={10}>
          <div className="flex items-center justify-between p-4 border-b h-full">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">Stigmergy</h1>
                <Suspense fallback={<div className="p-4">Loading Project Selector...</div>}>
                    <ProjectSelector onProjectSelect={handleProjectSelect} />
                </Suspense>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <span><b>Active Project:</b> {systemState.project_path || 'None'}</span>
                <Separator orientation="vertical" className="h-6" />
                <span><b>Status:</b> <span className="font-mono p-1 bg-muted rounded-md">{systemState.project_status || 'Idle'}</span></span>
            </div>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25} minSize={20}>
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel>
              <Suspense fallback={<div className="p-4">Loading Executive Summary...</div>}>
                  <ExecutiveSummary />
              </Suspense>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel>
              <Suspense fallback={<div className="p-4">Loading Swarm Visualizer...</div>}>
                <Card className="h-full w-full rounded-none border-0 border-l">
                  <CardHeader>
                    <CardTitle>Live Swarm Delegation</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-4rem)] w-full p-0">
                    <SwarmVisualizer />
                  </CardContent>
                </Card>
              </Suspense>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={65}>
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={40}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50}>
                    <Card className="h-full w-full rounded-none border-0 border-r border-b flex flex-col">
                        <CardContent className="flex-grow overflow-auto p-0">
                            <Suspense fallback={<div className="p-4">Loading Code...</div>}>
                                {systemState.project_path ? (
                                    <CodeBrowser
                                        files={systemState.files}
                                        onFileSelect={handleFileSelect}
                                        selectedFile={systemState.selectedFile}
                                        isLoading={systemState.isFileListLoading}
                                        error={systemState.filesError}
                                    />
                                ) : (
                                    <div className="text-muted-foreground p-4">Set a project to see files.</div>
                                )}
                            </Suspense>
                        </CardContent>
                    </Card>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={50}>
                   <Suspense fallback={<div className="p-4">Loading Viewer...</div>}>
                        <FileViewer
                            filePath={systemState.selectedFile}
                            content={systemState.fileContent}
                            isLoading={systemState.isFileContentLoading}
                        />
                   </Suspense>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={60}>
                    <Card className="h-full w-full rounded-none border-0 border-r border-b flex flex-col">
                        <CardHeader>
                            <CardTitle>Agent Chat</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow p-2">
                           <Suspense fallback={<div className="p-4">Loading Chat...</div>}>
                                <ChatInterface sendMessage={sendMessage} engineStatus={systemState.project_status} activeProject={systemState.project_path} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40}>
                     <Card className="h-full w-full rounded-none border-0 border-r flex flex-col">
                        <CardHeader>
                            <CardTitle>Document Intelligence</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
                            <Suspense fallback={<div className="p-4">Loading Uploader...</div>}>
                                <DocumentUploader />
                            </Suspense>
                        </CardContent>
                    </Card>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={25}>
            <Card className="h-full w-full rounded-none border-0 border-t flex flex-col">
                <CardHeader>
                    <CardTitle>System Health Overview</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow overflow-auto p-2">
                    <ResizablePanelGroup direction="horizontal">
                        <ResizablePanel>
                            <Suspense fallback={<div className="p-4">Loading...</div>}>
                                <AgentPerformanceMonitor healthData={healthData} />
                            </Suspense>
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel>
                           <Suspense fallback={<div className="p-4">Loading Governance...</div>}>
                                <GovernanceDashboard />
                            </Suspense>
                        </ResizablePanel>
                        <ResizableHandle withHandle />
                        <ResizablePanel>
                             <ResizablePanelGroup direction="vertical">
                                <ResizablePanel>
                                    <Suspense fallback={<div className="p-4">Loading...</div>}>
                                        <ToolHealthMonitor healthData={healthData} />
                                    </Suspense>
                                </ResizablePanel>
                                <ResizableHandle withHandle />
                                <ResizablePanel>
                                    <Suspense fallback={<div className="p-4">Loading...</div>}>
                                        <SystemHealthAlerts healthData={healthData} />
                                    </Suspense>
                                </ResizablePanel>
                             </ResizablePanelGroup>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </CardContent>
            </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default Dashboard;