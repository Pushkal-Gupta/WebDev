import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ReactFlow,
  Background, 
  Controls, 
  applyNodeChanges, 
  applyEdgeChanges,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { initialNodes, initialEdges } from '../data/problems';
import { supabase } from '../lib/supabase';
import TopicModal from './TopicModal';
import TopicNode from './TopicNode';

// Rigid Grid Positions to enforce horizontal hierarchy
const rigidGrid = {
  // Foundation
  'arrays': { x: 300, y: 0 },
  'strings': { x: 500, y: 0 },

  // Structures
  'stack': { x: 0, y: 180 },
  'queue': { x: 200, y: 180 },
  'linkedlist': { x: 400, y: 180 },
  'trees': { x: 600, y: 180 },
  'tries': { x: 800, y: 180 },

  // Algorithms
  'two-pointers': { x: 200, y: 360 },
  'binary-search': { x: 400, y: 360 },
  'sliding-window': { x: 600, y: 360 },

  // Advanced
  'graphs': { x: 300, y: 540 },
  'heap': { x: 500, y: 540 },

  // Optimization
  'dp': { x: 100, y: 720 },
  'backtracking': { x: 300, y: 720 },
  'greedy': { x: 500, y: 720 },
  'intervals': { x: 700, y: 720 },

  // Expert
  '2d-dp': { x: 300, y: 900 },
  'advanced-graphs': { x: 500, y: 900 },

  // First-Order
  'first-order': { x: 400, y: 1080 },
  'math': { x: 200, y: 1260 },
  'bit-manipulation': { x: 400, y: 1260 },
  'geometry': { x: 600, y: 1260 }
};

const sideLabels = [
  { id: 'lbl-foundation', label: 'FOUNDATION', y: 0 },
  { id: 'lbl-structures', label: 'STRUCTURES', y: 180 },
  { id: 'lbl-algorithms', label: 'ALGORITHMS', y: 360 },
  { id: 'lbl-advanced', label: 'ADVANCED STRUCTURES', y: 540 },
  { id: 'lbl-optimization', label: 'OPTIMIZATION', y: 720 },
  { id: 'lbl-expert', label: 'EXPERT', y: 900 },
  { id: 'lbl-synthesis', label: 'FIRST-ORDER THINKING', y: 1080 }
];

export default function RoadmapView() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const nodeTypes = useMemo(() => ({ 
    custom: TopicNode,
    label: ({ data }) => <div className="side-label-node">{data.label}</div>
  }), []);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        const { data: topicsData } = await supabase.from('PGcode_topics').select('*');
        const { data: edgesData } = await supabase.from('PGcode_roadmap_edges').select('*');

        const groupColors = {
          'Foundation': '#4285f4',
          'Structures': '#a142f4',
          'Algorithms': '#34a853',
          'Advanced': '#fbbc04',
          'Optimization': '#ea4335',
          'Expert': '#ea4335',
          'Synthesis': '#9aa0a6'
        };

        if (topicsData && topicsData.length > 0) {
          const dbNodes = topicsData.map(t => ({
            id: t.id,
            type: 'custom',
            // FORCE RIGID POSITIONING
            position: rigidGrid[t.id] || { x: 0, y: 0 },
            data: { 
              label: t.name,
              category: t.category,
              group_name: t.group_name
            },
            ...t
          }));

          // Add Background Labels
          const labelNodes = sideLabels.map(lbl => ({
            id: lbl.id,
            type: 'label',
            position: { x: -250, y: lbl.y + 10 },
            data: { label: lbl.label },
            draggable: false,
            selectable: false
          }));

          const dbEdges = (edgesData || []).map(e => {
            const sourceNode = topicsData.find(tn => tn.id === e.source);
            const color = sourceNode ? groupColors[sourceNode.group_name] : '#b0b8c4';
            return {
              id: e.id,
              source: e.source,
              target: e.target,
              type: 'straight',
              animated: false,
              style: { stroke: color, strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color }
            };
          });

          setNodes([...labelNodes, ...dbNodes]);
          setEdges(dbEdges);
        }
      } catch (err) {
        console.error("Error fetching roadmap:", err);
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
    if (node.type === 'custom') setSelectedTopic(node);
  };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 70px)', background: '#fafbfc' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
      >
        <Background color="#eee" gap={20} />
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

