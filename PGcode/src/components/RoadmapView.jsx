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
import { supabase } from '../lib/supabase';
import TopicModal from './TopicModal';
import TopicNode from './TopicNode';

// High-Density 7-Tier Hierarchy (Centered Symmetry)
const rigidGrid = {
  // Tier 1: Foundation (Y: 0)
  'arrays': { x: 250, y: 0 },
  'strings': { x: 650, y: 0 },

  // Tier 2: Basic Structures (Y: 200)
  'stack': { x: 100, y: 200 },
  'queue': { x: 450, y: 200 },
  'linkedlist': { x: 800, y: 200 },

  // Tier 3: Algorithms (Y: 400)
  'two-pointers': { x: 150, y: 400 },
  'binary-search': { x: 450, y: 400 },
  'sliding-window': { x: 750, y: 400 },

  // Tier 4: Advanced Structures (Y: 600)
  'trees': { x: 100, y: 600 },
  'tries': { x: 350, y: 600 },
  'graphs': { x: 600, y: 600 },
  'heap': { x: 850, y: 600 },

  // Tier 5: Optimization (Y: 800)
  // "Recursion can be an optimization of tree" -> Moved to Tie 5
  'recursion': { x: 50, y: 800 },
  'dp': { x: 250, y: 800 },
  'backtracking': { x: 450, y: 800 },
  'greedy': { x: 650, y: 800 },
  'intervals': { x: 850, y: 800 },

  // Tier 6: Expert (Y: 1000)
  '2d-dp': { x: 300, y: 1000 },
  'advanced-graphs': { x: 650, y: 1000 },

  // Tier 7: Synthesis (Y: 1200)
  'math': { x: 150, y: 1200 },
  'bit-manipulation': { x: 475, y: 1200 },
  'geometry': { x: 800, y: 1200 }
};

const sideLabels = [
  { id: 'lbl-1', label: 'FOUNDATION', y: 15 },
  { id: 'lbl-2', label: 'LINEAR STRUCTURES', y: 215 },
  { id: 'lbl-3', label: 'PATTERN DISCOVERY', y: 415 },
  { id: 'lbl-4', label: 'HIERARCHICAL SYSTEMS', y: 615 },
  { id: 'lbl-5', label: 'RECURSIVE OPTIMIZATION', y: 815 },
  { id: 'lbl-6', label: 'EXPERT DESIGN', y: 1015 },
  { id: 'lbl-7', label: 'MATHEMATICAL SYNTHESIS', y: 1215 }
];

export default function RoadmapView() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const nodeTypes = useMemo(() => ({ 
    custom: TopicNode,
    sectionHeader: ({ data }) => (
      <div className="side-label-node brand" style={{ fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '2px', opacity: 0.6 }}>
        {data.label}
      </div>
    )
  }), []);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        const { data: topicsData } = await supabase.from('PGcode_topics').select('*');
        const { data: edgesData } = await supabase.from('PGcode_roadmap_edges').select('*');

        if (topicsData && topicsData.length > 0) {
          const filteredTopics = topicsData.filter(t => t.id !== 'first-order');

          const dbNodes = filteredTopics.map(t => ({
            id: t.id,
            type: 'custom',
            position: rigidGrid[t.id] || { x: 0, y: 0 },
            data: { 
              label: t.name,
              category: t.category,
              group_name: t.group_name,
              id: t.id
            },
            ...t
          }));

          // Text-only Headers on the left
          const headerNodes = sideLabels.map(lbl => ({
            id: lbl.id,
            type: 'sectionHeader',
            position: { x: -200, y: lbl.y },
            data: { label: lbl.label },
            draggable: false,
            selectable: false
          }));

          // Tier-based Orphan Protection (Ensures every node is reachable)
          const tierGroups = {
            1: ['arrays', 'strings'],
            2: ['stack', 'queue', 'linkedlist'],
            3: ['two-pointers', 'binary-search', 'sliding-window'],
            4: ['trees', 'tries', 'graphs', 'heap'],
            5: ['recursion', 'dp', 'backtracking', 'greedy', 'intervals'],
            6: ['2d-dp', 'advanced-graphs'],
            7: ['math', 'bit-manipulation', 'geometry']
          };

          const dbEdges = (edgesData || [])
            .filter(e => {
              const sPos = rigidGrid[e.source];
              const tPos = rigidGrid[e.target];
              return sPos && tPos && sPos.y < tPos.y;
            })
            .map((e, idx) => ({
              id: `edge-${idx}`,
              source: e.source,
              target: e.target,
              type: 'default',
              animated: false,
              style: { stroke: 'var(--accent)', strokeWidth: 1.5, opacity: 0.3 },
              markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)' }
            }));

          // Process tiers from top-to-bottom to fix 'orphans'
          for (let t = 2; t <= 7; t++) {
            const currentTierNodes = tierGroups[t];
            const parentTierNodes = tierGroups[t - 1];

            currentTierNodes.forEach(childId => {
              // If node exists in filtered topics and has no incoming edge
              if (filteredTopics.some(ft => ft.id === childId) && !dbEdges.some(e => e.target === childId)) {
                // Find horizontally closest parent in the tier above
                let closestParent = parentTierNodes[0];
                let minDistance = Infinity;

                parentTierNodes.forEach(parentId => {
                  const dist = Math.abs((rigidGrid[parentId]?.x || 0) - (rigidGrid[childId]?.x || 0));
                  if (dist < minDistance) {
                    minDistance = dist;
                    closestParent = parentId;
                  }
                });

                // Inject the missing connection
                dbEdges.push({
                  id: `auto-edge-${closestParent}-${childId}`,
                  source: closestParent,
                  target: childId,
                  type: 'default',
                  style: { stroke: 'var(--accent)', strokeWidth: 1.5, opacity: 0.3 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)' }
                });
              }
            });
          }

          setNodes([...headerNodes, ...dbNodes]);
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
    <div style={{ width: '100%', height: 'calc(100vh - 70px)', background: 'var(--bg)' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.1}
      >
        <Background color="var(--border)" gap={24} size={1} />
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

