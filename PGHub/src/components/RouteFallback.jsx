import React from 'react';
import './RouteFallback.css';

export default function RouteFallback() {
  return (
    <div className="route-fallback">
      <div className="route-fallback-inner">
        <div className="route-fallback-bar" />
        <div className="route-fallback-bar route-fallback-bar-half" />
        <div className="route-fallback-bar route-fallback-bar-third" />
      </div>
    </div>
  );
}
