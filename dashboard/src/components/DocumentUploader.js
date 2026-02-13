import React, { useState } from 'react';
import { Input } from './ui/input.jsx';
import { Button } from './ui/button.jsx';
import { cn } from '../lib/utils.js';
import { Upload, FileUp, CheckCircle2, AlertCircle } from 'lucide-react';

const DocumentUploader = ({ onUploadSuccess }) => {
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
        if (onUploadSuccess) onUploadSuccess(result);
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
    <div className="space-y-3 bg-zinc-900/30 p-3 rounded-lg border border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <FileUp className="w-4 h-4 text-blue-400" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Knowledge Ingestion</span>
      </div>
      <div className="flex gap-2">
          <Input
            type="file"
            onChange={handleFileChange}
            disabled={isLoading}
            className="text-xs bg-black/50 border-white/10 h-8 flex-grow cursor-pointer"
          />
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isLoading}
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-500 text-white gap-2 px-4 whitespace-nowrap"
          >
            {isLoading ? (
                <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <Upload className="w-3 h-3" />
                    <span>Upload & Process</span>
                </>
            )}
          </Button>
      </div>
      {message && (
        <div className={cn(
          "text-[10px] flex items-center gap-2 p-2 rounded bg-black/30",
          message.startsWith('Error') ? "text-red-400 border border-red-500/20" : "text-green-400 border border-green-500/20"
        )}>
          {message.startsWith('Error') ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          <span className="truncate">{message}</span>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;