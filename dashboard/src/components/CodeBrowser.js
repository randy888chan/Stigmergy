import React, { useState, useEffect } from 'react';
import { FiFolder, FiFile } from 'react-icons/fi';
import './CodeBrowser.css';

const CodeBrowser = ({ activeProject }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeProject) {
      setFiles([]);
      return;
    }

    const fetchFiles = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/files');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (Array.isArray(data)) {
          data.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
          });
          setFiles(data);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          console.error('API did not return a valid array:', data);
          setFiles([]);
        }
      } catch (e) {
        console.error('Failed to fetch files:', e);
        setError(e.message);
        setFiles([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFiles();
  }, [activeProject]);

  const handleFileSelect = (file) => {
    setSelectedFile(file.name);
    setFileContent(`// In a real app, content for ${file.name} would be fetched here.`);
  };

  const renderFileTree = (items) => {
    return items.map((item) => {
      if (item.type === 'folder') {
        return (
          <div key={item.name} className="tree-item">
            <div className="tree-folder">
              <FiFolder className="folder-icon" />
              <span className="item-name">{item.name}</span>
            </div>
          </div>
        );
      } else {
        return (
          <div 
            key={item.name}
            className={`tree-item tree-file ${selectedFile === item.name ? 'selected' : ''}`}
            onClick={() => handleFileSelect(item)}
          >
            <div className="tree-file-content">
              <FiFile className="file-icon" />
              <span className="item-name">{item.name}</span>
            </div>
          </div>
        );
      }
    });
  };

  const renderContent = () => {
    if (!activeProject) {
      return <p className="info-message">Please set an active project to browse files.</p>;
    }
    if (isLoading) {
      return <p className="info-message">Loading files...</p>;
    }
    if (error) {
      return <p className="error-message">Error: {error}</p>;
    }
    if (files.length === 0) {
      return <p className="info-message">No files found in the project root.</p>;
    }
    return renderFileTree(files);
  };

  return (
    <div className="code-browser-container">
      <h2>Code Browser</h2>
      <div className="code-browser-content">
        <div className="file-tree">
          <h3>File Structure</h3>
          <div className="tree-root">
            {renderContent()}
          </div>
        </div>
        <div className="file-viewer">
          <h3>File Content</h3>
          {selectedFile ? (
            <div className="file-content">
              <div className="file-header">
                <span className="file-path">{selectedFile}</span>
              </div>
              <pre className="file-content-text">{fileContent}</pre>
              <div className="file-actions">
                <button className="file-action-button">Edit</button>
                <button className="file-action-button">Save</button>
                <button className="file-action-button">Download</button>
              </div>
            </div>
          ) : (
            <div className="no-file-selected">
              <p>Select a file to view its content.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeBrowser;