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

export default function RoadmapView() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const nodeTypes = useMemo(() => ({ custom: TopicNode }), []);

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
          const nodeMap = Object.fromEntries(topicsData.map(t => [t.id, t.group_name]));
          const groupColors = {
            'Foundation': '#4285f4',
            'Structures': '#a142f4',
            'Algorithms': '#34a853',
            'Advanced': '#fbbc04',
            'Optimization': '#ea4335',
            'Expert': '#ea4335',
            'Synthesis': '#9aa0a6'
          };
          const dbNodes = topicsData.map(t => ({
            id: t.id,
            type: 'custom',
            position: { x: (Number(t.position_x) || 0) * 1.5, y: (Number(t.position_y) || 0) * 1.2 },
            data: { 
              label: t.name,
              category: t.category,
              group_name: t.group_name
            },
            ...t // keep row data for topic modal
          }));
          const dbEdges = (edgesData || []).map(e => {
            const color = groupColors[nodeMap[e.source]] || '#b0b8c4';
            return {
              id: e.id,
              source: e.source,
              target: e.target,
              type: 'straight',
              animated: false,
              style: { stroke: color, strokeWidth: 1.5 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: color,
              },
            };
          });
          setNodes(dbNodes);
          setEdges(dbEdges);
        } else {
          // Fallback to static if no data in DB yet
          const initialNodesScaled = initialNodes.map(n => ({
            ...n,
            position: { x: n.position.x * 1.5, y: n.position.y * 1.2 }
          }));
          const initialEdgesStyled = initialEdges.map(e => ({
            ...e,
            type: 'straight',
            animated: false,
            style: { stroke: '#b0b8c4', strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#b0b8c4' }
          }));
          setNodes(initialNodesScaled);
          setEdges(initialEdgesStyled);
        }
      } catch (err) {
        console.error("Error fetching roadmap from Supabase:", err);
        const initialNodesScaled = initialNodes.map(n => ({
          ...n,
          position: { x: n.position.x * 1.5, y: n.position.y * 1.2 }
        }));
        const initialEdgesStyled = initialEdges.map(e => ({
          ...e,
          type: 'straight',
          animated: false,
          style: { stroke: '#b0b8c4', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#b0b8c4' }
        }));
        setNodes(initialNodesScaled);
        setEdges(initialEdgesStyled);
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
      >
        <Background color="#ddd" gap={16} />
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
