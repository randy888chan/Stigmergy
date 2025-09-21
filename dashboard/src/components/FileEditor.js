import React, { useState } from 'react';

const FileEditor = () => {
  const [content, setContent] = useState('// File content will appear here\nconsole.log("Hello Stigmergy!");');
  const [fileName, setFileName] = useState('example.js');

  const handleSave = () => {
    // In a real implementation, this would save the file
    alert(`Saved ${fileName}`);
  };

  return (
    <div className="file-editor">
      <div className="editor-header">
        <input 
          type="text" 
          value={fileName} 
          onChange={(e) => setFileName(e.target.value)} 
          className="file-name-input"
        />
        <button onClick={handleSave} className="save-button">Save</button>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="editor-textarea"
        spellCheck="false"
      />
    </div>
  );
};

export default FileEditor;