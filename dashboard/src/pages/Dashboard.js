import React, { useState, useEffect, lazy, Suspense } from 'react';
import useWebSocket from '../hooks/useWebSocket.js';
import { cn } from "../lib/utils.js";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../components/ui/resizable.jsx";
import { Separator } from "../components/ui/separator.jsx";
import { Input } from "../components/ui/input.jsx";
import { Button } from "../components/ui/button.jsx";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card.jsx";

// Lazy-load components
const CodeBrowser = lazy(() => import('../components/CodeBrowser.js'));
const ActivityLog = lazy(() => import('../components/ActivityLog.js'));
const StateManagement = lazy(() => import('../components/StateManagement.js'));
const ChatInterface = lazy(() => import('../components/ChatInterface.js'));
const DocumentUploader = lazy(() => import('../components/DocumentUploader.js'));

const INITIAL_STATE = {
  logs: [],
  agentActivity: [],
  project_status: 'Idle',
  project_path: '',
  goal: '',
};

const Dashboard = () => {
  const { data, sendMessage } = useWebSocket('ws://localhost:3010/ws');
  const [systemState, setSystemState] = useState(INITIAL_STATE);
  const [projectPathInput, setProjectPathInput] = useState('');

  useEffect(() => {
    if (data) {
      const { type, payload } = data;
      switch (type) {
        case 'state_update':
          setSystemState(prevState => ({ ...prevState, ...payload }));
          break;
        case 'project_switched':
          setSystemState(prevState => ({
            ...INITIAL_STATE,
            project_path: payload.path,
            project_status: 'Project Set',
            logs: [`Project switched to ${payload.path}`],
          }));
          break;
        case 'log':
             setSystemState(prevState => ({ ...prevState, logs: [...prevState.logs.slice(-100), payload] }));
             break;
        case 'agent_start':
        case 'tool_start':
        case 'tool_end':
            setSystemState(prevState => ({ ...prevState, agentActivity: [...prevState.agentActivity.slice(-100), { type, ...payload }] }));
            break;
        default:
          // console.log("Received unhandled event type:", type);
          break;
      }
    }
  }, [data]);

  const handleSetProject = () => {
    if (projectPathInput) {
      sendMessage({ type: 'set_project', payload: { path: projectPathInput } });
    }
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Stigmergy</h1>
            <div className="flex items-center gap-2">
                <Input
                    type="text"
                    placeholder="Absolute path to your project..."
                    value={projectPathInput}
                    onChange={(e) => setProjectPathInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSetProject()}
                    className="w-[350px]"
                />
                <Button onClick={handleSetProject}>Set Active Project</Button>
            </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
            <span><b>Active Project:</b> {systemState.project_path || 'None'}</span>
            <Separator orientation="vertical" className="h-6" />
            <span><b>Status:</b> <span className="font-mono p-1 bg-muted rounded-md">{systemState.project_status || 'Idle'}</span></span>
        </div>
      </header>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-grow">

        {/* Left Panel: Code Browser and Chat */}
        <ResizablePanel defaultSize={50}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={65}>
                <Card className="h-full w-full rounded-none border-0 border-r border-b flex flex-col">
                    <CardHeader>
                        <CardTitle>Code Browser</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-auto">
                        <Suspense fallback={<div>Loading Code...</div>}>
                            {systemState.project_path ? <CodeBrowser activeProject={systemState.project_path} /> : <div className="text-muted-foreground">Set a project to see files.</div>}
                        </Suspense>
                    </CardContent>
                </Card>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35}>
                 <Card className="h-full w-full rounded-none border-0 border-r flex flex-col">
                    <CardHeader>
                        <CardTitle>Mission Control</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-y-auto p-4 space-y-4">
                       <Suspense fallback={<div>Loading Chat...</div>}>
                            <ChatInterface sendMessage={sendMessage} engineStatus={systemState.project_status} />
                        </Suspense>
                        <Separator />
                        <div>
                            <h3 className="text-sm font-medium mb-2">Document Intelligence</h3>
                            <Suspense fallback={<div>Loading Uploader...</div>}>
                                <DocumentUploader />
                            </Suspense>
                        </div>
                    </CardContent>
                </Card>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Logs and State */}
        <ResizablePanel defaultSize={50}>
            <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={65}>
                    <Card className="h-full w-full rounded-none border-0 border-b flex flex-col">
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-auto">
                            <Suspense fallback={<div>Loading Logs...</div>}>
                                <ActivityLog logs={systemState.logs} agentActivity={systemState.agentActivity} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={35}>
                    <Card className="h-full w-full rounded-none border-0 flex flex-col">
                        <CardHeader>
                            <CardTitle>System State</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow overflow-auto">
                             <Suspense fallback={<div>Loading State...</div>}>
                                <StateManagement state={systemState} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </ResizablePanel>
            </ResizablePanelGroup>
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
};

export default Dashboard;