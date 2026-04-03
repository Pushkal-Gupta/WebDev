import React, { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow,
  Background, 
  Controls, 
  applyNodeChanges, 
  applyEdgeChanges 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { initialNodes, initialEdges } from '../data/problems';
import { supabase } from '../lib/supabase';
import TopicModal from './TopicModal';

export default function RoadmapView() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        const { data: topicsData, error: topicsError } = await supabase
          .from('PGcode_topics')
          .select('*');
        if (topicsError) throw topicsError;

        const { data: edgesData, error: edgesError } = await supabase
          .from('PGcode_roadmap_edges')
          .select('*');
        if (edgesError) throw edgesError;

        if (topicsData && topicsData.length > 0) {
          const dbNodes = topicsData.map(t => ({
            id: t.id,
            type: 'default',
            position: { x: Number(t.position_x) || 0, y: Number(t.position_y) || 0 },
            data: { label: t.name },
            ...t // keep row data for topic modal
          }));
          const dbEdges = (edgesData || []).map(e => ({
            id: e.id,
            source: e.source,
            target: e.target
          }));
          setNodes(dbNodes);
          setEdges(dbEdges);
        } else {
          // Fallback to static if no data in DB yet
          setNodes(initialNodes);
          setEdges(initialEdges);
        }
      } catch (err) {
        console.error("Error fetching roadmap from Supabase:", err);
        setNodes(initialNodes);
        setEdges(initialEdges);
      }
    }
    fetchRoadmap();
  }, []);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeClick = (event, node) => {
    setSelectedTopic(node);
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

      {selectedTopic && (
        <TopicModal 
          topic={selectedTopic} 
          onClose={() => setSelectedTopic(null)} 
        />
      )}
    </div>
  );
}
