import React from 'react';
import { Handle, Position } from 'reactflow';
import './TopicNode.css';

export default function TopicNode({ data }) {
  // Support the text breaking from DB ('Main Title\nSubtitle')
  const [mainTitle, subTitle] = (data.label || '').split('\n');
  const categoryClass = data.category ? data.category.toLowerCase() : 'default';

  return (
    <div className={`topic-node-container ${categoryClass}`}>
      <Handle type="target" position={Position.Top} className="handle" />
      
      <div className="topic-node-content">
        <span className="topic-node-title">{mainTitle}</span>
        {subTitle && <span className="topic-node-subtitle">{subTitle}</span>}
      </div>

      <Handle type="source" position={Position.Bottom} className="handle" />
      
      {/* Optional Side Label for Group/Phase (e.g., "Foundation") */}
      {data.group_name && (
        <div className="topic-group-label">{data.group_name}</div>
      )}
    </div>
  );
}
