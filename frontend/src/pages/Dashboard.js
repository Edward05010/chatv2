import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import CircularClock from '../components/CircularClock';

// ── Achievement shape config ──────────────────────────────────────────────────
// Each milestone maps to a polygon with increasing sides
// 30min=pentagon(5), 1hr=hexagon(6), ... 300hr=circle(∞)
const ACHIEVEMENT_SHAPES = {
  30:    { sides: 5,  label: '30 min',  color: '#a0a0a0' }, // Pentagon   — silver
  60:    { sides: 6,  label: '1 hour',  color: '#89CFF0' }, // Hexagon    — baby blue
  300:   { sides: 7,  label: '5 hrs',   color: '#90EE90' }, // Heptagon   — light green
  600:   { sides: 8,  label: '10 hrs',  color: '#4CAF50' }, // Octagon    — green
  1500:  { sides: 9,  label: '25 hrs',  color: '#00BFFF' }, // Nonagon    — deep sky blue
  3000:  { sides: 10, label: '50 hrs',  color: '#9370DB' }, // Decagon    — purple
  4500:  { sides: 11, label: '75 hrs',  color: '#FF8C00' }, // Hendecagon — orange
  6000:  { sides: 12, label: '100 hrs', color: '#FFD700' }, // Dodecagon  — gold
  12000: { sides: 16, label: '200 hrs', color: '#FF4500' }, // 16-gon     — red-orange
  18000: { sides: 0,  label: '300 hrs', color: '#ffffff' }, // Circle (∞) — white/platinum
};

// Generate SVG points for a regular polygon centered at (cx,cy) with radius r
const polygonPoints = (sides, cx, cy, r) => {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const angle = (2 * Math.PI * i) / sides - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
};

// Renders the correct shape for a given milestone (minutes value)
const AchievementBadge = ({ milestoneMinutes }) => {
  const shape = ACHIEVEMENT_SHAPES[milestoneMinutes];
  if (!shape) return <DefaultDot />;

  const size = 36;
  const cx = size / 2;
  const cy = size / 2;
  const r  = size / 2 - 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0, filter: `drop-shadow(0 0 4px ${shape.color}55)` }}
    >
      {shape.sides === 0 ? (
        // Circle for 300 hrs (∞ sides)
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={shape.color}
          strokeWidth="2.5"
        />
      ) : (
        <polygon
          points={polygonPoints(shape.sides, cx, cy, r)}
          fill="none"
          stroke={shape.color}
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      )}
      {/* Small dot in center */}
      <circle cx={cx} cy={cy} r="2" fill={shape.color} />
    </svg>
  );
};

const DefaultDot = () => (
  <div style={{
    width: '8px', height: '8px',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    marginTop: '6px',
    flexShrink: 0
  }} />
);

