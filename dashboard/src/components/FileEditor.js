import React, { useState, useEffect, useRef } from 'react';
import { FiSave, FiFile, FiFolder, FiChevronRight, FiChevronDown, FiPlus, FiTrash2, FiRefreshCw, FiCopy, FiEdit } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './FileEditor.css';

const FileEditor = ({ state }) => {
  const [fileStructure, setFileStructure] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef(null);

  // Mock file structure - in a real implementation, this would come from an API
  useEffect(() => {
    loadFileStructure();
  }, []);

  // Load file structure
  const loadFileStructure = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would fetch from an API
      const mockFileStructure = [
        {
          name: 'src',
          type: 'folder',
          children: [
            {
              name: 'components',
              type: 'folder',
              children: [
                { name: 'Header.js', type: 'file' },
                { name: 'Footer.js', type: 'file' },
                { name: 'Sidebar.js', type: 'file' }
              ]
            },
            {
              name: 'pages',
              type: 'folder',
              children: [
                { name: 'Home.js', type: 'file' },
                { name: 'About.js', type: 'file' },
                { name: 'Contact.js', type: 'file' }
              ]
            },
            { name: 'App.js', type: 'file' },
            { name: 'index.js', type: 'file' }
          ]
        },
        {
          name: 'public',
          type: 'folder',
          children: [
            { name: 'index.html', type: 'file' },
            { name: 'favicon.ico', type: 'file' }
          ]
        },
        { name: 'package.json', type: 'file' },
        { name: 'README.md', type: 'file' }
      ];
      
      setFileStructure(mockFileStructure);
    } catch (error) {
      console.error('Failed to load file structure:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get language for syntax highlighting based on file extension
  const getLanguage = (fileName) => {
    if (!fileName) return 'text';
    
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
        return 'cpp';
      case 'c':
        return 'c';
      case 'php':
        return 'php';
      case 'sql':
        return 'sql';
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      default:
        return 'text';
    }
  };

  // Handle file selection
  const handleFileSelect = (filePath) => {
    // If there are unsaved changes, prompt user
    if (unsavedChanges && !window.confirm('You have unsaved changes. Are you sure you want to switch files?')) {
      return;
    }
    
    setSelectedFile(filePath);
    setIsEditing(false);
    setUnsavedChanges(false);
    
    // In a real implementation, this would fetch the file content from an API
    const extension = filePath.split('.').pop().toLowerCase();
    let mockContent = '';
    
    switch (extension) {
      case 'js':
        mockContent = `// Content of ${filePath}

import React from 'react';

function ExampleComponent() {
  const [count, setCount] = React.useState(0);
  
  const handleClick = () => {
    setCount(count + 1);
  };
  
  return (
    <div>
      <h1>Example Component</h1>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increment</button>
    </div>
  );
}

export default ExampleComponent;`;
        break;
      case 'html':
        mockContent = `<!-- Content of ${filePath} -->

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Hello, World!</h1>
    <p>This is a sample HTML file.</p>
  </div>
  
  <script src="script.js"></script>
</body>
</html>`;
        break;
      case 'css':
        mockContent = `/* Content of ${filePath} */

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #333;
  font-size: 2rem;
  margin-bottom: 1rem;
}

p {
  color: #666;
  line-height: 1.6;
}`;
        break;
      case 'json':
        mockContent = `{
  "name": "stigmergy",
  "version": "1.0.0",n  "description": "Content of ${filePath}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "dependencies": {
    "react": "^18.0.0"
  }
}`;
        break;
      case 'md':
        mockContent = `# Content of ${filePath}

## Introduction

This is a sample markdown file.

## Features

- Feature 1
- Feature 2
- Feature 3

## Usage

\`\`\`javascript
console.log('Hello, World!');
\`\`\``;
        break;
      default:
        mockContent = `// Content of ${filePath}

function example() {
  console.log('This is an example function');
  return 'Hello, World!';
}

export default example;`;
    }
    
    setFileContent(mockContent);
  };

  // Toggle folder expansion
  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Start editing mode
  const startEditing = () => {
    setIsEditing(true);
  };

  // Save file content
  const saveFile = async () => {
    if (!selectedFile) return;
    
    try {
      // In a real implementation, this would send the content to an API
      console.log('Saving file:', selectedFile);
      console.log('Content:', fileContent);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUnsavedChanges(false);
      setIsEditing(false);
      alert('File saved successfully!');
    } catch (error) {
      console.error('Failed to save file:', error);
      alert('Failed to save file: ' + error.message);
    }
  };

  // Handle content change
  const handleContentChange = (e) => {
    setFileContent(e.target.value);
    setUnsavedChanges(true);
  };

  // Create new file
  const createNewFile = async (folderPath) => {
    const fileName = prompt('Enter file name:');
    if (fileName) {
      try {
        // In a real implementation, this would create the file via an API
        console.log(`Creating new file: ${folderPath}/${fileName}`);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        alert(`New file created: ${folderPath}/${fileName}`);
        // Refresh file structure
        loadFileStructure();
      } catch (error) {
        console.error('Failed to create file:', error);
        alert('Failed to create file: ' + error.message);
      }
    }
  };

  // Create new folder
  const createNewFolder = async (folderPath) => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      try {
        // In a real implementation, this would create the folder via an API
        console.log(`Creating new folder: ${folderPath}/${folderName}`);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        alert(`New folder created: ${folderPath}/${folderName}`);
        // Refresh file structure
        loadFileStructure();
      } catch (error) {
        console.error('Failed to create folder:', error);
        alert('Failed to create folder: ' + error.message);
      }
    }
  };

  // Delete file or folder
  const deleteItem = async (itemPath, isFolder = false) => {
    const itemType = isFolder ? 'folder' : 'file';
    if (window.confirm(`Are you sure you want to delete ${itemType} ${itemPath}?`)) {
      try {
        // In a real implementation, this would delete the item via an API
        console.log(`Deleting ${itemType}: ${itemPath}`);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted: ${itemPath}`);
        
        // If the deleted item was selected, clear selection
        if (selectedFile === itemPath) {
          setSelectedFile(null);
          setFileContent('');
        }
        
        // Refresh file structure
        loadFileStructure();
      } catch (error) {
        console.error(`Failed to delete ${itemType}:`, error);
        alert(`Failed to delete ${itemType}: ` + error.message);
      }
    }
  };

  // Rename file or folder
  const renameItem = async (itemPath, isFolder = false) => {
    const itemType = isFolder ? 'folder' : 'file';
    const itemName = itemPath.split('/').pop();
    const newName = prompt(`Rename ${itemType}:`, itemName);
    
    if (newName && newName !== itemName) {
      try {
        // Calculate new path
        const pathParts = itemPath.split('/');
        pathParts[pathParts.length - 1] = newName;
        const newPath = pathParts.join('/');
        
        // In a real implementation, this would rename the item via an API
        console.log(`Renaming ${itemType}: ${itemPath} to ${newPath}`);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} renamed to: ${newName}`);
        
        // If the renamed item was selected, update selection
        if (selectedFile === itemPath) {
          setSelectedFile(newPath);
        }
        
        // Refresh file structure
        loadFileStructure();
      } catch (error) {
        console.error(`Failed to rename ${itemType}:`, error);
        alert(`Failed to rename ${itemType}: ` + error.message);
      }
    }
  };

  // Copy file or folder
  const copyItem = async (itemPath, isFolder = false) => {
    const itemType = isFolder ? 'folder' : 'file';
    const itemName = itemPath.split('/').pop();
    const copyName = prompt(`Copy ${itemType} as:`, `copy_of_${itemName}`);
    
    if (copyName) {
      try {
        // Calculate copy path
        const pathParts = itemPath.split('/');
        pathParts[pathParts.length - 1] = copyName;
        const copyPath = pathParts.join('/');
        
        // In a real implementation, this would copy the item via an API
        console.log(`Copying ${itemType}: ${itemPath} to ${copyPath}`);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        
        alert(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} copied as: ${copyName}`);
        
        // Refresh file structure
        loadFileStructure();
      } catch (error) {
        console.error(`Failed to copy ${itemType}:`, error);
        alert(`Failed to copy ${itemType}: ` + error.message);
      }
    }
  };

  // Render file tree
  const renderFileTree = (items, basePath = '') => {
    return items.map((item, index) => {
      const currentPath = basePath ? `${basePath}/${item.name}` : item.name;
      
      if (item.type === 'folder') {
        const isExpanded = expandedFolders[currentPath];
        return (
          <div key={currentPath} className="tree-item">
            <div className="tree-folder">
              <span 
                className="folder-toggle"
                onClick={() => toggleFolder(currentPath)}
              >
                {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
              </span>
              <FiFolder className="folder-icon" />
              <span 
                className="item-name"
                onClick={() => toggleFolder(currentPath)}
              >
                {item.name}
              </span>
              <div className="folder-actions">
                <span 
                  className="action-button"
                  onClick={() => createNewFile(currentPath)}
                  title="Create new file"
                >
                  <FiPlus />
                </span>
                <span 
                  className="action-button"
                  onClick={() => createNewFolder(currentPath)}
                  title="Create new folder"
                >
                  <FiFolder />
                </span>
                <span 
                  className="action-button"
                  onClick={() => renameItem(currentPath, true)}
                  title="Rename folder"
                >
                  <FiEdit />
                </span>
                <span 
                  className="action-button"
                  onClick={() => copyItem(currentPath, true)}
                  title="Copy folder"
                >
                  <FiCopy />
                </span>
                <span 
                  className="action-button delete-button"
                  onClick={() => deleteItem(currentPath, true)}
                  title="Delete folder"
                >
                  <FiTrash2 />
                </span>
              </div>
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
          >
            <div className="tree-file-content">
              <FiFile className="file-icon" />
              <span 
                className="item-name"
                onClick={() => handleFileSelect(currentPath)}
              >
                {item.name}
              </span>
              <div className="file-actions">
                <span 
                  className="action-button"
                  onClick={() => renameItem(currentPath)}
                  title="Rename file"
                >
                  <FiEdit />
                </span>
                <span 
                  className="action-button"
                  onClick={() => copyItem(currentPath)}
                  title="Copy file"
                >
                  <FiCopy />
                </span>
                <span 
                  className="action-button delete-button"
                  onClick={() => deleteItem(currentPath)}
                  title="Delete file"
                >
                  <FiTrash2 />
                </span>
              </div>
            </div>
          </div>
        );
      }
    });
  };

  // Get language for current file
  const currentLanguage = getLanguage(selectedFile);

  return (
    <div className="file-editor-container">
      <h2>File Editor</h2>
      
      <div className="file-editor-content">
        <div className="file-tree-panel">
          <div className="panel-header">
            <h3>Files</h3>
            <button 
              className="refresh-button"
              onClick={loadFileStructure}
              disabled={isLoading}
              title="Refresh file structure"
            >
              <FiRefreshCw className={isLoading ? 'spinning' : ''} />
            </button>
          </div>
          <div className="tree-root">
            {isLoading ? (
              <div className="loading">Loading file structure...</div>
            ) : (
              renderFileTree(fileStructure)
            )}
          </div>
        </div>
        
        <div className="editor-panel">
          <div className="editor-header">
            {selectedFile && (
              <>
                <div className="file-info">
                  <FiFile className="file-icon" />
                  <span className="file-path">{selectedFile}</span>
                  {unsavedChanges && <span className="unsaved-indicator">●</span>}
                </div>
                <div className="editor-actions">
                  {!isEditing ? (
                    <button 
                      className="editor-button edit-button"
                      onClick={startEditing}
                    >
                      Edit
                    </button>
                  ) : (
                    <button 
                      className="editor-button save-button"
                      onClick={saveFile}
                    >
                      <FiSave /> Save
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="editor-content">
            {selectedFile ? (
              <>
                {!isEditing ? (
                  <SyntaxHighlighter 
                    language={currentLanguage} 
                    style={oneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      height: '100%',
                      fontSize: '13px'
                    }}
                  >
                    {fileContent}
                  </SyntaxHighlighter>
                ) : (
                  <textarea
                    ref={editorRef}
                    className="file-content-editor"
                    value={fileContent}
                    onChange={handleContentChange}
                    spellCheck="false"
                  />
                )}
              </>
            ) : (
              <div className="no-file-selected">
                <p>Select a file to view and edit its content</p>
              </div>
            )}
          </div>
          
          {selectedFile && (
            <div className="editor-footer">
              <div className="editor-status">
                {isEditing ? 'Editing mode' : 'Preview mode'}
                {unsavedChanges && ' • Unsaved changes'}
                <span className="language-info">Language: {currentLanguage}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileEditor;