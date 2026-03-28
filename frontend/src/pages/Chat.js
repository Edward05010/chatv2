import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupChatView from '../components/GroupChatView';
import GroupSettingsModal from '../components/GroupSettingsModal';

const API = 'https://chatv2-i91j.onrender.com';

export const REACTIONS = [
  { id: 'like',  label: 'Like',  color: '#4a90e2', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="#4a90e2" stroke="none"><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m7-10v4a2 2 0 0 1-2 2H9l-2 7v1h12l2-9H14z"/></svg> },
  { id: 'love',  label: 'Love',  color: '#e25555', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="#e25555" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> },
  { id: 'laugh', label: 'Haha',  color: '#f5a623', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5a623" stroke="none"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="1.2" fill="#fff"/><circle cx="15" cy="10" r="1.2" fill="#fff"/></svg> },
  { id: 'wow',   label: 'Wow',   color: '#f5a623', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5a623" stroke="none"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.3" fill="#fff"/><circle cx="15" cy="10" r="1.3" fill="#fff"/><ellipse cx="12" cy="15" rx="2.5" ry="3" fill="#fff"/></svg> },
  { id: 'cry',   label: 'Sad',   color: '#4a90e2', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="#4a90e2" stroke="none"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M8 15s1.5-2 4-2 4 2 4 2"/><circle cx="9" cy="10" r="1.2" fill="#fff"/><circle cx="15" cy="10" r="1.2" fill="#fff"/></svg> },
  { id: 'angry', label: 'Angry', color: '#e25555', svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="#e25555" stroke="none"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M8 15s1.5-2 4-2 4 2 4 2"/><circle cx="9" cy="10.5" r="1.2" fill="#fff"/><circle cx="15" cy="10.5" r="1.2" fill="#fff"/><path d="M7 8l3 2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none"/><path d="M17 8l-3 2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg> },
];

// ── Per-message action menu (dropdown) ───────────────────────────────────────
const MessageMenu = ({ msg, isOwn, onReply, onReact, currentUserId, reactions }) => {
  const [open, setOpen] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) { setShowEmojis(false); return; }
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setShowEmojis(false); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('touchstart', close); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Three-dot button */}
      <button
        onPointerDown={e => { e.stopPropagation(); setOpen(o => !o); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#555', padding: '2px 4px', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.7,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5"  r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          [isOwn ? 'right' : 'left']: 0,
          bottom: '100%',
          marginBottom: 4,
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: 12,
          padding: 8,
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
          minWidth: 160,
        }}>
          {/* Emoji row */}
          <div style={{ display: 'flex', gap: 4, justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #2a2a2a', marginBottom: 6 }}>
            {REACTIONS.map(({ id, svg, color, label }) => {
              const reacted = reactions?.[msg._id]?.[id]?.includes(currentUserId);
              return (
                <button key={id} title={label}
                  onPointerDown={e => { e.stopPropagation(); onReact(msg._id, id); setOpen(false); }}
                  style={{
                    background: reacted ? `${color}33` : 'transparent',
                    border: 'none', cursor: 'pointer', padding: 5,
                    borderRadius: 8, display: 'flex', alignItems: 'center',
                    outline: reacted ? `1.5px solid ${color}` : 'none',
                    transform: reacted ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 0.1s',
                  }}>
                  {svg}
                </button>
              );
            })}
          </div>

          {/* Reply */}
          <button
            onPointerDown={e => { e.stopPropagation(); onReply(msg); setOpen(false); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              background: 'transparent', border: 'none', color: '#ddd',
              cursor: 'pointer', padding: '8px 10px', borderRadius: 8,
              fontSize: 13, textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2a2a2a'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
            </svg>
            Reply
          </button>
        </div>
      )}
    </div>
  );
};

// ── Swipeable message row ─────────────────────────────────────────────────────
const SwipeableMessage = ({ children, onSwipe, isOwn }) => {
  const startX = useRef(null);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const triggered = useRef(false);
  const THRESHOLD = 60;

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    triggered.current = false;
  };
  const onTouchMove = (e) => {
    if (startX.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    // Only allow swipe in one direction: right for received, left for own
    const dir = isOwn ? -1 : 1;
    const clamped = Math.max(0, dx * dir);
    currentX.current = clamped;
    setOffset(clamped * dir > 0 ? Math.min(clamped, THRESHOLD + 10) * dir : 0);
    if (clamped >= THRESHOLD && !triggered.current) {
      triggered.current = true;
      onSwipe();
      // Haptic feedback on supported devices
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };
  const onTouchEnd = () => {
    startX.current = null;
    currentX.current = 0;
    setOffset(0);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: `translateX(${offset}px)`,
        transition: offset === 0 ? 'transform 0.2s ease' : 'none',
        width: '100%',
      }}
    >
      {children}
    </div>
  );
};

// ── Main Chat component ───────────────────────────────────────────────────────
const Chat = () => {
  const [selectedFile, setSelectedFile]   = useState(null);
  const [filePreview, setFilePreview]     = useState(null);
  const [uploading, setUploading]         = useState(false);
  const [friends, setFriends]             = useState([]);
  const [groups, setGroups]               = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup]   = useState(null);
  const [messages, setMessages]           = useState([]);
  const [newMessage, setNewMessage]       = useState('');
  const [searchQuery, setSearchQuery]     = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch]       = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [chatType, setChatType]           = useState('dm');
  const [replyTo, setReplyTo]             = useState(null);
  const [reactions, setReactions]         = useState({});
  const [showSidebar, setShowSidebar]     = useState(true);
  const [isMobile, setIsMobile]           = useState(window.innerWidth <= 768);

  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef       = useRef();
  const messagesEndRef  = useRef(null);
  const fileInputRef    = useRef(null);
  const messageRefs     = useRef({});

  // Always-fresh refs for socket callbacks
  const selectedFriendRef = useRef(null);
  const selectedGroupRef  = useRef(null);
  const chatTypeRef       = useRef('dm');
  const userRef           = useRef(null);

  useEffect(() => { selectedFriendRef.current = selectedFriend; }, [selectedFriend]);
  useEffect(() => { selectedGroupRef.current  = selectedGroup;  }, [selectedGroup]);
  useEffect(() => { chatTypeRef.current       = chatType;       }, [chatType]);
  useEffect(() => { userRef.current           = user;           }, [user]);

  useEffect(() => {
    const onResize = () => {
      const m = window.innerWidth <= 768;
      setIsMobile(m);
      if (!m) setShowSidebar(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    const socket = io(API, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;
    socket.emit('authenticate', token);

    socket.on('connect', () => socket.emit('authenticate', token));

    socket.on('receive_message', (message) => {
      const sf = selectedFriendRef.current;
      const sg = selectedGroupRef.current;
      const ct = chatTypeRef.current;
      const u  = userRef.current;
      setMessages(prev => {
        if (ct === 'group' && sg && message.group === sg._id) return [...prev, message];
        if (ct === 'dm' && sf) {
          const ok =
            (message.sender._id === sf._id  && message.receiver._id === u?.id) ||
            (message.sender._id === u?.id   && message.receiver._id === sf._id);
          if (ok) return [...prev, message];
        }
        return prev;
      });
      loadFriends(); loadGroups();
    });

    socket.on('message_sent', (msg) => {
      setMessages(prev => [...prev, msg]);
      loadFriends(); loadGroups();
    });

    socket.on('reaction_updated', ({ messageId, reactions: r }) => {
      setReactions(prev => ({ ...prev, [messageId]: r }));
    });

    loadFriends(); loadGroups();
    return () => socket.disconnect();
  }, [token]); // eslint-disable-line

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadFriends = async () => {
    try { const r = await axios.get(`${API}/api/users/friends`); setFriends(r.data); } catch {}
  };
  const loadGroups = async () => {
    try { const r = await axios.get(`${API}/api/groups`); setGroups(r.data); } catch {}
  };
  const loadMessages = async (friendId) => {
    try {
      const r = await axios.get(`${API}/api/messages/${friendId}`);
      setMessages(r.data);
      const map = {}; r.data.forEach(m => { if (m.reactions) map[m._id] = m.reactions; });
      setReactions(map);
    } catch {}
  };
  const loadGroupMessages = async (groupId) => {
    try {
      const r = await axios.get(`${API}/api/groups/${groupId}/messages`);
      setMessages(r.data);
      const map = {}; r.data.forEach(m => { if (m.reactions) map[m._id] = m.reactions; });
      setReactions(map);
    } catch {}
  };

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend); setSelectedGroup(null);
    setChatType('dm'); setReplyTo(null); setMessages([]);
    loadMessages(friend._id);
    if (isMobile) setShowSidebar(false);
  };
  const handleGroupSelect = (group) => {
    setSelectedGroup(group); setSelectedFriend(null);
    setChatType('group'); setReplyTo(null); setMessages([]);
    loadGroupMessages(group._id);
    if (isMobile) setShowSidebar(false);
  };
  const handleBack = () => {
    setShowSidebar(true); setSelectedFriend(null); setSelectedGroup(null); setMessages([]);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    socketRef.current.emit('send_message', { receiverId: selectedFriend._id, content: newMessage, replyTo: replyTo?._id || null });
    setNewMessage(''); setReplyTo(null); loadFriends();
  };
  const handleSendGroupMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;
    socketRef.current.emit('send_message', { groupId: selectedGroup._id, content: newMessage, replyTo: replyTo?._id || null });
    setNewMessage(''); setReplyTo(null); loadGroups();
  };

  const handleReact = useCallback((messageId, reactionId) => {
    socketRef.current.emit('react_message', { messageId, emoji: reactionId });
    setReactions(prev => {
      const cur = { ...(prev[messageId] || {}) };
      if (!cur[reactionId]) cur[reactionId] = [];
      const idx = cur[reactionId].indexOf(user?.id);
      if (idx > -1) {
        cur[reactionId] = cur[reactionId].filter(id => id !== user?.id);
        if (!cur[reactionId].length) delete cur[reactionId];
      } else {
        cur[reactionId] = [...cur[reactionId], user?.id];
      }
      return { ...prev, [messageId]: cur };
    });
  }, [user]);

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.transition = 'background-color 0.3s';
    el.style.backgroundColor = '#1e1e1e';
    setTimeout(() => { el.style.backgroundColor = ''; }, 1300);
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try { const r = await axios.get(`${API}/api/users/search?query=${query}`); setSearchResults(r.data); } catch {}
  };
  const handleAddFriend = async (userId) => {
    try {
      await axios.post(`${API}/api/users/add-friend/${userId}`);
      setSearchQuery(''); setSearchResults([]); setShowSearch(false); loadFriends();
    } catch (e) { alert(e.response?.data?.error || 'Error adding friend'); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) { const r = new FileReader(); r.onloadend = () => setFilePreview(r.result); r.readAsDataURL(file); }
    else if (file.type.startsWith('video/')) setFilePreview(URL.createObjectURL(file));
    else setFilePreview(null);
  };
  const handleSendFile = async () => {
    if (!selectedFile || (!selectedFriend && !selectedGroup)) return;
    setUploading(true);
    const fd = new FormData(); fd.append('file', selectedFile);
    try {
      const up = await axios.post(`${API}/api/messages/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const md = { content: selectedFile.name, fileUrl: up.data.fileUrl, fileType: up.data.fileType, fileName: up.data.fileName };
      if (chatType === 'group' && selectedGroup) md.groupId = selectedGroup._id;
      else if (selectedFriend) md.receiverId = selectedFriend._id;
      socketRef.current.emit('send_message', md);
      setSelectedFile(null); setFilePreview(null);
      chatType === 'group' ? loadGroups() : loadFriends();
    } catch { alert('Error uploading file'); }
    finally { setUploading(false); }
  };
  const cancelFile = () => { setSelectedFile(null); setFilePreview(null); };

  const handleGroupCreated = (g) => setGroups(prev => [g, ...prev]);
  const handleGroupUpdated = (u) => {
    setGroups(prev => prev.map(g => g._id === u._id ? u : g));
    if (selectedGroup?._id === u._id) setSelectedGroup(u);
  };

  const buildSidebar = () => {
    const items = [];
    friends.forEach(f => { const ts = f.lastMessage?.createdAt ? new Date(f.lastMessage.createdAt).getTime() : 0; items.push({ type: 'dm', data: f, ts }); });
    groups.forEach(g => { const ts = g.lastMessage?.createdAt ? new Date(g.lastMessage.createdAt).getTime() : 0; items.push({ type: 'group', data: g, ts }); });
    return items.sort((a, b) => b.ts - a.ts);
  };

  const renderReplyQuote = (msg, isOwn) => {
    if (!msg.replyTo) return null;
    const pop = typeof msg.replyTo === 'object';
    const refId = pop ? msg.replyTo._id : msg.replyTo;
    const orig = pop ? msg.replyTo : messages.find(m => m._id === refId);
    const senderName = orig?.sender?.username || 'Unknown';
    const preview = orig?.fileUrl ? '📎 Media' : orig?.content ? (orig.content.length > 50 ? orig.content.substring(0, 50) + '…' : orig.content) : 'Original message';
    return (
      <div onClick={(e) => { e.stopPropagation(); refId && scrollToMessage(refId); }}
        style={{ borderLeft: `3px solid ${isOwn ? 'rgba(0,0,0,0.3)' : '#555'}`, backgroundColor: isOwn ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)', borderRadius: 4, padding: '5px 8px', marginBottom: 6, cursor: 'pointer' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: isOwn ? 'rgba(0,0,0,0.5)' : '#aaa', marginBottom: 2 }}>{senderName}</div>
        <div style={{ fontSize: 12, color: isOwn ? 'rgba(0,0,0,0.4)' : '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</div>
      </div>
    );
  };

  const renderReactions = (msg) => {
    const r = reactions[msg._id];
    if (!r || !Object.values(r).some(a => a.length > 0)) return null;
    return (
      <div style={s.reactionsRow}>
        {REACTIONS.map(({ id, svg, color }) => {
          const users = r[id] || []; if (!users.length) return null;
          const reacted = users.includes(user?.id);
          return (
            <button key={id} onClick={() => handleReact(msg._id, id)}
              style={{ ...s.reactionBadge, backgroundColor: reacted ? `${color}22` : '#141414', border: `1px solid ${reacted ? color : '#222'}` }}>
              {svg}<span style={{ ...s.reactionCount, color: reacted ? color : '#888' }}>{users.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderContent = (msg, isOwn) => {
    if (msg.fileUrl) {
      if (msg.fileType === 'image') return <img src={msg.fileUrl} alt={msg.fileName || 'Image'} style={s.msgImg} onClick={() => window.open(msg.fileUrl, '_blank')} />;
      if (msg.fileType === 'video') return <video src={msg.fileUrl} controls style={s.msgVideo} />;
      return <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ ...s.fileLink, color: isOwn ? '#000' : '#fff' }}><FileIcon /><span>{msg.fileName || msg.content}</span></a>;
    }
    return <span style={s.msgText}>{msg.content}</span>;
  };

  // Icons
  const SearchIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
  const UserPlusIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
  const UsersSmIcon   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  const UsersIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  const SettingsIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/></svg>;
  const LogoutIcon    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
  const SendIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
  const CloseIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
  const MsgIcon       = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  const ClipIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
  const FileIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>;
  const ReplyIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>;
  const BackIcon      = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>;
  const SwipeHintIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 12H4"/></svg>;

  const sidebarItems = buildSidebar();
  const showSidebarPanel = !isMobile || showSidebar;
  const showChatPanel    = !isMobile || !showSidebar;

  return (
    <div style={s.root}>

      {/* ── SIDEBAR ── */}
      {showSidebarPanel && (
        <div style={{ ...s.sidebar, width: isMobile ? '100%' : 300 }}>
          <div style={s.sidebarTop}>
            <span style={s.sidebarTitle}>Messages</span>
            <button onClick={() => setShowSearch(true)} style={s.iconBtnSm}><SearchIcon /></button>
          </div>
          <div style={s.sidebarAction}>
            <button onClick={() => setShowCreateGroup(true)} style={s.createGroupBtn}><UsersIcon /> New Group</button>
          </div>
          <div style={s.list}>
            {sidebarItems.length === 0 && (
              <div style={s.emptyList}><MsgIcon /><p style={{ color: '#444', fontSize: 14, marginTop: 12 }}>No conversations yet</p></div>
            )}
            {sidebarItems.map(item => {
              const isDm = item.type === 'dm'; const data = item.data;
              const isActive = isDm ? chatType === 'dm' && selectedFriend?._id === data._id : chatType === 'group' && selectedGroup?._id === data._id;
              const pic = isDm ? data.profilePicture : data.groupPicture;
              const name = isDm ? data.username : data.name;
              const lm = data.lastMessage;
              const preview = isDm
                ? (lm ? `${lm.isSentByMe ? 'You: ' : ''}${lm.content.length > 28 ? lm.content.substring(0, 28) + '…' : lm.content}` : 'No messages yet')
                : (lm ? (lm.content.length > 28 ? lm.content.substring(0, 28) + '…' : lm.content) : `${data.members?.length || 0} members`);
              return (
                <div key={(isDm ? 'dm_' : 'g_') + data._id}
                  onClick={() => isDm ? handleFriendSelect(data) : handleGroupSelect(data)}
                  style={{ ...s.listItem, backgroundColor: isActive ? '#1a1a1a' : 'transparent' }}>
                  <div style={s.avatarWrap}>
                    {pic ? <img src={pic} alt={name} style={s.avatarImg} /> : <div style={s.avatarPh}>{name[0].toUpperCase()}</div>}
                    {!isDm && <div style={s.groupDot}><UsersSmIcon /></div>}
                  </div>
                  <div style={s.listInfo}>
                    <div style={s.listName}>{name}</div>
                    <div style={s.listSub}>{preview}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {!isMobile && (
            <div style={s.userFooter}>
              <div style={s.userLeft}>
                <div style={s.userAv}>
                  {user?.profilePicture ? <img src={user.profilePicture} alt="" style={s.userAvImg} /> : <span>{user?.username?.[0]?.toUpperCase()}</span>}
                </div>
                <div><div style={s.userName}>{user?.username}</div><div style={s.userSub}>Online</div></div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => navigate('/profile')} style={s.iconBtn}><SettingsIcon /></button>
                <button onClick={logout} style={s.iconBtn}><LogoutIcon /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CHAT PANEL ── */}
      {showChatPanel && (
        <div style={{ ...s.chatArea, width: isMobile ? '100%' : undefined }}>
          {chatType === 'group' && selectedGroup ? (
            <GroupChatView
              group={selectedGroup} messages={messages} user={user}
              newMessage={newMessage} onMessageChange={setNewMessage}
              onSendMessage={handleSendGroupMessage} onFileSelect={handleFileSelect}
              messagesEndRef={messagesEndRef} fileInputRef={fileInputRef}
              selectedFile={selectedFile} filePreview={filePreview}
              uploading={uploading} onSendFile={handleSendFile} onCancelFile={cancelFile}
              onOpenSettings={() => setShowGroupSettings(true)}
              replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
              reactions={reactions} messageRefs={messageRefs}
              currentUserId={user?.id} scrollToMessage={scrollToMessage}
              isMobile={isMobile} onBack={handleBack}
              onReact={handleReact} onReply={setReplyTo}
            />
          ) : selectedFriend ? (
            <>
              {/* Fixed header */}
              <div style={s.chatHeader}>
                {isMobile && <button onClick={handleBack} style={s.backBtn}><BackIcon /></button>}
                <div style={s.chatAv}>
                  {selectedFriend.profilePicture ? <img src={selectedFriend.profilePicture} alt="" style={s.chatAvImg} /> : <div style={s.chatAvPh}>{selectedFriend.username[0].toUpperCase()}</div>}
                </div>
                <div>
                  <div style={s.chatName}>{selectedFriend.username}</div>
                  <div style={s.chatSub}>Active now</div>
                </div>
                {isMobile && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, color: '#444', fontSize: 11 }}>
                    <SwipeHintIcon /> swipe to reply
                  </div>
                )}
              </div>

              {/* Scrollable messages */}
              <div style={s.msgs}>
                {messages.map((msg, idx) => {
                  const isOwn = msg.sender.username === user?.username;
                  const hasR  = reactions[msg._id] && Object.values(reactions[msg._id]).some(a => a.length > 0);
                  return (
                    <div key={idx}
                      ref={el => { if (msg._id) messageRefs.current[msg._id] = el; }}
                      style={{ ...s.msgWrapper, alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
                      <SwipeableMessage isOwn={isOwn} onSwipe={() => setReplyTo(msg)}>
                        <div style={{ ...s.msgRow, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                          {/* Avatar */}
                          <div style={s.msgAv}>
                            {isOwn
                              ? (user?.profilePicture ? <img src={user.profilePicture} alt="" style={s.msgAvImg} /> : <div style={s.msgAvPh}>{user?.username?.[0]?.toUpperCase()}</div>)
                              : (selectedFriend.profilePicture ? <img src={selectedFriend.profilePicture} alt="" style={s.msgAvImg} /> : <div style={s.msgAvPh}>{selectedFriend.username[0].toUpperCase()}</div>)
                            }
                          </div>

                          {/* Bubble + menu */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, flexDirection: isOwn ? 'row-reverse' : 'row', maxWidth: '80%' }}>
                            <div style={s.bubbleCol}>
                              <div style={{ ...s.bubble, backgroundColor: isOwn ? '#fff' : '#1a1a1a', color: isOwn ? '#000' : '#fff', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px' }}>
                                {msg.replyTo && renderReplyQuote(msg, isOwn)}
                                {renderContent(msg, isOwn)}
                              </div>
                              {hasR && renderReactions(msg)}
                            </div>
                            {/* Three-dot menu — always visible on mobile, visible on hover on desktop */}
                            <div style={{ paddingTop: 6 }}>
                              <MessageMenu
                                msg={msg} isOwn={isOwn}
                                onReply={setReplyTo}
                                onReact={handleReact}
                                currentUserId={user?.id}
                                reactions={reactions}
                              />
                            </div>
                          </div>
                        </div>
                      </SwipeableMessage>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Fixed bottom */}
              <div style={s.bottom}>
                {selectedFile && (
                  <div style={s.filePrev}>
                    {filePreview
                      ? (filePreview.startsWith('data:image') ? <img src={filePreview} alt="Preview" style={s.filePrevImg} /> : <video src={filePreview} style={s.filePrevImg} />)
                      : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileIcon /><span style={{ fontSize: 13, color: '#fff' }}>{selectedFile.name}</span></div>
                    }
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={cancelFile} style={s.cancelBtn}>Cancel</button>
                      <button onClick={handleSendFile} disabled={uploading} style={s.sendFileBtn}>{uploading ? 'Sending…' : 'Send'}</button>
                    </div>
                  </div>
                )}
                {replyTo && (
                  <div style={s.replyBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                      <ReplyIcon />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Replying to {replyTo.sender?.username}</div>
                        <div style={{ fontSize: 12, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyTo.content || '[media]'}</div>
                      </div>
                    </div>
                    <button onClick={() => setReplyTo(null)} style={s.replyClose}><CloseIcon /></button>
                  </div>
                )}
                <div style={s.inputArea}>
                  <form onSubmit={handleSendMessage} style={s.inputForm}>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={s.attachBtn}><ClipIcon /></button>
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedFriend.username}…`} style={s.input} />
                    <button type="submit" style={s.sendBtn} disabled={!newMessage.trim()}><SendIcon /></button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            !isMobile && (
              <div style={s.noChat}>
                <MsgIcon />
                <h2 style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: 0 }}>Your messages</h2>
                <p style={{ fontSize: 14, color: '#555', margin: 0 }}>Select a conversation to start chatting</p>
              </div>
            )
          )}
        </div>
      )}

      {/* Search modal */}
      {showSearch && (
        <div style={s.modal} onClick={() => setShowSearch(false)}>
          <div style={{ ...s.modalBox, width: isMobile ? '95%' : 480, maxHeight: isMobile ? '85vh' : '80vh' }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHdr}>
              <h2 style={s.modalTitle}>Add Friend</h2>
              <button onClick={() => setShowSearch(false)} style={s.modalClose}><CloseIcon /></button>
            </div>
            <div style={s.modalBody}>
              <div style={s.searchWrap}>
                <SearchIcon />
                <input type="text" placeholder="Search by username…" value={searchQuery}
                  onChange={e => handleSearch(e.target.value)} style={s.searchInput} autoFocus />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.length > 0
                  ? searchResults.map(u => (
                    <div key={u._id} style={s.searchItem}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {u.profilePicture ? <img src={u.profilePicture} alt={u.username} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 }}>{u.username[0].toUpperCase()}</div>}
                        <span style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{u.username}</span>
                      </div>
                      <button onClick={() => handleAddFriend(u._id)} style={s.addBtn}><UserPlusIcon /></button>
                    </div>
                  ))
                  : searchQuery.length >= 2 && <div style={{ textAlign: 'center', padding: '32px 20px', color: '#555', fontSize: 14 }}>No users found</div>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      <CreateGroupModal show={showCreateGroup} onClose={() => setShowCreateGroup(false)} friends={friends} onGroupCreated={handleGroupCreated} />
      <GroupSettingsModal show={showGroupSettings} onClose={() => setShowGroupSettings(false)} group={selectedGroup} onGroupUpdated={handleGroupUpdated} currentUserId={user?.id} allFriends={friends} />
    </div>
  );
};

