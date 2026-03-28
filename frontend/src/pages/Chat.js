import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupChatView from '../components/GroupChatView';
import GroupSettingsModal from '../components/GroupSettingsModal';

const API = 'https://chatv2-i91j.onrender.com';

export const REACTIONS = [
  { id: 'like',  label: 'Like',  color: '#4a90e2', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="#4a90e2" stroke="none"><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m7-10v4a2 2 0 0 1-2 2H9l-2 7v1h12l2-9H14z"/></svg>) },
  { id: 'love',  label: 'Love',  color: '#e25555', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="#e25555" stroke="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>) },
  { id: 'laugh', label: 'Haha',  color: '#f5a623', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="#f5a623" stroke="none"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="10" r="1.2" fill="#fff"/><circle cx="15" cy="10" r="1.2" fill="#fff"/></svg>) },
  { id: 'wow',   label: 'Wow',   color: '#f5a623', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="#f5a623" stroke="none"><circle cx="12" cy="12" r="10"/><circle cx="9" cy="10" r="1.3" fill="#fff"/><circle cx="15" cy="10" r="1.3" fill="#fff"/><ellipse cx="12" cy="15" rx="2.5" ry="3" fill="#fff"/></svg>) },
  { id: 'cry',   label: 'Sad',   color: '#4a90e2', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="#4a90e2" stroke="none"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M8 15s1.5-2 4-2 4 2 4 2"/><circle cx="9" cy="10" r="1.2" fill="#fff"/><circle cx="15" cy="10" r="1.2" fill="#fff"/></svg>) },
  { id: 'angry', label: 'Angry', color: '#e25555', svg: (<svg width="18" height="18" viewBox="0 0 24 24" fill="#e25555" stroke="none"><circle cx="12" cy="12" r="10"/><path fill="#fff" d="M8 15s1.5-2 4-2 4 2 4 2"/><circle cx="9" cy="10.5" r="1.2" fill="#fff"/><circle cx="15" cy="10.5" r="1.2" fill="#fff"/><path d="M7 8l3 2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none"/><path d="M17 8l-3 2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg>) },
];

const Chat = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [chatType, setChatType] = useState('dm');
  const [replyTo, setReplyTo] = useState(null);
  const [reactions, setReactions] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});
  const contextMenuRef = useRef(null);
  const longPressTimer = useRef(null);

  // Always-current refs so socket callbacks never go stale
  const selectedFriendRef = useRef(null);
  const selectedGroupRef  = useRef(null);
  const chatTypeRef       = useRef('dm');
  const userRef           = useRef(null);
  const messagesRef       = useRef([]);

  useEffect(() => { selectedFriendRef.current = selectedFriend; }, [selectedFriend]);
  useEffect(() => { selectedGroupRef.current  = selectedGroup;  }, [selectedGroup]);
  useEffect(() => { chatTypeRef.current       = chatType;       }, [chatType]);
  useEffect(() => { userRef.current           = user;           }, [user]);
  useEffect(() => { messagesRef.current       = messages;       }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) setContextMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Socket setup (runs once on mount) ─────────────────────────────────────
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

    socket.on('connect', () => {
      // Re-authenticate after reconnect
      socket.emit('authenticate', token);
    });

    socket.on('receive_message', (message) => {
      const sf = selectedFriendRef.current;
      const sg = selectedGroupRef.current;
      const ct = chatTypeRef.current;
      const u  = userRef.current;

      setMessages(prev => {
        if (ct === 'group' && sg && message.group === sg._id) {
          return [...prev, message];
        }
        if (ct === 'dm' && sf) {
          const ok =
            (message.sender._id === sf._id  && message.receiver._id === u?.id) ||
            (message.sender._id === u?.id   && message.receiver._id === sf._id);
          if (ok) return [...prev, message];
        }
        return prev;
      });

      // Refresh sidebar previews
      loadFriends();
      loadGroups();
    });

    socket.on('message_sent', (message) => {
      setMessages(prev => [...prev, message]);
      loadFriends();
      loadGroups();
    });

    socket.on('reaction_updated', ({ messageId, reactions: r }) => {
      setReactions(prev => ({ ...prev, [messageId]: r }));
    });

    loadFriends();
    loadGroups();

    return () => { socket.disconnect(); };
  }, [token]); // eslint-disable-line

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadFriends = async () => {
    try { const r = await axios.get(`${API}/api/users/friends`); setFriends(r.data); } catch (e) { console.error(e); }
  };
  const loadGroups = async () => {
    try { const r = await axios.get(`${API}/api/groups`); setGroups(r.data); } catch (e) { console.error(e); }
  };
  const loadMessages = async (friendId) => {
    try {
      const r = await axios.get(`${API}/api/messages/${friendId}`);
      setMessages(r.data);
      const map = {};
      r.data.forEach(m => { if (m.reactions) map[m._id] = m.reactions; });
      setReactions(map);
    } catch (e) { console.error(e); }
  };
  const loadGroupMessages = async (groupId) => {
    try {
      const r = await axios.get(`${API}/api/groups/${groupId}/messages`);
      setMessages(r.data);
      const map = {};
      r.data.forEach(m => { if (m.reactions) map[m._id] = m.reactions; });
      setReactions(map);
    } catch (e) { console.error(e); }
  };

  // ── Selection handlers ────────────────────────────────────────────────────
  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend); setSelectedGroup(null);
    setChatType('dm'); setReplyTo(null); setContextMenu(null); setMessages([]);
    loadMessages(friend._id);
    if (isMobile) setShowSidebar(false);
  };
  const handleGroupSelect = (group) => {
    setSelectedGroup(group); setSelectedFriend(null);
    setChatType('group'); setReplyTo(null); setContextMenu(null); setMessages([]);
    loadGroupMessages(group._id);
    if (isMobile) setShowSidebar(false);
  };
  const handleBack = () => {
    setShowSidebar(true);
    setSelectedFriend(null);
    setSelectedGroup(null);
    setMessages([]);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    socketRef.current.emit('send_message', {
      receiverId: selectedFriend._id,
      content: newMessage,
      replyTo: replyTo?._id || null
    });
    setNewMessage(''); setReplyTo(null); loadFriends();
  };
  const handleSendGroupMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;
    socketRef.current.emit('send_message', {
      groupId: selectedGroup._id,
      content: newMessage,
      replyTo: replyTo?._id || null
    });
    setNewMessage(''); setReplyTo(null); loadGroups();
  };

  // ── Context menu (desktop right-click + mobile long-press) ────────────────
  const handleContextMenu = (e, msg) => {
    e.preventDefault(); e.stopPropagation();
    const x = e.clientX + 240 > window.innerWidth ? e.clientX - 240 : e.clientX;
    const y = e.clientY + 220 > window.innerHeight ? e.clientY - 220 : e.clientY;
    setContextMenu({ x, y, message: msg, centered: false });
  };

  // Mobile: long-press opens centered menu
  const handleTouchStart = (msg) => {
    longPressTimer.current = setTimeout(() => {
      setContextMenu({
        x: 0, y: 0,
        message: msg,
        centered: true,
      });
    }, 500);
  };
  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ── Reactions ─────────────────────────────────────────────────────────────
  const handleReact = (messageId, reactionId) => {
    socketRef.current.emit('react_message', { messageId, emoji: reactionId });
    setContextMenu(null);
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
  };

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.transition = 'background-color 0.3s ease';
    el.style.backgroundColor = '#1e1e1e';
    setTimeout(() => { el.style.backgroundColor = ''; }, 1300);
  };

  // ── Search ────────────────────────────────────────────────────────────────
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try { const r = await axios.get(`${API}/api/users/search?query=${query}`); setSearchResults(r.data); }
    catch (e) { console.error(e); }
  };
  const handleAddFriend = async (userId) => {
    try {
      await axios.post(`${API}/api/users/add-friend/${userId}`);
      setSearchQuery(''); setSearchResults([]); setShowSearch(false); loadFriends();
    } catch (e) { alert(e.response?.data?.error || 'Error adding friend'); }
  };

  // ── File ──────────────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setFilePreview(URL.createObjectURL(file));
    } else setFilePreview(null);
  };
  const handleSendFile = async () => {
    if (!selectedFile || (!selectedFriend && !selectedGroup)) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const up = await axios.post(`${API}/api/messages/upload`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const msgData = { content: selectedFile.name, fileUrl: up.data.fileUrl, fileType: up.data.fileType, fileName: up.data.fileName };
      if (chatType === 'group' && selectedGroup) msgData.groupId = selectedGroup._id;
      else if (selectedFriend) msgData.receiverId = selectedFriend._id;
      socketRef.current.emit('send_message', msgData);
      setSelectedFile(null); setFilePreview(null);
      chatType === 'group' ? loadGroups() : loadFriends();
    } catch (e) { alert('Error uploading file'); }
    finally { setUploading(false); }
  };
  const cancelFileUpload = () => { setSelectedFile(null); setFilePreview(null); };

  // ── Group helpers ─────────────────────────────────────────────────────────
  const handleGroupCreated = (g) => setGroups(prev => [g, ...prev]);
  const handleGroupUpdated = (updated) => {
    setGroups(prev => prev.map(g => g._id === updated._id ? updated : g));
    if (selectedGroup?._id === updated._id) setSelectedGroup(updated);
  };

  const buildMixedSidebar = () => {
    const items = [];
    friends.forEach(f => { const ts = f.lastMessage?.createdAt ? new Date(f.lastMessage.createdAt).getTime() : 0; items.push({ type: 'dm', data: f, ts }); });
    groups.forEach(g => { const ts = g.lastMessage?.createdAt ? new Date(g.lastMessage.createdAt).getTime() : 0; items.push({ type: 'group', data: g, ts }); });
    return items.sort((a, b) => b.ts - a.ts);
  };

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderReplyQuote = (msg, isOwn) => {
    if (!msg.replyTo) return null;
    const isPopulated = typeof msg.replyTo === 'object' && msg.replyTo !== null;
    const refId = isPopulated ? msg.replyTo._id : msg.replyTo;
    const orig = isPopulated ? msg.replyTo : messages.find(m => m._id === refId);
    const senderName = orig?.sender?.username || 'Unknown';
    const previewText = orig?.fileUrl ? '📎 Media' : orig?.content
      ? (orig.content.length > 50 ? orig.content.substring(0, 50) + '…' : orig.content)
      : 'Original message';
    return (
      <div onClick={(e) => { e.stopPropagation(); refId && scrollToMessage(refId); }}
        style={{ borderLeft: `3px solid ${isOwn ? 'rgba(0,0,0,0.3)' : '#555'}`, backgroundColor: isOwn ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)', borderRadius: '4px', padding: '5px 8px', marginBottom: '6px', cursor: 'pointer' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: isOwn ? 'rgba(0,0,0,0.5)' : '#aaa', marginBottom: '2px' }}>{senderName}</div>
        <div style={{ fontSize: '12px', color: isOwn ? 'rgba(0,0,0,0.4)' : '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{previewText}</div>
      </div>
    );
  };

  const renderReactions = (msg) => {
    const r = reactions[msg._id];
    if (!r || !Object.values(r).some(a => a.length > 0)) return null;
    return (
      <div style={s.reactionsRow}>
        {REACTIONS.map(({ id, svg, color }) => {
          const users = r[id] || [];
          if (!users.length) return null;
          const reacted = users.includes(user?.id);
          return (
            <button key={id} onClick={() => handleReact(msg._id, id)}
              style={{ ...s.reactionBadge, backgroundColor: reacted ? `${color}22` : '#141414', border: `1px solid ${reacted ? color : '#222'}` }}>
              {svg}
              <span style={{ ...s.reactionCount, color: reacted ? color : '#888' }}>{users.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderMessageContent = (msg, isOwn) => {
    if (msg.fileUrl) {
      if (msg.fileType === 'image') return <img src={msg.fileUrl} alt={msg.fileName || 'Image'} style={s.messageImage} onClick={() => window.open(msg.fileUrl, '_blank')} />;
      if (msg.fileType === 'video') return <video src={msg.fileUrl} controls style={s.messageVideo} />;
      return <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={{ ...s.fileLink, color: isOwn ? '#000' : '#fff' }}><FileIcon /><span>{msg.fileName || msg.content}</span></a>;
    }
    return <span style={s.messageText}>{msg.content}</span>;
  };

  // ── Icons ─────────────────────────────────────────────────────────────────
  const SearchIcon    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>);
  const UserPlusIcon  = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>);
  const UsersIcon     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
  const UsersIconLg   = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
  const SettingsIcon  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/></svg>);
  const LogoutIcon    = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
  const SendIcon      = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
  const CloseIcon     = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
  const MessageIcon   = () => (<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
  const PaperclipIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>);
  const FileIcon      = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>);
  const ReplyIcon     = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>);
  const BackIcon      = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>);
  const EditIcon      = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>);

  const sidebarItems = buildMixedSidebar();
  const showSidebarPanel = !isMobile || showSidebar;
  const showChatPanel    = !isMobile || !showSidebar;

  return (
    <div style={s.container} onClick={() => setContextMenu(null)}>

      {/* ── Context Menu (right-click desktop / long-press mobile) ── */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            ...s.contextMenu,
            ...(contextMenu.centered
              ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
              : { top: contextMenu.y, left: contextMenu.x }
            ),
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={s.contextReactionRow}>
            {REACTIONS.map(({ id, svg, label, color }) => {
              const reacted = reactions[contextMenu.message._id]?.[id]?.includes(user?.id);
              return (
                <button key={id} onClick={() => handleReact(contextMenu.message._id, id)} title={label}
                  style={{ ...s.contextReactionBtn, transform: reacted ? 'scale(1.25)' : 'scale(1)', backgroundColor: reacted ? `${color}22` : 'transparent', outline: reacted ? `1.5px solid ${color}` : 'none', outlineOffset: '2px' }}>
                  {svg}
                </button>
              );
            })}
          </div>
          <div style={s.contextDivider} />
          <button style={s.contextMenuItem}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => { setReplyTo(contextMenu.message); setContextMenu(null); }}>
            <ReplyIcon /><span>Reply</span>
          </button>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      {showSidebarPanel && (
        <div style={{ ...s.sidebar, width: isMobile ? '100%' : '300px' }}>
          <div style={s.sidebarTop}>
            <span style={s.sidebarTitle}>Messages</span>
            <button onClick={() => setShowSearch(true)} style={s.iconBtnSm}><SearchIcon /></button>
          </div>
          <div style={s.sidebarAction}>
            <button onClick={() => setShowCreateGroup(true)} style={s.createGroupButton}><UsersIconLg /> New Group</button>
          </div>
          <div style={s.friendsList}>
            {sidebarItems.length === 0 && (
              <div style={s.emptyList}>
                <MessageIcon />
                <p style={{ color: '#444', fontSize: '14px', marginTop: '12px' }}>No conversations yet</p>
              </div>
            )}
            {sidebarItems.map(item => {
              const isDm = item.type === 'dm'; const data = item.data;
              const isActive = isDm
                ? chatType === 'dm' && selectedFriend?._id === data._id
                : chatType === 'group' && selectedGroup?._id === data._id;
              const pic = isDm ? data.profilePicture : data.groupPicture;
              const name = isDm ? data.username : data.name;
              const lm = data.lastMessage;
              const preview = isDm
                ? (lm ? `${lm.isSentByMe ? 'You: ' : ''}${lm.content.length > 30 ? lm.content.substring(0, 30) + '…' : lm.content}` : 'No messages yet')
                : (lm ? (lm.content.length > 30 ? lm.content.substring(0, 30) + '…' : lm.content) : `${data.members?.length || 0} members`);
              return (
                <div key={(isDm ? 'dm_' : 'grp_') + data._id}
                  onClick={() => isDm ? handleFriendSelect(data) : handleGroupSelect(data)}
                  style={{ ...s.friendItem, backgroundColor: isActive ? '#1a1a1a' : 'transparent' }}>
                  <div style={s.friendAvatarWrap}>
                    {pic ? <img src={pic} alt={name} style={s.avatarImg} /> : <div style={s.avatarPlaceholder}>{name[0].toUpperCase()}</div>}
                    {!isDm && <div style={s.groupBadge}><UsersIcon /></div>}
                  </div>
                  <div style={s.friendInfo}>
                    <div style={s.friendName}>{name}</div>
                    <div style={s.friendStatus}>{preview}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {!isMobile && (
            <div style={s.userFooter}>
              <div style={s.userFooterLeft}>
                <div style={s.userAvatar}>
                  {user?.profilePicture ? <img src={user.profilePicture} alt="" style={s.userAvatarImg} /> : <span>{user?.username?.[0]?.toUpperCase() || '?'}</span>}
                </div>
                <div style={s.userInfo}>
                  <div style={s.userName}>{user?.username}</div>
                  <div style={s.userStatus}>Online</div>
                </div>
              </div>
              <div style={s.userFooterActions}>
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
              uploading={uploading} onSendFile={handleSendFile} onCancelFile={cancelFileUpload}
              onOpenSettings={() => setShowGroupSettings(true)}
              replyTo={replyTo} onCancelReply={() => setReplyTo(null)}
              reactions={reactions} onContextMenu={handleContextMenu}
              onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
              messageRefs={messageRefs} currentUserId={user?.id}
              scrollToMessage={scrollToMessage}
              isMobile={isMobile} onBack={handleBack}
              onReact={handleReact} currentUser={user}
            />
          ) : selectedFriend ? (
            <>
              {/* Fixed header */}
              <div style={s.chatHeader}>
                <div style={s.chatHeaderLeft}>
                  {isMobile && <button onClick={handleBack} style={s.backBtn}><BackIcon /></button>}
                  <div style={s.chatAvatar}>
                    {selectedFriend.profilePicture
                      ? <img src={selectedFriend.profilePicture} alt="" style={s.chatAvatarImg} />
                      : <div style={s.chatAvatarPlaceholder}>{selectedFriend.username[0].toUpperCase()}</div>
                    }
                  </div>
                  <div>
                    <div style={s.chatHeaderName}>{selectedFriend.username}</div>
                    <div style={s.chatHeaderStatus}>Active now</div>
                  </div>
                </div>
              </div>

              {/* Scrollable messages — fills remaining space */}
              <div style={s.messagesArea}>
                {messages.map((msg, index) => {
                  const isOwn = msg.sender.username === user?.username;
                  const hasReactions = reactions[msg._id] && Object.values(reactions[msg._id]).some(a => a.length > 0);
                  return (
                    <div key={index}
                      ref={el => { if (msg._id) messageRefs.current[msg._id] = el; }}
                      style={{ ...s.messageWrapper, alignItems: isOwn ? 'flex-end' : 'flex-start' }}
                      onContextMenu={e => handleContextMenu(e, msg)}
                      onTouchStart={() => handleTouchStart(msg)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd}>
                      <div style={{ ...s.messageRowInner, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                        <div style={s.messageAvatar}>
                          {isOwn
                            ? (user?.profilePicture ? <img src={user.profilePicture} alt="" style={s.messageAvatarImg} /> : <div style={s.messageAvatarPlaceholder}>{user?.username?.[0]?.toUpperCase()}</div>)
                            : (selectedFriend.profilePicture ? <img src={selectedFriend.profilePicture} alt="" style={s.messageAvatarImg} /> : <div style={s.messageAvatarPlaceholder}>{selectedFriend.username[0].toUpperCase()}</div>)
                          }
                        </div>
                        <div style={s.bubbleCol}>
                          <div style={{ ...s.messageBubble, backgroundColor: isOwn ? '#ffffff' : '#1a1a1a', color: isOwn ? '#000' : '#fff', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px' }}>
                            {msg.replyTo && renderReplyQuote(msg, isOwn)}
                            {renderMessageContent(msg, isOwn)}
                          </div>
                          {hasReactions && renderReactions(msg)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Fixed bottom area */}
              <div style={s.bottomArea}>
                {/* File Preview */}
                {selectedFile && (
                  <div style={s.filePreviewContainer}>
                    {filePreview
                      ? (filePreview.startsWith('data:image') ? <img src={filePreview} alt="Preview" style={s.filePreviewImage} /> : <video src={filePreview} style={s.filePreviewImage} />)
                      : <div style={s.filePreviewDoc}><FileIcon /><span style={{ fontSize: '13px', color: '#fff' }}>{selectedFile.name}</span></div>
                    }
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={cancelFileUpload} style={s.cancelButton}>Cancel</button>
                      <button onClick={handleSendFile} disabled={uploading} style={s.uploadButton}>{uploading ? 'Sending…' : 'Send'}</button>
                    </div>
                  </div>
                )}

                {/* Reply Banner */}
                {replyTo && (
                  <div style={s.replyBanner}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <ReplyIcon />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Replying to {replyTo.sender?.username}</div>
                        <div style={{ fontSize: '12px', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyTo.content || '[media]'}</div>
                      </div>
                    </div>
                    <button onClick={() => setReplyTo(null)} style={s.replyBannerClose}><CloseIcon /></button>
                  </div>
                )}

                {/* Input */}
                <div style={s.messageInputArea}>
                  <form onSubmit={handleSendMessage} style={s.messageForm}>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} style={s.attachButton}><PaperclipIcon /></button>
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedFriend.username}…`} style={s.messageInput} />
                    <button type="submit" style={s.sendButton} disabled={!newMessage.trim()}><SendIcon /></button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            !isMobile && (
              <div style={s.noChat}>
                <MessageIcon />
                <h2 style={s.noChatTitle}>Your messages</h2>
                <p style={s.noChatText}>Select a conversation or start a new one</p>
                <button onClick={() => setShowSearch(true)} style={s.noChatBtn}><EditIcon /> New Message</button>
              </div>
            )
          )}
        </div>
      )}

      {/* Search Modal */}
      {showSearch && (
        <div style={s.modal} onClick={() => setShowSearch(false)}>
          <div style={{ ...s.modalContent, maxHeight: isMobile ? '85vh' : '80vh', width: isMobile ? '95%' : '480px' }} onClick={e => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Add Friend</h2>
              <button onClick={() => setShowSearch(false)} style={s.modalClose}><CloseIcon /></button>
            </div>
            <div style={s.modalBody}>
              <div style={s.modalSearchWrapper}>
                <SearchIcon />
                <input type="text" placeholder="Search by username…" value={searchQuery}
                  onChange={e => handleSearch(e.target.value)} style={s.modalSearchInput} autoFocus />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.length > 0
                  ? searchResults.map(u => (
                    <div key={u._id} style={s.searchResultItem}>
                      <div style={s.searchResultLeft}>
                        {u.profilePicture ? <img src={u.profilePicture} alt={u.username} style={s.searchResultAvatarImg} /> : <div style={s.searchResultAvatar}>{u.username[0].toUpperCase()}</div>}
                        <span style={s.searchResultName}>{u.username}</span>
                      </div>
                      <button onClick={() => handleAddFriend(u._id)} style={s.addFriendBtn}><UserPlusIcon /></button>
                    </div>
                  ))
                  : searchQuery.length >= 2
                    ? <div style={{ textAlign: 'center', padding: '32px 20px', color: '#555', fontSize: '14px' }}>No users found</div>
                    : null
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

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  container: {
    display: 'flex',
    height: '100%',          // fills MainLayout's flex container
    backgroundColor: '#000',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#fff',
    overflow: 'hidden',
  },

  // Context menu
  contextMenu: { position: 'fixed', zIndex: 9999, backgroundColor: '#111', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '10px', boxShadow: '0 12px 40px rgba(0,0,0,0.85)', minWidth: '220px' },
  contextReactionRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 2px 10px', gap: '2px' },
  contextReactionBtn: { border: 'none', cursor: 'pointer', padding: '7px', borderRadius: '10px', transition: 'transform 0.15s', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '34px', minHeight: '34px' },
  contextDivider: { height: '1px', backgroundColor: '#222', margin: '2px 0 6px' },
  contextMenuItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'transparent', border: 'none', color: '#ddd', cursor: 'pointer', fontSize: '14px', borderRadius: '8px', transition: 'background 0.12s', textAlign: 'left' },

  // Sidebar
  sidebar: { backgroundColor: '#0a0a0a', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', flexShrink: 0, height: '100%', overflow: 'hidden' },
  sidebarTop: { padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', flexShrink: 0 },
  sidebarTitle: { fontSize: '18px', fontWeight: '700', color: '#fff' },
  sidebarAction: { padding: '10px 12px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 },
  createGroupButton: { width: '100%', padding: '9px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #2a2a2a', borderRadius: '8px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' },
  friendsList: { flex: 1, overflowY: 'auto', padding: '6px', minHeight: 0 },
  emptyList: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: '#333' },
  friendItem: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', transition: 'background-color 0.15s', marginBottom: '2px', minHeight: '60px' },
  friendAvatarWrap: { width: '44px', height: '44px', marginRight: '10px', flexShrink: 0, position: 'relative' },
  avatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: '600' },
  groupBadge: { position: 'absolute', bottom: '-1px', right: '-3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#2a2a2a', border: '1.5px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' },
  friendInfo: { flex: 1, overflow: 'hidden' },
  friendName: { fontSize: '14px', fontWeight: '500', color: '#fff', marginBottom: '2px' },
  friendStatus: { fontSize: '12px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userFooter: { padding: '12px 16px', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000', flexShrink: 0 },
  userFooterLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  userAvatar: { width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', overflow: 'hidden' },
  userAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '13px', fontWeight: '500', color: '#fff' },
  userStatus: { fontSize: '11px', color: '#666' },
  userFooterActions: { display: 'flex', gap: '6px' },
  iconBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  iconBtnSm: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // Chat area — KEY: flex column, fixed height, no overflow on self
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#000',
    height: '100%',
    overflow: 'hidden',   // prevent the column itself from scrolling
    minWidth: 0,
  },

  // Fixed header — never scrolls
  chatHeader: { height: '58px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 14px', backgroundColor: '#0a0a0a', flexShrink: 0 },
  chatHeaderLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  backBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center', flexShrink: 0 },
  chatAvatar: { width: '34px', height: '34px', flexShrink: 0 },
  chatAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  chatAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' },
  chatHeaderName: { fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '1px' },
  chatHeaderStatus: { fontSize: '11px', color: '#666' },

  // Scrollable messages area — KEY: flex:1 + minHeight:0 + overflowY:auto
  messagesArea: {
    flex: 1,
    minHeight: 0,          // ← critical: allows flex child to shrink below content size
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    WebkitOverflowScrolling: 'touch',
  },

  // Fixed bottom: file preview + reply banner + input, all in one block
  bottomArea: { flexShrink: 0 },

  messageWrapper: { display: 'flex', flexDirection: 'column', paddingBottom: '2px' },
  messageRowInner: { display: 'flex', alignItems: 'flex-end', gap: '6px', maxWidth: '85%' },
  messageAvatar: { width: '28px', height: '28px', flexShrink: 0 },
  messageAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  messageAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '600' },
  bubbleCol: { display: 'flex', flexDirection: 'column', maxWidth: 'calc(100% - 34px)', minWidth: 0 },
  messageBubble: { fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word', overflowWrap: 'anywhere', padding: '9px 13px', display: 'flex', flexDirection: 'column' },
  messageText: { display: 'block' },
  messageImage: { maxWidth: '200px', maxHeight: '200px', borderRadius: '10px', cursor: 'pointer', display: 'block' },
  messageVideo: { maxWidth: '200px', maxHeight: '200px', borderRadius: '10px', display: 'block' },
  fileLink: { display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '4px 6px' },
  reactionsRow: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' },
  reactionBadge: { display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.12s' },
  reactionCount: { fontSize: '11px', fontWeight: '600' },

  replyBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', backgroundColor: '#0d0d0d', borderTop: '1px solid #1a1a1a', gap: '8px' },
  replyBannerClose: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 },

  filePreviewContainer: { padding: '10px 14px', borderTop: '1px solid #1a1a1a', backgroundColor: '#0a0a0a' },
  filePreviewImage: { maxWidth: '120px', maxHeight: '120px', borderRadius: '8px' },
  filePreviewDoc: { display: 'flex', alignItems: 'center', gap: '8px' },
  cancelButton: { padding: '7px 14px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #1a1a1a', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  uploadButton: { padding: '7px 14px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },

  messageInputArea: {
    padding: '10px 12px',
    borderTop: '1px solid #1a1a1a',
    backgroundColor: '#0a0a0a',
    paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
  },
  messageForm: { display: 'flex', gap: '6px', alignItems: 'center' },
  attachButton: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'transparent', color: '#666', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  messageInput: { flex: 1, padding: '10px 14px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '22px', color: '#fff', fontSize: '15px', outline: 'none', minWidth: 0 },
  sendButton: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#fff', color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },

  noChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666', gap: '12px', padding: '20px' },
  noChatTitle: { fontSize: '20px', fontWeight: '600', color: '#fff', margin: 0 },
  noChatText: { fontSize: '14px', color: '#666', margin: 0, textAlign: 'center' },
  noChatBtn: { marginTop: '8px', padding: '10px 20px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },

  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#0a0a0a', borderRadius: '16px', display: 'flex', flexDirection: 'column', border: '1px solid #1a1a1a', overflow: 'hidden' },
  modalHeader: { padding: '18px 20px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: '18px', fontWeight: '600', color: '#fff', margin: 0 },
  modalClose: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
  modalBody: { padding: '16px 20px', flex: 1, overflowY: 'auto' },
  modalSearchWrapper: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '10px', marginBottom: '14px', color: '#666' },
  modalSearchInput: { flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#fff', fontSize: '15px' },
  searchResultItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '10px' },
  searchResultLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  searchResultAvatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' },
  searchResultAvatarImg: { width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' },
  searchResultName: { fontSize: '14px', fontWeight: '500', color: '#fff' },
  addFriendBtn: { padding: '7px 12px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '500' },
};

export default Chat;