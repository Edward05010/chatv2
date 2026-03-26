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
  const [minutesAccumulated, setMinutesAccumulated] = useState(0); // tracks total saved minutes across pauses
  const audioRef = useRef(null);
  const timerRef = useRef(null);

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
        // Use totalTime for full completion (timer hit 0)
        const minutesCompleted = Math.floor(totalTime / 60);
        // Only save the delta (minutes not yet saved via pauses)
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
      // --- PAUSING: save however many minutes were studied since last resume ---
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
    // Toggle running state (resume works naturally — no sessionSaved block needed)
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
      const rect = timerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
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
    }
    return () => {
      window.removeEventListener('mousemove', handleTimerDrag);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isRunning]);

  const progress = (totalTime / (60 * 60)) * 100;

  const sounds = [
    { id: 'rain',   name: 'Rain'   },
    { id: 'fire',   name: 'Fire'   },
    { id: 'lofi',   name: 'Lo-fi'  },
    { id: 'ocean',  name: 'Ocean'  },
    { id: 'forest', name: 'Forest' }
  ];

  const volumeSteps = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

  const RainIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
      <line x1="8" y1="13" x2="8" y2="17"/>
      <line x1="12" y1="15" x2="12" y2="19"/>
      <line x1="16" y1="13" x2="16" y2="17"/>
    </svg>
  );

  const FireIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  );

  const MusicIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );

  const OceanIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11c2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 1.3 0 1.9-.5 2.5-1"/>
      <path d="M2 17c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 2.5 0 2.5-2 5-2 2.5 0 2.5 2 5 2 1.3 0 1.9-.5 2.5-1"/>
    </svg>
  );

  const ForestIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l4 7h-3v8h-2v-8H8l4-7z"/>
      <path d="M8 13l3 5H9v4H7v-4H5l3-5z"/>
      <path d="M16 13l3 5h-2v4h-2v-4h-2l3-5z"/>
    </svg>
  );

  const PlayIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  );

  const PauseIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>
  );

  const ResetIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  );

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
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Focus Mode</h1>
        <div style={styles.sessionBadge}>🎯 Focus Session</div>
      </div>

      <div style={styles.mainContent}>
        {/* Left Side - Timer */}
        <div style={styles.leftSection}>
          <div ref={timerRef} style={styles.timerContainer} onMouseDown={handleMouseDown}>
            <svg style={styles.timerSvg} viewBox="0 0 200 200">
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
            <div style={styles.timerText}>{formatTime(time)}</div>
          </div>

          {!isRunning && (
            <div style={styles.dragHint}>Drag circle to adjust time</div>
          )}

          <div style={styles.controls}>
            <button onClick={resetTimer} style={styles.resetButton}><ResetIcon /></button>
            <button onClick={toggleTimer} style={styles.playButton}>
              {isRunning ? <PauseIcon /> : <PlayIcon />}
            </button>
          </div>

          <div style={styles.sessionInfo}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Duration</span>
              <span style={styles.infoValue}>{Math.floor(totalTime / 60)} min</span>
            </div>
            {minutesAccumulated > 0 && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Saved</span>
                <span style={{ ...styles.infoValue, color: '#4CAF50' }}>{minutesAccumulated} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Sounds & Volume */}
        <div style={styles.rightSection}>
          <div style={styles.soundSection}>
            <div style={styles.soundSectionHeader}>
              <h3 style={styles.sectionTitle}>Ambient Sounds</h3>
              {isMusicPlaying && selectedSound && (
                <div style={styles.nowPlaying}>
                  <span style={styles.nowPlayingDot} />
                  {sounds.find(s => s.id === selectedSound)?.name}
                </div>
              )}
            </div>
            <p style={styles.soundHint}>Click to play · Click again to pause</p>
            <div style={styles.soundGrid}>
              {sounds.map(sound => {
                const isActive = selectedSound === sound.id;
                const isThisPlaying = isActive && isMusicPlaying;
                return (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundClick(sound.id)}
                    style={{
                      ...styles.soundButton,
                      backgroundColor: isActive ? '#1a1a1a' : '#0a0a0a',
                      border: isThisPlaying
                        ? '2px solid #ffffff'
                        : isActive
                          ? '2px solid #555555'
                          : '2px solid #1a1a1a',
                    }}
                  >
                    <div style={{ ...styles.soundIcon, color: isActive ? '#ffffff' : '#666666' }}>
                      {getSoundIcon(sound.id)}
                    </div>
                    <span style={{ ...styles.soundName, color: isActive ? '#ffffff' : '#666666' }}>
                      {sound.name}
                    </span>
                    {isThisPlaying && <div style={styles.playingDot} />}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={styles.volumeSection}>
            <div style={styles.volumeHeader}>
              <span style={styles.volumeLabel}>Volume</span>
              <span style={styles.volumeValue}>{volume}%</span>
            </div>
            <div style={styles.volumeSteps}>
              {volumeSteps.map(step => (
                <button
                  key={step}
                  onClick={() => setVolume(step)}
                  style={{
                    ...styles.volumeStep,
                    backgroundColor: volume >= step ? '#ffffff' : '#1a1a1a',
                    height: `${step}%`
                  }}
                  title={`${step}%`}
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

const styles = {
  container: {
    height: '100vh',
    backgroundColor: '#000000',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#ffffff',
    margin: 0
  },
  sessionBadge: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#1a1a1a',
    padding: '10px 20px',
    borderRadius: '10px',
    border: '1px solid #333333'
  },
  mainContent: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden'
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  timerContainer: {
    position: 'relative',
    width: '280px',
    height: '280px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  timerSvg: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  timerText: {
    fontSize: '64px',
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'monospace',
    zIndex: 1
  },
  dragHint: {
    fontSize: '12px',
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: '-10px'
  },
  controls: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    justifyContent: 'center'
  },
  playButton: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(255,255,255,0.1)'
  },
  resetButton: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    border: '1px solid #333333',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
  },
  sessionInfo: {
    display: 'flex',
    gap: '32px',
    justifyContent: 'center'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px'
  },
  infoLabel: {
    fontSize: '13px',
    color: '#666666',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: '16px',
    color: '#ffffff',
    fontWeight: '600'
  },
  rightSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    height: '100%',
    maxHeight: '500px'
  },
  soundSection: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '14px',
    padding: '20px',
    flex: 1
  },
  soundSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0
  },
  nowPlaying: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#aaaaaa',
    fontWeight: '500'
  },
  nowPlayingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    animation: 'pulse 1.5s infinite'
  },
  soundHint: {
    fontSize: '11px',
    color: '#444444',
    margin: '0 0 14px',
    fontWeight: '400'
  },
  soundGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px'
  },
  soundButton: {
    padding: '14px 8px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    position: 'relative'
  },
  soundIcon: {
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s'
  },
  soundName: {
    fontSize: '11px',
    fontWeight: '500',
    transition: 'color 0.2s'
  },
  playingDot: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#ffffff'
  },
  volumeSection: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '14px',
    padding: '20px'
  },
  volumeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  volumeLabel: {
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '500'
  },
  volumeValue: {
    color: '#666666',
    fontSize: '13px',
    fontWeight: '600'
  },
  volumeSteps: {
    display: 'flex',
    gap: '5px',
    alignItems: 'flex-end',
    height: '100px'
  },
  volumeStep: {
    flex: 1,
    border: 'none',
    borderRadius: '3px 3px 0 0',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minHeight: '10%'
  }
};

export default FocusMode;
