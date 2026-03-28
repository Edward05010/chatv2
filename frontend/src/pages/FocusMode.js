import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const FocusMode = () => {
  const [time, setTime] = useState(25 * 60);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSound, setSelectedSound] = useState(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [sessionType, setSessionType] = useState('focus');
  const [isDragging, setIsDragging] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [minutesAccumulated, setMinutesAccumulated] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let interval = null;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(time => time - 1);
      }, 1000);
    } else if (time === 0 && !sessionSaved) {
      handleSessionComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, time, sessionSaved]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleSessionComplete = async () => {
    if (sessionSaved) return;
    setIsRunning(false);
    if (sessionType === 'focus') {
      setSessionSaved(true);
      try {
        const token = localStorage.getItem('token');
        const minutesCompleted = Math.floor(totalTime / 60);
        const minutesToSave = minutesCompleted - minutesAccumulated;
        if (minutesToSave >= 1) {
          await axios.post('https://chatv2-i91j.onrender.com/api/study-session', {
            minutes: minutesToSave,
            date: new Date()
          }, { headers: { 'Authorization': `Bearer ${token}` } });
        }
        await axios.post('https://chatv2-i91j.onrender.com/api/notifications', {
          text: `Great job! You completed a ${minutesCompleted} minute focus session`,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }, { headers: { 'Authorization': `Bearer ${token}` } });
      } catch (error) {
        console.error('Error saving session:', error);
        setSessionSaved(false);
      }
    }
  };

  const toggleTimer = async () => {
    if (isRunning) {
      const totalElapsedMinutes = Math.floor((totalTime - time) / 60);
      const newMinutes = totalElapsedMinutes - minutesAccumulated;
      if (newMinutes >= 1 && sessionType === 'focus') {
        try {
          const token = localStorage.getItem('token');
          await axios.post('https://chatv2-i91j.onrender.com/api/study-session', {
            minutes: newMinutes,
            date: new Date()
          }, { headers: { 'Authorization': `Bearer ${token}` } });
          await axios.post('https://chatv2-i91j.onrender.com/api/notifications', {
            text: `You studied for ${totalElapsedMinutes} minute${totalElapsedMinutes > 1 ? 's' : ''} so far`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }, { headers: { 'Authorization': `Bearer ${token}` } });
          setMinutesAccumulated(totalElapsedMinutes);
        } catch (error) {
          console.error('Error saving partial session:', error);
        }
      }
    }
    setIsRunning(prev => !prev);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTime(totalTime);
    setSessionSaved(false);
    setMinutesAccumulated(0);
  };

  const handleSoundClick = (soundId) => {
    if (selectedSound === soundId) {
      if (isMusicPlaying) {
        audioRef.current?.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
        setIsMusicPlaying(true);
      }
    } else {
      setSelectedSound(soundId);
      setIsMusicPlaying(true);
    }
  };

  useEffect(() => {
    if (selectedSound && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      if (isMusicPlaying) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
    }
  }, [selectedSound]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTimerDrag = (e) => {
    if (!isRunning && isDragging) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = timerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(clientY - centerY, clientX - centerX);
      let degrees = (angle * 180 / Math.PI + 90 + 360) % 360;
      const minutes = Math.max(1, Math.min(60, Math.round((degrees / 360) * 60)));
      const newTime = minutes * 60;
      setTime(newTime);
      setTotalTime(newTime);
      setSessionSaved(false);
      setMinutesAccumulated(0);
    }
  };

  const handleMouseDown = () => { if (!isRunning) setIsDragging(true); };
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleTimerDrag);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTimerDrag);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleTimerDrag);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTimerDrag);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, isRunning]);

  const progress = (totalTime / (60 * 60)) * 100;
  const timerSize = isMobile ? 220 : 280;
  const timerFontSize = isMobile ? '48px' : '64px';

  const sounds = [
    { id: 'rain',   name: 'Rain'   },
    { id: 'fire',   name: 'Fire'   },
    { id: 'lofi',   name: 'Lo-fi'  },
    { id: 'ocean',  name: 'Ocean'  },
    { id: 'forest', name: 'Forest' },
  ];

  const volumeSteps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const RainIcon   = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><line x1="8" y1="13" x2="8" y2="17"/><line x1="12" y1="15" x2="12" y2="19"/><line x1="16" y1="13" x2="16" y2="17"/></svg>);
  const FireIcon   = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>);
  const MusicIcon  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>);
  const OceanIcon  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 1.3 0 1.9-.5 2.5-1"/><path d="M2 17c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 1.3 0 1.9-.5 2.5-1"/></svg>);
  const ForestIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l4 7h-3v8h-2v-8H8l4-7z"/><path d="M8 13l3 5H9v4H7v-4H5l3-5z"/><path d="M16 13l3 5h-2v4h-2v-4h-2l3-5z"/></svg>);
  const PlayIcon   = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>);
  const PauseIcon  = () => (<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>);
  const ResetIcon  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>);

  const getSoundIcon = (soundId) => {
    switch (soundId) {
      case 'rain':   return <RainIcon />;
      case 'fire':   return <FireIcon />;
      case 'lofi':   return <MusicIcon />;
      case 'ocean':  return <OceanIcon />;
      case 'forest': return <ForestIcon />;
      default:       return <MusicIcon />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      padding: isMobile ? '16px 12px' : '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '16px' : '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontSize: isMobile ? '22px' : '28px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Focus Mode</h1>
        <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: '600', color: '#ffffff', backgroundColor: '#1a1a1a', padding: isMobile ? '8px 14px' : '10px 20px', borderRadius: '10px', border: '1px solid #333333' }}>
          🎯 Focus Session
        </div>
      </div>

      {/* Main content — stacks vertically on mobile */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: isMobile ? '20px' : '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        alignItems: isMobile ? 'start' : 'center',
      }}>

        {/* Timer section */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '16px' : '20px' }}>
          <div
            ref={timerRef}
            style={{ position: 'relative', width: timerSize, height: timerSize, display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <svg style={{ position: 'absolute', width: '100%', height: '100%' }} viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="85" fill="none" stroke="#2a2a2a" strokeWidth="14"/>
              <circle
                cx="100" cy="100" r="85" fill="none" stroke="#ffffff" strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 85}
                strokeDashoffset={2 * Math.PI * 85 * (1 - progress / 100)}
                transform="rotate(-90 100 100)"
                style={{ transition: isDragging ? 'none' : 'stroke-dashoffset 0.2s ease', cursor: isRunning ? 'default' : 'grab' }}
              />
              {isRunning && (
                <circle
                  cx="100" cy="100" r="85" fill="none" stroke="#ffffff" strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 85}
                  strokeDashoffset={2 * Math.PI * 85 * (1 - (time / totalTime))}
                  transform="rotate(-90 100 100)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              )}
            </svg>
            <div style={{ fontSize: timerFontSize, fontWeight: '700', color: '#ffffff', fontFamily: 'monospace', zIndex: 1 }}>
              {formatTime(time)}
            </div>
          </div>

          {!isRunning && (
            <div style={{ fontSize: '12px', color: '#666666', fontWeight: '500', textAlign: 'center', marginTop: '-8px' }}>
              {isMobile ? 'Drag circle to adjust time' : 'Drag circle to adjust time'}
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center' }}>
            <button onClick={resetTimer} style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#1a1a1a', color: '#ffffff', border: '1px solid #333333', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResetIcon />
            </button>
            <button onClick={toggleTimer} style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,255,255,0.1)' }}>
              {isRunning ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#666666', fontWeight: '500' }}>Duration</span>
              <span style={{ fontSize: '16px', color: '#ffffff', fontWeight: '600' }}>{Math.floor(totalTime / 60)} min</span>
            </div>
            {minutesAccumulated > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', color: '#666666', fontWeight: '500' }}>Saved</span>
                <span style={{ fontSize: '16px', color: '#4CAF50', fontWeight: '600' }}>{minutesAccumulated} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Sounds + Volume section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Ambient Sounds */}
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '14px', padding: isMobile ? '16px' : '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: 0 }}>Ambient Sounds</h3>
              {isMusicPlaying && selectedSound && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#aaaaaa', fontWeight: '500' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                  {sounds.find(s => s.id === selectedSound)?.name}
                </div>
              )}
            </div>
            <p style={{ fontSize: '11px', color: '#444444', margin: '0 0 14px', fontWeight: '400' }}>Click to play · Click again to pause</p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(5, 1fr)' : 'repeat(5, 1fr)',
              gap: isMobile ? '8px' : '10px',
            }}>
              {sounds.map(sound => {
                const isActive = selectedSound === sound.id;
                const isThisPlaying = isActive && isMusicPlaying;
                return (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundClick(sound.id)}
                    style={{
                      padding: isMobile ? '10px 4px' : '14px 8px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      position: 'relative',
                      backgroundColor: isActive ? '#1a1a1a' : '#0a0a0a',
                      border: isThisPlaying ? '2px solid #ffffff' : isActive ? '2px solid #555555' : '2px solid #1a1a1a',
                    }}
                  >
                    <div style={{ color: isActive ? '#ffffff' : '#666666', display: 'flex', alignItems: 'center' }}>
                      {getSoundIcon(sound.id)}
                    </div>
                    <span style={{ fontSize: isMobile ? '10px' : '11px', fontWeight: '500', color: isActive ? '#ffffff' : '#666666' }}>
                      {sound.name}
                    </span>
                    {isThisPlaying && (
                      <div style={{ position: 'absolute', top: '6px', right: '6px', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume */}
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '14px', padding: isMobile ? '16px' : '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: '500' }}>Volume</span>
              <span style={{ color: '#666666', fontSize: '13px', fontWeight: '600' }}>{volume}%</span>
            </div>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'flex-end', height: isMobile ? '60px' : '100px' }}>
              {volumeSteps.map(step => (
                <button
                  key={step}
                  onClick={() => setVolume(step)}
                  title={`${step}%`}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: '3px 3px 0 0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: volume >= step ? '#ffffff' : '#1a1a1a',
                    height: `${step}%`,
                    minHeight: '6px',
                  }}
                />
              ))}
            </div>
          </div>

        </div>
      </div>

      <audio ref={audioRef} loop>
        {selectedSound && <source src={`/sounds/${selectedSound}.mp3`} type="audio/mp3" />}
      </audio>
    </div>
  );
};

export default FocusMode;