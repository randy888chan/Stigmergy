import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea'; // Assuming a Textarea component exists or can be created

export const MissionBriefing = ({ setOpen }) => {
  const [missionTitle, setMissionTitle] = useState('');
  const [userStories, setUserStories] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/mission/briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          missionTitle,
          userStories,
          acceptanceCriteria,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit mission briefing.');
      }

      const result = await response.json();
      setSuccess(result.message);
      // Clear form on success
      setMissionTitle('');
      setUserStories('');
      setAcceptanceCriteria('');
      // Close dialog after a delay
      setTimeout(() => {
        if (setOpen) {
          setOpen(false);
        }
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Mission Briefing</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="missionTitle" className="block text-sm font-medium text-gray-700">
              Mission Title
            </label>
            <Input
              id="missionTitle"
              value={missionTitle}
              onChange={(e) => setMissionTitle(e.target.value)}
              placeholder="e.g., Implement User Authentication"
              required
            />
          </div>
          <div>
            <label htmlFor="userStories" className="block text-sm font-medium text-gray-700">
              User Stories
            </label>
            <Textarea
              id="userStories"
              value={userStories}
              onChange={(e) => setUserStories(e.target.value)}
              placeholder="As a user, I want to be able to..."
              required
              rows={5}
            />
          </div>
          <div>
            <label htmlFor="acceptanceCriteria" className="block text-sm font-medium text-gray-700">
              Key Acceptance Criteria
            </label>
            <Textarea
              id="acceptanceCriteria"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              placeholder="- A new user can register for an account.\n- A registered user can log in."
              required
              rows={5}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Mission'}
            </Button>
          </div>
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-4 text-sm text-green-600">{success}</p>}
      </CardContent>
    </Card>
  );
};
