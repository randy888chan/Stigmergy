import React, { useState } from 'react';
import { FiFolder, FiFile, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import './CodeBrowser.css';

const CodeBrowser = ({ fileStructure = [] }) => {
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    // In a real implementation, this would fetch the file content from an API
    setFileContent(`// Content for ${file.name} would be displayed here.`);
  };

  const renderFileTree = (items, basePath = '') => {
    return items.map((item, index) => {
      const currentPath = basePath ? `${basePath}/${item.name}` : item.name;
      
      if (item.type === 'folder') {
        const isExpanded = expandedFolders[currentPath];
        return (
          <div key={currentPath} className="tree-item">
            <div 
              className="tree-folder"
              onClick={() => toggleFolder(currentPath)}
            >
              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
              <FiFolder className="folder-icon" />
              <span className="item-name">{item.name}</span>
            </div>
            {isExpanded && item.children && (
              <div className="tree-children">
                {renderFileTree(item.children, currentPath)}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div 
            key={currentPath} 
            className={`tree-item tree-file ${selectedFile === currentPath ? 'selected' : ''}`}
            onClick={() => handleFileSelect(currentPath)}
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

  return (
    <div className="code-browser-container">
      <h2>Code Browser</h2>
      
      <div className="code-browser-content">
        <div className="file-tree">
          <h3>File Structure</h3>
          <div className="tree-root">
            {renderFileTree(fileStructure)}
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
              <p>Select a file to view its content</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeBrowser;