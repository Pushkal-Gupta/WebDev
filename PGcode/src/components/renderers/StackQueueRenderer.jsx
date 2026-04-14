import React from 'react';
import './Renderers.css';

export default function StackQueueRenderer({ data }) {
  const { type = 'stack', items = [], operation } = data;
  const isStack = type === 'stack';

  return (
    <div className="sq-renderer">
      {operation && (
        <div className="sq-operation">{operation}</div>
      )}

      {isStack ? (
        /* Stack: vertical, bottom-up */
        <div className="sq-stack">
          <div className="sq-stack-label">TOP</div>
          <div className="sq-stack-items">
            {[...items].reverse().map((item, idx) => (
              <div
                key={idx}
                className={`sq-item ${idx === 0 ? 'sq-item-top' : ''}`}
              >
                {item}
              </div>
            ))}
            {items.length === 0 && (
              <div className="sq-empty">empty</div>
            )}
          </div>
          <div className="sq-stack-base"></div>
        </div>
      ) : (
        /* Queue: horizontal, left-to-right */
        <div className="sq-queue">
          <div className="sq-queue-label sq-front">FRONT</div>
          <div className="sq-queue-items">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={`sq-item ${idx === 0 ? 'sq-item-front' : ''} ${idx === items.length - 1 ? 'sq-item-back' : ''}`}
              >
                {item}
              </div>
            ))}
            {items.length === 0 && (
              <div className="sq-empty">empty</div>
            )}
          </div>
          <div className="sq-queue-label sq-back">BACK</div>
        </div>
      )}
    </div>
  );
}
