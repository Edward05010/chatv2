import React, { useState, useEffect } from 'react';

const CircularClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secDeg = (time.getSeconds() / 60) * 360;
  const minDeg = ((time.getMinutes() + time.getSeconds() / 60) / 60) * 360;
  const hourDeg = ((time.getHours() % 12 + time.getMinutes() / 60) / 12) * 360;

  return (
    <div style={clockStyles.clockFace}>
      {/* Center Pin */}
      <div style={clockStyles.pin} />
      
      {/* Hour Hand */}
      <div style={{ ...clockStyles.hand, ...clockStyles.hourHand, transform: `translateX(-50%) rotate(${hourDeg}deg)` }} />
      
      {/* Minute Hand */}
      <div style={{ ...clockStyles.hand, ...clockStyles.minHand, transform: `translateX(-50%) rotate(${minDeg}deg)` }} />
      
      {/* Second Hand */}
      <div style={{ ...clockStyles.hand, ...clockStyles.secHand, transform: `translateX(-50%) rotate(${secDeg}deg)` }} />

      {/* Hour Markers (Strictly Inside) */}
      {[...Array(12)].map((_, i) => (
        <div key={i} style={{ ...clockStyles.markerContainer, transform: `rotate(${i * 30}deg)` }}>
          <div style={clockStyles.markerLine} />
        </div>
      ))}
    </div>
  );
};

const clockStyles = {
  clockFace: {
    width: '280px',
    height: '280px',
    borderRadius: '50%',
    border: '8px solid #1a1a1a',
    position: 'relative',
    backgroundColor: '#050505',
    boxShadow: 'inset 0 0 20px #000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pin: {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    zIndex: 10,
    border: '2px solid #000'
  },
  hand: {
    position: 'absolute',
    bottom: '50%',
    left: '50%',
    transformOrigin: 'bottom',
    borderRadius: '10px',
  },
  hourHand: { 
    width: '6px', 
    height: '70px', 
    backgroundColor: '#ffffff',
    zIndex: 3
  },
  minHand: { 
    width: '4px', 
    height: '100px', 
    backgroundColor: '#999999',
    zIndex: 4
  },
  secHand: { 
    width: '2px', 
    height: '115px', 
    backgroundColor: '#4CAF50',
    zIndex: 5
  },
  markerContainer: {
    position: 'absolute',
    inset: '10px', // This keeps the markers 10px away from the outer edge
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  markerLine: {
    width: '4px',
    height: '15px',
    backgroundColor: '#333',
    borderRadius: '2px'
  }
};

export default CircularClock;
