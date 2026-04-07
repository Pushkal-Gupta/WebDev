import React from 'react';
import { Handle, Position } from 'reactflow';
import './TopicNode.css';

const topicMetadata = {
  'arrays': { num: '01' },
  'strings': { num: '02' },
  'stack': { num: '03' },
  'queue': { num: '04' },
  'linkedlist': { num: '05' },
  'trees': { num: '06' },
  'recursion': { num: '07' },
  'two-pointers': { num: '08' },
  'binary-search': { num: '09' },
  'sliding-window': { num: '10' },
  'graphs': { num: '11' },
  'tries': { num: '12' },
  'heap': { num: '13' },
  'dp': { num: '14', star: true },
  'backtracking': { num: '15', star: true },
  'greedy': { num: '16' },
  'intervals': { num: '17' },
  '2d-dp': { num: '18' },
  'advanced-graphs': { num: '19' },
  'math': { num: '20' },
  'bit-manipulation': { num: '21' },
  'geometry': { num: '22' }
};

export default function TopicNode({ data }) {
  const parts = (data.label || '').split(/\\n|\n/);
  const mainTitle = parts[0].trim();
  
  const meta = topicMetadata[data.id] || { num: '??' };

  return (
    <div className="topic-node-container">
      <Handle type="target" position={Position.Top} className="handle" />
      
      <div className="topic-node-content">
        <div className="topic-node-header">
           <span className="topic-node-num">{meta.num}</span>
           {meta.star && <span className="topic-node-star">★</span>}
        </div>
        <span className="topic-node-title">{mainTitle}</span>
        <div className="topic-node-progress" />
      </div>

      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}
