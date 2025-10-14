import React, { useState } from 'react';
import path from 'path-browserify';
import { Input } from "./ui/input.jsx";
import { Button } from "./ui/button.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select.jsx";

const ProjectSelector = ({ onProjectSelect }) => {
  const [basePath, setBasePath] = useState('~/');
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    setProjects([]);

    try {
      const response = await fetch(`/api/projects?basePath=${encodeURIComponent(basePath)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch projects');
      }
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (projectName) => {
    if (projectName) {
      const fullPath = path.join(basePath, projectName);
      onProjectSelect(fullPath);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="text"
        placeholder="Base path (e.g., ~/Projects)"
        value={basePath}
        onChange={(e) => setBasePath(e.target.value)}
        className="w-[250px]"
      />
      <Button onClick={handleSearch} disabled={isLoading}>
        {isLoading ? 'Searching...' : 'Search Projects'}
      </Button>
      <Select onValueChange={handleSelect} disabled={projects.length === 0}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          {error && <p className="text-red-500 p-2">{error}</p>}
          {projects.length > 0 ? (
            projects.map((project) => (
              <SelectItem key={project} value={project}>
                {project}
              </SelectItem>
            ))
          ) : (
            !isLoading && <p className="p-2 text-muted-foreground">No projects found.</p>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectSelector;