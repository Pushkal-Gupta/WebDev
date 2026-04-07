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

// Definitive Clinical Hierarchy (400px H-gap, 300px V-gap)
const rigidGrid = {
  // Tier 1: Foundation (Y: 0)
  'arrays': { x: 300, y: 0 },
  'strings': { x: 700, y: 0 },

  // Tier 2: Linear Structures (Y: 300)
  'stack': { x: 100, y: 300 },
  'queue': { x: 500, y: 300 },
  'linkedlist': { x: 900, y: 300 },

  // Tier 3: Pattern Discovery (Y: 600)
  'two-pointers': { x: 100, y: 600 },
  'binary-search': { x: 500, y: 600 },
  'sliding-window': { x: 900, y: 600 },

  // Tier 4: Hierarchical Systems (Y: 900)
  'trees': { x: 0, y: 900 },
  'tries': { x: 350, y: 900 },
  'graphs': { x: 700, y: 900 },
  'heap': { x: 1050, y: 900 },

  // Tier 5: Recursive Optimization (Y: 1200)
  'recursion': { x: -100, y: 1200 },
  'dp': { x: 200, y: 1200 },
  'backtracking': { x: 500, y: 1200 },
  'greedy': { x: 800, y: 1200 },
  'intervals': { x: 1100, y: 1200 },

  // Tier 6: Expert Design (Y: 1500)
  '2d-dp': { x: 300, y: 1500 },
  'advanced-graphs': { x: 700, y: 1500 },

  // Tier 7: Mathematical Synthesis (Y: 1800)
  'math': { x: 100, y: 1800 },
  'bit-manipulation': { x: 500, y: 1800 },
  'geometry': { x: 900, y: 1800 }
};

const sideLabels = [
  { id: 'lbl-1', label: 'FOUNDATION', y: 15 },
  { id: 'lbl-2', label: 'LINEAR STRUCTURES', y: 265 },
  { id: 'lbl-3', label: 'PATTERN DISCOVERY', y: 515 },
  { id: 'lbl-4', label: 'HIERARCHICAL SYSTEMS', y: 765 },
  { id: 'lbl-5', label: 'RECURSIVE OPTIMIZATION', y: 1015 },
  { id: 'lbl-6', label: 'EXPERT DESIGN', y: 1265 },
  { id: 'lbl-7', label: 'MATHEMATICAL SYNTHESIS', y: 1515 }
];

export default function RoadmapView() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicProgress, setTopicProgress] = useState({});

  const nodeTypes = useMemo(() => ({ 
    custom: TopicNode,
    sectionHeader: ({ data }) => (
      <div className="side-label-node brand" style={{ fontSize: '11px', color: 'var(--text-dim)', letterSpacing: '3px', opacity: 0.5, textTransform: 'uppercase' }}>
        {data.label}
      </div>
    )
  }), []);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        const { data: topicsData } = await supabase.from('PGcode_topics').select('*');
        const { data: edgesData } = await supabase.from('PGcode_roadmap_edges').select('*');
        const { data: problemsData } = await supabase.from('PGcode_problems').select('id, topic_id, is_completed');

        // Pre-calculate progress for all topics
        const progressMap = {};
        if (problemsData) {
          problemsData.forEach(p => {
            if (!progressMap[p.topic_id]) progressMap[p.topic_id] = { total: 0, completed: 0 };
            progressMap[p.topic_id].total++;
            if (p.is_completed) progressMap[p.topic_id].completed++;
          });
        }
        setTopicProgress(progressMap);

        if (topicsData && topicsData.length > 0) {
          const filteredTopics = topicsData.filter(t => t.id !== 'first-order');

          const dbNodes = filteredTopics.map(t => ({
            id: t.id,
            type: 'custom',
            position: rigidGrid[t.id] || { x: 0, y: 0 },
            data: { 
              label: t.name,
              id: t.id,
              progress: progressMap[t.id] || { total: 0, completed: 0 }
            }
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
                   type: 'smoothstep',
                   style: { stroke: 'var(--accent)', strokeWidth: 1.5, opacity: 0.25 },
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

