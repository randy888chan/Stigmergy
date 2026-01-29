import React, { useState, useCallback } from 'react';
import { Button } from "./ui/button.jsx";
import { Input } from "./ui/input.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.jsx";
import path from 'path-browserify';
import authenticatedFetch from '../lib/api'; // Import the wrapper

export const ProjectSelector = ({ onProjectSelect }) => {
  const [basePath, setBasePath] = useState('~');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchProjects = useCallback(async () => {
    if (!basePath) {
      setError('Please provide a base path.');
      return;
    }
    setIsLoading(true);
    setError('');
    setProjects([]);
    setSelectedProject(null);

    try {
      // Use the authenticatedFetch wrapper for the API call
      const data = await authenticatedFetch(`/api/projects?basePath=${encodeURIComponent(basePath)}`);
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [basePath]);

  const handleSelectChange = (projectName) => {
    if (projectName) {
        const fullPath = path.join(basePath, projectName);
        setSelectedProject(fullPath);
        if (onProjectSelect) {
            onProjectSelect(fullPath);
        }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        placeholder="Base path for projects..."
        value={basePath}
        onChange={(e) => setBasePath(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && fetchProjects()}
        className="w-[250px]"
      />
      <Button onClick={fetchProjects} disabled={isLoading} data-testid="find-projects-button">
        {isLoading ? 'Loading...' : 'Find Projects'}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {projects.length > 0 && (
        <Select onValueChange={handleSelectChange} disabled={!projects.length}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project} value={project}>
                {project}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default ProjectSelector;
