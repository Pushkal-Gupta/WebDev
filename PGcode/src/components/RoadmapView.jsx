import React, { useState, useCallback } from 'react';
import { 
  ReactFlow,
  Background, 
  Controls, 
  applyNodeChanges, 
  applyEdgeChanges 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { initialNodes, initialEdges } from '../data/problems';
import { useNavigate } from 'react-router-dom';

export default function RoadmapView() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const navigate = useNavigate();

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeClick = (event, node) => {
    navigate(`/category/${node.id}`);
  };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 70px)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
      >
        <Background color="var(--border)" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
