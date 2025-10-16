import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card.jsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion.jsx';
import { Button } from './ui/button.jsx';

const GovernanceDashboard = () => {
  const [proposals, setProposals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProposals = async () => {
    try {
      const response = await fetch('/api/proposals');
      const data = await response.json();
      setProposals(data);
    } catch (error) {
      console.error("Failed to fetch proposals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
    const interval = setInterval(fetchProposals, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleDecision = async (proposalId, decision) => {
    // This will be implemented in a future step
    console.log(`Decision: ${decision} for proposal ${proposalId}`);
  };

  if (isLoading) return <p>Loading proposals...</p>;

  return (
    <Card className="h-full w-full flex flex-col">
      <CardHeader>
        <CardTitle>System Governance</CardTitle>
        <CardDescription>Review and approve proposals from the @metis agent.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-auto">
        <Accordion type="single" collapsible>
          {proposals.length > 0 ? proposals.map(p => (
            <AccordionItem value={p.id} key={p.id}>
              <AccordionTrigger>{p.reason}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <p><strong>File:</strong> {p.file_path}</p>
                  <pre className="text-xs p-2 bg-muted rounded-md overflow-x-auto max-h-96">{p.new_content}</pre>
                  <div className="flex gap-2">
                    <Button onClick={() => handleDecision(p.id, 'approve')} size="sm">Approve</Button>
                    <Button onClick={() => handleDecision(p.id, 'reject')} variant="destructive" size="sm">Reject</Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )) : <p className="text-sm text-muted-foreground">No active proposals.</p>}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default GovernanceDashboard;