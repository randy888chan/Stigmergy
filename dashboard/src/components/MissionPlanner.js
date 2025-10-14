import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const MissionPlanner = () => {
    const [plan, setPlan] = useState({ tasks: [], message: 'Loading plan...' });
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPlan = async () => {
            try {
                const response = await fetch('/api/mission-plan');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setPlan(data);
            } catch (e) {
                console.error("Failed to fetch mission plan:", e);
                setError(e.message);
                setPlan({ tasks: [], message: 'Failed to load plan.' });
            }
        };

        const intervalId = setInterval(fetchPlan, 5000);
        fetchPlan(); // Initial fetch

        return () => clearInterval(intervalId);
    }, []);

    const getStatusVariant = (status) => {
        switch (status) {
            case 'COMPLETED':
                return 'success';
            case 'IN_PROGRESS':
                return 'default';
            case 'PENDING':
            default:
                return 'secondary';
        }
    };

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Mission Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">Error: {error}</p>
                </CardContent>
            </Card>
        );
    }

    if (!plan.tasks || plan.tasks.length === 0) {
         return (
            <Card>
                <CardHeader>
                    <CardTitle>Mission Plan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{plan.message || 'No tasks in the current plan.'}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mission Plan</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-[120px]">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plan.tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.id}</TableCell>
                                <TableCell>{task.description}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(task.status)}>
                                        {task.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};

export default MissionPlanner;