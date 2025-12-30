import React, { useState, useEffect, lazy, Suspense } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import Layout from '../components/Layout.js';
import Tabs from '../components/Tabs.js';

// Shadcn UI components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog.jsx";
import { Button } from "../components/ui/button.jsx";
import { ScrollArea } from "../components/ui/scroll-area.jsx";

import authenticatedFetch from '../lib/api.js';

// Lazy-load components
const ProjectSelector = lazy(() => import('../components/ProjectSelector.js'));
const ActivityLog = lazy(() => import('../components/ActivityLog.js'));
const ChatInterface = lazy(() => import('../components/ChatInterface.js'));
const ToolHealthMonitor = lazy(() => import('../components/ToolHealthMonitor.js'));
const SwarmVisualizer = lazy(() => import('../components/SwarmVisualizer.js'));
const CodeBrowser = lazy(() => import('../components/CodeBrowser.js'));
const FileViewer = lazy(() => import('../components/FileViewer.js'));

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
  const { data, sendMessage } = useWebSocket(); // Use dynamic URL
  const [systemState, setSystemState] = useState(INITIAL_STATE);
  const [humanApprovalRequest, setHumanApprovalRequest] = useState(null);
  const [thoughtStream, setThoughtStream] = useState([]);
  const [healthData, setHealthData] = useState(null);

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
      const data = await authenticatedFetch(`/api/file-content?path=${encodeURIComponent(filePath)}`);
      setSystemState(prevState => ({
        ...prevState,
        fileContent: data.content,
        isFileContentLoading: false,
      }));
    } catch (error) {
      console.error("Failed to fetch file content:", error);
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


  const sidebarContent = (
    <div className="flex flex-col h-full">
        <Button variant="outline" className="w-full mb-4">+ New Chat</Button>
        <Suspense fallback={<div>Loading...</div>}>
            <ProjectSelector onProjectSelect={handleProjectSelect} />
        </Suspense>
        <div className="mt-4 text-sm text-zinc-400">
            History (coming soon)
        </div>
    </div>
  );

  const rightPanelTabs = [
    {
      label: 'Activity',
      content: (
        <Suspense fallback={<div>Loading...</div>}>
          <ActivityLog agentActivity={systemState.agentActivity} />
        </Suspense>
      ),
    },
    {
      label: 'Swarm',
      content: (
        <Suspense fallback={<div>Loading...</div>}>
          <SwarmVisualizer />
        </Suspense>
      ),
    },
    {
        label: 'Health',
        content: (
            <Suspense fallback={<div>Loading...</div>}>
                <ToolHealthMonitor healthData={healthData} />
            </Suspense>
        )
    },
    {
        label: 'Files',
        content: (
            <Suspense fallback={<div>Loading...</div>}>
                <CodeBrowser
                    files={systemState.files}
                    onFileSelect={handleFileSelect}
                    selectedFile={systemState.selectedFile}
                    isLoading={systemState.isFileListLoading}
                    error={systemState.filesError}
                />
            </Suspense>
        )
    },
    {
        label: 'Viewer',
        content: (
            <Suspense fallback={<div>Loading...</div>}>
                <FileViewer
                    filePath={systemState.selectedFile}
                    content={systemState.fileContent}
                    isLoading={systemState.isFileContentLoading}
                />
            </Suspense>
        )
    }
  ];

  return (
    <div className="dark">
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

        <Layout sidebar={sidebarContent} rightPanel={<Tabs tabs={rightPanelTabs} />}>
            <Suspense fallback={<div className="p-4">Loading Chat...</div>}>
                <ChatInterface
                    sendMessage={sendMessage}
                    engineStatus={systemState.project_status}
                    activeProject={systemState.project_path}
                    thoughtStream={thoughtStream}
                />
            </Suspense>
        </Layout>
    </div>
  );
};

export default Dashboard;