const s = {
  root: { display: 'flex', height: '100%', backgroundColor: '#000', position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#fff', overflow: 'hidden' },

  // Sidebar
  sidebar: { backgroundColor: '#0a0a0a', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%', overflow: 'hidden' },
  sidebarTop: { padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', flexShrink: 0 },
  sidebarTitle: { fontSize: 18, fontWeight: 700, color: '#fff' },
  sidebarAction: { padding: '10px 12px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 },
  createGroupBtn: { width: '100%', padding: 9, backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  list: { flex: 1, overflowY: 'auto', padding: 6, minHeight: 0 },
  emptyList: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, color: '#333' },
  listItem: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 2, minHeight: 60 },
  avatarWrap: { width: 44, height: 44, marginRight: 10, flexShrink: 0, position: 'relative' },
  avatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  avatarPh: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 600 },
  groupDot: { position: 'absolute', bottom: -1, right: -3, width: 16, height: 16, borderRadius: '50%', backgroundColor: '#2a2a2a', border: '1.5px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' },
  listInfo: { flex: 1, overflow: 'hidden' },
  listName: { fontSize: 14, fontWeight: 500, color: '#fff', marginBottom: 2 },
  listSub: { fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userFooter: { padding: '12px 16px', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000', flexShrink: 0 },
  userLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  userAv: { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, overflow: 'hidden' },
  userAvImg: { width: '100%', height: '100%', objectFit: 'cover' },
  userName: { fontSize: 13, fontWeight: 500, color: '#fff' },
  userSub: { fontSize: 11, color: '#666' },
  iconBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconBtnSm: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Chat area
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000', height: '100%', overflow: 'hidden', minWidth: 0 },
  chatHeader: { height: 58, borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 14px', backgroundColor: '#0a0a0a', flexShrink: 0, gap: 8 },
  backBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center', flexShrink: 0 },
  chatAv: { width: 34, height: 34, flexShrink: 0 },
  chatAvImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  chatAvPh: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 },
  chatName: { fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 1 },
  chatSub: { fontSize: 11, color: '#666' },

  // Messages — THE KEY FIX: flex:1 + minHeight:0 + overflowY:auto
  msgs: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 4, WebkitOverflowScrolling: 'touch' },

  msgWrapper: { display: 'flex', flexDirection: 'column', paddingBottom: 2, userSelect: 'none' },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: 6 },
  msgAv: { width: 28, height: 28, flexShrink: 0 },
  msgAvImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  msgAvPh: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 },
  bubbleCol: { display: 'flex', flexDirection: 'column', minWidth: 0 },
  bubble: { fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', overflowWrap: 'anywhere', padding: '9px 13px', display: 'flex', flexDirection: 'column' },
  msgText: { display: 'block' },
  msgImg: { maxWidth: 200, maxHeight: 200, borderRadius: 10, cursor: 'pointer', display: 'block' },
  msgVideo: { maxWidth: 200, maxHeight: 200, borderRadius: 10, display: 'block' },
  fileLink: { display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '4px 6px' },
  reactionsRow: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reactionBadge: { display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.12s' },
  reactionCount: { fontSize: 11, fontWeight: 600 },

  // Fixed bottom
  bottom: { flexShrink: 0 },
  filePrev: { padding: '10px 14px', borderTop: '1px solid #1a1a1a', backgroundColor: '#0a0a0a' },
  filePrevImg: { maxWidth: 120, maxHeight: 120, borderRadius: 8 },
  cancelBtn: { padding: '7px 14px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #1a1a1a', borderRadius: 6, cursor: 'pointer', fontSize: 13 },
  sendFileBtn: { padding: '7px 14px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
  replyBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', backgroundColor: '#0d0d0d', borderTop: '1px solid #1a1a1a', gap: 8 },
  replyClose: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 },
  inputArea: { padding: '10px 12px', borderTop: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', paddingBottom: 'max(10px, env(safe-area-inset-bottom))' },
  inputForm: { display: 'flex', gap: 6, alignItems: 'center' },
  attachBtn: { width: 36, height: 36, borderRadius: '50%', backgroundColor: 'transparent', color: '#666', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  input: { flex: 1, padding: '10px 14px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: 22, color: '#fff', fontSize: 15, outline: 'none', minWidth: 0 },
  sendBtn: { width: 38, height: 38, borderRadius: '50%', backgroundColor: '#fff', color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },

  noChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666', gap: 12, padding: 20 },

  // Modals
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalBox: { backgroundColor: '#0a0a0a', borderRadius: 16, display: 'flex', flexDirection: 'column', border: '1px solid #1a1a1a', overflow: 'hidden' },
  modalHdr: { padding: '18px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: 600, color: '#fff', margin: 0 },
  modalClose: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' },
  modalBody: { padding: '16px 20px', flex: 1, overflowY: 'auto' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: 10, marginBottom: 14, color: '#666' },
  searchInput: { flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#fff', fontSize: 15 },
  searchItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: 10 },
  addBtn: { padding: '7px 12px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500 },
};

export default Chat;