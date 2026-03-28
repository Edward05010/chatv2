import React, { useState, useEffect } from 'react';

const CircularClock = ({ size = 280 }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secDeg = (time.getSeconds() / 60) * 360;
  const minDeg = ((time.getMinutes() + time.getSeconds() / 60) / 60) * 360;
  const hourDeg = ((time.getHours() % 12 + time.getMinutes() / 60) / 12) * 360;

  // Scale hand lengths relative to size
  const scale = size / 280;
  const hourLen   = Math.round(70  * scale);
  const minLen    = Math.round(100 * scale);
  const secLen    = Math.round(115 * scale);
  const borderW   = Math.max(3, Math.round(8 * scale));
  const pinSize   = Math.max(6, Math.round(12 * scale));

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: `${borderW}px solid #1a1a1a`,
      position: 'relative',
      backgroundColor: '#050505',
      boxShadow: 'inset 0 0 20px #000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      {/* Center Pin */}
      <div style={{
        position: 'absolute',
        width: pinSize,
        height: pinSize,
        backgroundColor: '#4CAF50',
        borderRadius: '50%',
        zIndex: 10,
        border: '2px solid #000',
      }} />

      {/* Hour Hand */}
      <div style={{
        position: 'absolute',
        bottom: '50%',
        left: '50%',
        width: `${Math.round(6 * scale)}px`,
        height: `${hourLen}px`,
        backgroundColor: '#ffffff',
        transformOrigin: 'bottom',
        borderRadius: '10px',
        zIndex: 3,
        transform: `translateX(-50%) rotate(${hourDeg}deg)`,
      }} />

      {/* Minute Hand */}
      <div style={{
        position: 'absolute',
        bottom: '50%',
        left: '50%',
        width: `${Math.round(4 * scale)}px`,
        height: `${minLen}px`,
        backgroundColor: '#999999',
        transformOrigin: 'bottom',
        borderRadius: '10px',
        zIndex: 4,
        transform: `translateX(-50%) rotate(${minDeg}deg)`,
      }} />

      {/* Second Hand */}
      <div style={{
        position: 'absolute',
        bottom: '50%',
        left: '50%',
        width: `${Math.max(1, Math.round(2 * scale))}px`,
        height: `${secLen}px`,
        backgroundColor: '#4CAF50',
        transformOrigin: 'bottom',
        borderRadius: '10px',
        zIndex: 5,
        transform: `translateX(-50%) rotate(${secDeg}deg)`,
      }} />

      {/* Hour Markers */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          inset: `${Math.round(10 * scale)}px`,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          transform: `rotate(${i * 30}deg)`,
        }}>
          <div style={{
            width: `${Math.round(4 * scale)}px`,
            height: `${Math.round(15 * scale)}px`,
            backgroundColor: '#333',
            borderRadius: '2px',
          }} />
        </div>
      ))}
    </div>
  );
};

export default CircularClock;