import React, { useState, useEffect, useRef } from 'react';

const SwarmVisualizer = ({ data }) => {
    const canvasRef = useRef(null);
    const [graph, setGraph] = useState({ nodes: {}, edges: [] });

    useEffect(() => {
        if (data) {
            try {
                const event = data; // Assuming data is already parsed as per useWebSocket hook
                if (event.type === 'agent_delegation' && event.payload) {
                    const { sourceAgentId, targetAgentId } = event.payload;
                    setGraph(prevGraph => {
                        const newNodes = { ...prevGraph.nodes };
                        if (!newNodes[sourceAgentId]) {
                            newNodes[sourceAgentId] = { id: sourceAgentId, x: Math.random() * 500 + 50, y: Math.random() * 300 + 50 };
                        }
                        if (!newNodes[targetAgentId]) {
                            newNodes[targetAgentId] = { id: targetAgentId, x: Math.random() * 500 + 50, y: Math.random() * 300 + 50 };
                        }

                        const newEdges = [...prevGraph.edges];
                        const edgeId = `${sourceAgentId}->${targetAgentId}`;
                        if (!newEdges.find(e => e.id === edgeId)) {
                            newEdges.push({ id: edgeId, source: sourceAgentId, target: targetAgentId });
                        }

                        return { nodes: newNodes, edges: newEdges };
                    });
                }
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        }
    }, [data]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        context.clearRect(0, 0, canvas.width, canvas.height);

        // Draw edges
        context.strokeStyle = '#cccccc';
        context.lineWidth = 1;
        graph.edges.forEach(edge => {
            const sourceNode = graph.nodes[edge.source];
            const targetNode = graph.nodes[edge.target];
            if (sourceNode && targetNode) {
                context.beginPath();
                context.moveTo(sourceNode.x, sourceNode.y);
                context.lineTo(targetNode.x, targetNode.y);
                context.stroke();
            }
        });

        // Draw nodes
        context.fillStyle = '#4a90e2';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        Object.values(graph.nodes).forEach(node => {
            context.beginPath();
            context.arc(node.x, node.y, 20, 0, 2 * Math.PI);
            context.fill();
            context.fillStyle = 'white';
            context.font = '10px sans-serif';
            context.fillText(node.id.replace('@', ''), node.x, node.y);
            context.fillStyle = '#4a90e2';
        });

    }, [graph]);

    return (
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    );
};

export default SwarmVisualizer;
