import React, { useState } from 'react';

const DocumentUploader = () => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Upload documents for analysis.');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    setStatus('uploading');
    setMessage(`Uploading ${file.name}...`);

    try {
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(`Success: ${result.message} ${result.result.segmentCount} segments created.`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h3>Document Intelligence</h3>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFileChange} />
        <button type="submit" disabled={status === 'uploading'}>
          {status === 'uploading' ? 'Processing...' : 'Process Document'}
        </button>
      </form>
      <p>Status: {message}</p>
    </div>
  );
};

export default DocumentUploader;
