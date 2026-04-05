import React from 'react';
import { Handle, Position } from 'reactflow';
import './TopicNode.css';

export default function TopicNode({ data }) {
  // Take only the main title
  const parts = (data.label || '').split('\n');
  const mainTitle = parts[0];
    
  // Use group_name for color coding as it matches the flowchart layers perfectly
  const groupClass = data.group_name ? data.group_name.toLowerCase().replace(/\s+/g, '-') : 'default';

  return (
    <div className={`topic-node-container ${groupClass}`}>
      <Handle type="target" position={Position.Top} className="handle" />
      
      <div className="topic-node-content">
        <span className="topic-node-title">{mainTitle}</span>
      </div>

      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}
