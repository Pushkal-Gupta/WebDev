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
import { X, ArrowRight } from 'lucide-react';
import TopicModal from './TopicModal';
import TopicNode from './TopicNode';
import SidePanel from './SidePanel';

// Original 7-tier layout (horizontal levels preserved, nodes shifted within levels for clean arrows)
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
  'binary-search': { x: 550, y: 600 },
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
  { id: 'lbl-1', label: 'FOUNDATION', y: 35 },
  { id: 'lbl-2', label: 'LINEAR STRUCTURES', y: 335 },
  { id: 'lbl-3', label: 'PATTERN DISCOVERY', y: 635 },
  { id: 'lbl-4', label: 'HIERARCHICAL SYSTEMS', y: 935 },
  { id: 'lbl-5', label: 'RECURSIVE OPTIMIZATION', y: 1235 },
  { id: 'lbl-6', label: 'EXPERT DESIGN', y: 1535 },
  { id: 'lbl-7', label: 'MATHEMATICAL SYNTHESIS', y: 1835 }
];

const tierGroups = {
  1: ['arrays', 'strings'],
  2: ['stack', 'queue', 'linkedlist'],
  3: ['two-pointers', 'binary-search', 'sliding-window'],
  4: ['trees', 'tries', 'graphs', 'heap'],
  5: ['recursion', 'dp', 'backtracking', 'greedy', 'intervals'],
  6: ['2d-dp', 'advanced-graphs'],
  7: ['math', 'bit-manipulation', 'geometry']
};

export default function RoadmapView({ roadmapMode, setRoadmapMode, session }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [topicProgress, setTopicProgress] = useState({});
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('pgcode_onboarded')
  );

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('pgcode_onboarded', '1');
  };

  const nodeTypes = useMemo(() => ({
    custom: TopicNode,
    sectionHeader: ({ data }) => (
      <div className="brand" style={{
        fontSize: '32px',
        fontWeight: '900',
        color: 'var(--text-main)',
        letterSpacing: '2px',
        opacity: 0.9,
        textTransform: 'uppercase',
        textAlign: 'left',
        width: '450px'
      }}>
        {data.label}
      </div>
    )
  }), []);

  useEffect(() => {
    async function fetchRoadmap() {
      try {
        const { data: topicsData } = await supabase.from('PGcode_topics').select('*');
        const { data: edgesData } = await supabase.from('PGcode_roadmap_edges').select('*');

        // Filter problems by roadmap mode
        let problemsQuery = supabase.from('PGcode_problems').select('id, topic_id, roadmap_set');
        const { data: problemsData } = await problemsQuery;

        // Filter based on roadmap mode
        const filteredProblems = (problemsData || []).filter(p => {
          if (roadmapMode === '200') {
            return p.roadmap_set === '200' || p.roadmap_set === 'both' || !p.roadmap_set;
          }
          if (roadmapMode === '300') {
            return p.roadmap_set === '200' || p.roadmap_set === '300' || p.roadmap_set === 'both' || !p.roadmap_set;
          }
          return true; // PGcode 500 shows all
        });

        // Calculate progress per topic
        const progressMap = {};
        filteredProblems.forEach(p => {
          if (!progressMap[p.topic_id]) progressMap[p.topic_id] = { total: 0, completed: 0 };
          progressMap[p.topic_id].total++;
        });

        // Fetch user progress if logged in
        if (session?.user) {
          const { data: userProgress } = await supabase
            .from('PGcode_user_progress')
            .select('problem_id, is_completed')
            .eq('user_id', session.user.id)
            .eq('is_completed', true);

          if (userProgress) {
            const completedSet = new Set(userProgress.map(p => p.problem_id));
            filteredProblems.forEach(p => {
              if (completedSet.has(p.id) && progressMap[p.topic_id]) {
                progressMap[p.topic_id].completed++;
              }
            });
          }
        }

        setTopicProgress(progressMap);

        if (topicsData && topicsData.length > 0) {
          const filteredTopics = topicsData.filter(t => t.id !== 'first-order');

          const dbNodes = filteredTopics.map(t => ({
            id: t.id,
            type: 'custom',
            position: rigidGrid[t.id] || { x: 0, y: 0 },
            data: {
              label: t.id === 'geometry' ? 'Geometry' : t.name,
              id: t.id,
              progress: progressMap[t.id] || { total: 0, completed: 0 }
            }
          }));

          const headerNodes = sideLabels.map(lbl => ({
            id: lbl.id,
            type: 'sectionHeader',
            position: { x: -500, y: lbl.y },
            data: { label: lbl.label },
            draggable: false,
            selectable: false
          }));

          // Bezier curves, only downward edges, muted styling
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
              style: { stroke: 'var(--text-dim)', strokeWidth: 1.5, opacity: 0.35 },
              markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-dim)' }
            }));

          // Orphan protection: connect nodes without incoming edges
          for (let t = 2; t <= 7; t++) {
            const currentTierNodes = tierGroups[t];
            const parentTierNodes = tierGroups[t - 1];
            if (!currentTierNodes || !parentTierNodes) continue;

            currentTierNodes.forEach(childId => {
              if (filteredTopics.some(ft => ft.id === childId) && !dbEdges.some(e => e.target === childId)) {
                let closestParent = parentTierNodes[0];
                let minDistance = Infinity;
                parentTierNodes.forEach(parentId => {
                  const dist = Math.abs((rigidGrid[parentId]?.x || 0) - (rigidGrid[childId]?.x || 0));
                  if (dist < minDistance) { minDistance = dist; closestParent = parentId; }
                });
                dbEdges.push({
                  id: `auto-edge-${closestParent}-${childId}`,
                  source: closestParent,
                  target: childId,
                  type: 'default',
                  style: { stroke: 'var(--text-dim)', strokeWidth: 1.5, opacity: 0.2 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--text-dim)' }
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
  }, [roadmapMode, session]);

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
    <div style={{ width: '100%', height: 'calc(100vh - 100px)', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {showOnboarding && (
        <div className="onboarding-hero">
          <div className="onboarding-content">
            <h2 className="onboarding-title">Master DSA from Scratch to Interview-Ready</h2>
            <p className="onboarding-desc">
              PGcode is a curated learning system -- not a problem dump. Start with <strong>PGcode 200</strong> to learn every pattern,
              then progress to <strong>300</strong> and <strong>500</strong> for interview mastery.
            </p>
            <div className="onboarding-actions">
              <button className="onboarding-cta" onClick={() => {
                dismissOnboarding();
                const arraysNode = nodes.find(n => n.id === 'arrays');
                if (arraysNode) setSelectedTopic(arraysNode);
              }}>
                Start with Arrays <ArrowRight size={14} />
              </button>
              <button className="onboarding-dismiss" onClick={dismissOnboarding}>I know my way around</button>
            </div>
          </div>
          <button className="onboarding-close" onClick={dismissOnboarding}><X size={16} /></button>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'row' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
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

      </div>

      <SidePanel session={session} roadmapMode={roadmapMode} setRoadmapMode={setRoadmapMode} />
      </div>

      {selectedTopic && (
        <TopicModal
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
          roadmapMode={roadmapMode}
          session={session}
        />
      )}
    </div>
  );
}
