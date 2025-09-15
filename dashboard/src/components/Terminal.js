import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import './Terminal.css';

const Terminal = () => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Create terminal instance
    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#3a3d41'
      },
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      rows: 20,
      cols: 80
    });

    // Create fit addon
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // Store references
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Open terminal in container
    term.open(terminalRef.current);
    fitAddon.fit();

    // Add welcome message
    term.writeln('\x1b[1;32mWelcome to Stigmergy Terminal\x1b[0m');
    term.writeln('\x1b[1;34mType "help" for available commands\x1b[0m');
    term.writeln('');

    // Handle resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Simulate command processing
    term.onData((data) => {
      // Handle special keys
      if (data === '\r') { // Enter key
        term.write('\r\n');
        // In a real implementation, this would send the command to the backend
        term.write('\x1b[1;32m$\x1b[0m ');
      } else if (data === '\u007F') { // Backspace
        term.write('\b \b');
      } else {
        term.write(data);
      }
    });

    // Set initial prompt
    term.write('\x1b[1;32m$\x1b[0m ');

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  // Handle terminal connection status
  const toggleConnection = () => {
    if (isConnected) {
      setIsConnected(false);
      if (xtermRef.current) {
        xtermRef.current.writeln('\x1b[1;31mDisconnected from terminal\x1b[0m');
      }
    } else {
      setIsConnected(true);
      if (xtermRef.current) {
        xtermRef.current.writeln('\x1b[1;32mConnected to terminal\x1b[0m');
      }
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <h3>Terminal</h3>
        <button 
          className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}
          onClick={toggleConnection}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </button>
      </div>
      <div className="terminal-wrapper" ref={terminalRef}></div>
      <div className="terminal-toolbar">
        <button className="toolbar-button" onClick={() => {
          if (xtermRef.current) {
            xtermRef.current.clear();
            xtermRef.current.write('\x1b[1;32m$\x1b[0m ');
          }
        }}>
          Clear
        </button>
        <button className="toolbar-button" onClick={() => {
          if (xtermRef.current) {
            xtermRef.current.writeln('');
            xtermRef.current.writeln('\x1b[1;34mAvailable commands:\x1b[0m');
            xtermRef.current.writeln('  help     - Show this help');
            xtermRef.current.writeln('  status   - Show system status');
            xtermRef.current.writeln('  tasks    - List current tasks');
            xtermRef.current.writeln('  clear    - Clear terminal');
            xtermRef.current.writeln('  exit     - Exit terminal');
            xtermRef.current.writeln('');
            xtermRef.current.write('\x1b[1;32m$\x1b[0m ');
          }
        }}>
          Help
        </button>
      </div>
    </div>
  );
};

export default Terminal;