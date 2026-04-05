import React from 'react';
import { Handle, Position } from 'reactflow';
import './TopicNode.css';

export default function TopicNode({ data }) {
  // Take only the main title
  const [mainTitle] = (data.label || '').split('\n');
  const categoryClass = data.category ? data.category.toLowerCase() : 'default';

  return (
    <div className={`topic-node-container ${categoryClass}`}>
      <Handle type="target" position={Position.Top} className="handle" />
      
      <div className="topic-node-content">
        <span className="topic-node-title">{mainTitle}</span>
      </div>

      <div className="topic-node-progress-bg">
        <div className="topic-node-progress-fill"></div>
      </div>

      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}