// Parse notification text — returns { cleanText, milestoneMinutes | null }
const parseNotification = (text) => {
  const match = text.match(/\[ACHIEVEMENT:(\d+)\]$/);
  if (match) {
    return {
      cleanText: text.replace(/\s*\[ACHIEVEMENT:\d+\]$/, ''),
      milestoneMinutes: parseInt(match[1], 10)
    };
  }
  return { cleanText: text, milestoneMinutes: null };
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [studyData, setStudyData] = useState([]);
  const [timeFrame, setTimeFrame] = useState('week');
  const [notifications, setNotifications] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    loadTodos();
    loadStudyData();
    loadNotifications();
    const token = localStorage.getItem('token');
    socketRef.current = io('https://chatv2-i91j.onrender.com');
    socketRef.current.emit('authenticate', token);
    socketRef.current.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10));
    });
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => { loadStudyData(); }, [timeFrame]);

  const loadTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://chatv2-i91j.onrender.com/api/todos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTodos(response.data);
    } catch (error) { console.error(error); }
  };

  const loadStudyData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://chatv2-i91j.onrender.com/api/study-data?timeframe=${timeFrame}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStudyData(response.data);
    } catch (error) {
      const defaults = {
        week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        day: ['00h', '04h', '08h', '12h', '16h', '20h'],
        month: ['Week 1', 'Week 2', 'Week 3', 'Week 4']
      };
      setStudyData(defaults[timeFrame].map(l => ({ label: l, minutes: 0 })));
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://chatv2-i91j.onrender.com/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (error) { console.error(error); }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://chatv2-i91j.onrender.com/api/todos', { text: newTodo }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTodos([...todos, response.data]);
      setNewTodo('');
    } catch (error) { console.error(error); }
  };

  const toggleTodo = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const todo = todos.find(t => t._id === id);
      const response = await axios.put(`https://chatv2-i91j.onrender.com/api/todos/${id}`,
        { completed: !todo.completed },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setTodos(todos.map(t => t._id === id ? response.data : t));
    } catch (error) { console.error(error); }
  };

  const deleteTodo = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://chatv2-i91j.onrender.com/api/todos/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setTodos(todos.filter(t => t._id !== id));
    } catch (error) { console.error(error); }
  };

  const maxTime  = Math.max(...studyData.map(d => d.minutes)) || 4;
  const chartMax = Math.ceil(maxTime / 4) * 4;
  const yAxisLabels = [chartMax, (chartMax / 4) * 3, (chartMax / 4) * 2, chartMax / 4, 0];

  const PlusIcon  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);
  const CheckIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>);
  const TrashIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);
  const BellIcon  = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Dashboard</h1>
        <div style={styles.headerRight}><span style={styles.username}>Welcome back!</span></div>
      </div>

      <div style={styles.grid}>
        {/* To-Do */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>To-Do List</h2>
          <form onSubmit={addTodo} style={styles.todoForm}>
            <input type="text" value={newTodo} onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..." style={styles.todoInput} />
            <button type="submit" style={styles.addButton}><PlusIcon /></button>
          </form>
          <div style={styles.todoList}>
            {todos.map(todo => (
              <div key={todo._id} style={styles.todoItem}>
                <div style={styles.todoLeft}>
                  <button onClick={() => toggleTodo(todo._id)}
                    style={{ ...styles.checkbox, backgroundColor: todo.completed ? '#ffffff' : 'transparent' }}>
                    {todo.completed && <CheckIcon />}
                  </button>
                  <span style={{ ...styles.todoText, textDecoration: todo.completed ? 'line-through' : 'none', opacity: todo.completed ? 0.5 : 1 }}>
                    {todo.text}
                  </span>
                </div>
                <button onClick={() => deleteTodo(todo._id)} style={styles.deleteButton}><TrashIcon /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Notifications</h2>
            <BellIcon />
          </div>
          <div style={styles.notificationList}>
            {notifications.map((notif, index) => {
              const { cleanText, milestoneMinutes } = parseNotification(notif.text);
              const isAchievement = milestoneMinutes !== null;
              const shape = isAchievement ? ACHIEVEMENT_SHAPES[milestoneMinutes] : null;

              return (
                <div
                  key={notif._id || index}
                  style={{
                    ...styles.notificationItem,
                    // Subtle glow border for achievement notifications
                    border: isAchievement
                      ? `1px solid ${shape?.color || '#ffffff'}44`
                      : '1px solid #1a1a1a',
                    backgroundColor: isAchievement ? '#0d0d0d' : '#000'
                  }}
                >
                  {/* Left icon: SVG shape for achievements, green dot for regular */}
                  <div style={styles.notifIconWrap}>
                    {isAchievement
                      ? <AchievementBadge milestoneMinutes={milestoneMinutes} />
                      : <DefaultDot />
                    }
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isAchievement && (
                      <div style={{ ...styles.achievementLabel, color: shape?.color || '#ffffff' }}>
                        Achievement · {shape?.label}
                      </div>
                    )}
                    <p style={styles.notificationText}>{cleanText}</p>
                    <p style={styles.notificationTime}>{notif.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clock */}
        <div style={{ ...styles.card, display: 'flex', flexDirection: 'column' }}>
          <h2 style={styles.cardTitle}>Current Time</h2>
          <div style={styles.clockWrapper}>
            <CircularClock />
            <div style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Study Progress — full width */}
        <div style={{ ...styles.card, gridColumn: '1 / -1' }}>
          <div style={styles.graphHeader}>
            <h2 style={styles.cardTitle}>Study Progress</h2>
            <div style={styles.timeframeButtons}>
              {['day', 'week', 'month'].map(tf => (
                <button key={tf} onClick={() => setTimeFrame(tf)} style={{
                  ...styles.timeframeBtn,
                  backgroundColor: timeFrame === tf ? '#4CAF50' : 'transparent',
                  color: timeFrame === tf ? '#ffffff' : '#666666',
                  border: timeFrame === tf ? '2px solid #4CAF50' : '2px solid #2a2a2a'
                }}>
                  {tf.charAt(0).toUpperCase() + tf.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.graphWrapper}>
            <div style={styles.yAxis}>
              {yAxisLabels.map((l, i) => <div key={i} style={styles.yLabel}>{l}</div>)}
            </div>
            <div style={styles.graphArea}>
              <div style={styles.gridLines}>
                {[0, 1, 2, 3, 4].map(i => <div key={i} style={styles.gridLine} />)}
              </div>
              <div style={styles.graph}>
                {studyData.map((data, index) => (
                  <div key={index} style={styles.barContainer}>
                    {data.minutes > 0
                      ? <div style={{ ...styles.bar, height: `${(data.minutes / chartMax) * 100}%` }}>
                          <div style={styles.barValue}>{data.minutes}</div>
                        </div>
                      : <div style={styles.emptyBar} />
                    }
                  </div>
                ))}
              </div>
              <div style={styles.xAxisLabels}>
                {studyData.map((data, index) => (
                  <div key={index} style={styles.xLabelWrapper}>{data.label}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#000', padding: '24px', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  headerTitle: { fontSize: '32px', fontWeight: '700', color: '#fff' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  username: { color: '#666' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '1fr', gap: '24px' },
  card: { backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '24px', position: 'relative' },
  cardTitle: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: '0' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  todoForm: { display: 'flex', gap: '8px', margin: '20px 0 16px 0' },
  todoInput: { flex: 1, padding: '12px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#fff' },
  addButton: { width: '44px', height: '44px', backgroundColor: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' },
  todoList: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' },
  todoItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '8px' },
  todoLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  checkbox: { width: '20px', height: '20px', border: '2px solid #fff', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  todoText: { color: '#fff', fontSize: '14px' },
  deleteButton: { background: 'none', border: 'none', color: '#666', cursor: 'pointer' },

  // Notifications
  notificationList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' },
  notificationItem: { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '10px', transition: 'border-color 0.2s' },
  notifIconWrap: { display: 'flex', alignItems: 'center', paddingTop: '2px', flexShrink: 0 },
  achievementLabel: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', marginBottom: '3px', textTransform: 'uppercase' },
  notificationText: { color: '#fff', fontSize: '13px', margin: '0 0 4px 0', lineHeight: '1.4' },
  notificationTime: { color: '#555', fontSize: '11px', margin: 0 },

  graphHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  timeframeButtons: { display: 'flex', gap: '8px' },
  timeframeBtn: { padding: '8px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' },
  graphWrapper: { display: 'flex', gap: '16px', marginTop: '20px' },
  yAxis: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingBottom: '65px', minWidth: '40px', paddingTop: '10px' },
  yLabel: { fontSize: '12px', color: '#666', textAlign: 'right' },
  graphArea: { flex: 1, height: '320px', display: 'flex', flexDirection: 'column', position: 'relative' },
  gridLines: { position: 'absolute', top: '10px', width: '100%', height: '250px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' },
  gridLine: { width: '100%', height: '1px', backgroundColor: '#1a1a1a' },
  graph: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '250px', borderLeft: '2px solid #2a2a2a', borderBottom: '2px solid #2a2a2a', marginTop: '10px' },
  barContainer: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '100%' },
  bar: { width: '60%', backgroundColor: '#4CAF50', borderRadius: '6px 6px 0 0', position: 'relative' },
  barValue: { position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', color: '#fff', fontSize: '12px', fontWeight: 'bold' },
  emptyBar: { height: 0 },
  xAxisLabels: { display: 'flex', justifyContent: 'space-around', marginTop: '10px' },
  xLabelWrapper: { flex: 1, textAlign: 'center', color: '#666', fontSize: '12px' },
  clockWrapper: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  dateText: { marginTop: '15px', color: '#666', fontSize: '14px' }
};

export default Dashboard;
