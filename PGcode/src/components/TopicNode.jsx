import React from 'react';
import { Handle, Position } from 'reactflow';
import './TopicNode.css';

export default function TopicNode({ data }) {
  // Take the main title and parse the rest as tags
  const parts = (data.label || '').split('\n');
  const mainTitle = parts[0];
  const tags = parts.length > 1 
    ? parts.slice(1).join(',').split(',').map(t => t.trim()).filter(Boolean)
    : [];
    
  const categoryClass = data.category ? data.category.toLowerCase() : 'default';

  return (
    <div className={`topic-node-container ${categoryClass}`}>
      <Handle type="target" position={Position.Top} className="handle" />
      
      <div className="topic-node-content">
        <span className="topic-node-title">{mainTitle}</span>
        {tags.length > 0 && (
          <div className="topic-node-tags">
            {tags.map((tag, i) => (
              <span key={i} className="topic-node-tag-pill">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="handle" />
    </div>
  );
}
