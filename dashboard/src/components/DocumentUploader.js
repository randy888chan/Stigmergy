import React, { useState } from 'react';
import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';
import { cn } from '../lib/utils.js';

const DocumentUploader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage(''); // Clear previous messages
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setMessage('Uploading...');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Success: ${result.message}`);
        setSelectedFile(null); // Clear the file input
      } else {
        throw new Error(result.error || 'Unknown error occurred.');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="file"
        onChange={handleFileChange}
        disabled={isLoading}
        className="text-sm"
      />
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || isLoading}
        className="w-full"
      >
        {isLoading ? 'Uploading...' : 'Upload and Process'}
      </Button>
      {message && (
        <p className={cn(
          "text-sm text-center",
          message.startsWith('Error') ? "text-destructive" : "text-muted-foreground"
        )}>
          {message}
        </p>
      )}
    </div>
  );
};

export default DocumentUploader;