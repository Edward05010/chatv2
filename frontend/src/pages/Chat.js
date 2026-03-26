import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import CreateGroupModal from '../components/CreateGroupModal';
import GroupChatView from '../components/GroupChatView';
import GroupSettingsModal from '../components/GroupSettingsModal';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡'];

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

  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});
  const contextMenuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!token) { navigate('/login'); return; }

    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('authenticate', token);

    socketRef.current.on('receive_message', (message) => {
      setMessages(prev => {
        if (chatType === 'group' && selectedGroup && message.group === selectedGroup._id)
          return [...prev, message];
        if (chatType === 'dm' && selectedFriend) {
          const ok =
            (message.sender._id === selectedFriend._id && message.receiver._id === user?.id) ||
            (message.sender._id === user?.id && message.receiver._id === selectedFriend._id);
          if (ok) return [...prev, message];
        }
        return prev;
      });
      loadFriends();
      loadGroups();
    });

    socketRef.current.on('message_sent', (message) => {
      setMessages(prev => [...prev, message]);
      loadFriends();
      loadGroups();
    });

    socketRef.current.on('reaction_updated', ({ messageId, reactions: r }) => {
      setReactions(prev => ({ ...prev, [messageId]: r }));
    });

    loadFriends();
    loadGroups();

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [token, navigate, selectedFriend, selectedGroup, user, chatType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadFriends = async () => {
    try { const r = await axios.get('http://localhost:5000/api/users/friends'); setFriends(r.data); }
    catch (e) { console.error(e); }
  };

  const loadGroups = async () => {
    try { const r = await axios.get('http://localhost:5000/api/groups'); setGroups(r.data); }
    catch (e) { console.error(e); }
  };

  const loadMessages = async (friendId) => {
    try {
      const r = await axios.get(`http://localhost:5000/api/messages/${friendId}`);
      setMessages(r.data);
      const map = {};
      r.data.forEach(m => { if (m.reactions) map[m._id] = m.reactions; });
      setReactions(map);
    } catch (e) { console.error(e); }
  };

  const loadGroupMessages = async (groupId) => {
    try {
      const r = await axios.get(`http://localhost:5000/api/groups/${groupId}/messages`);
      setMessages(r.data);
      const map = {};
      r.data.forEach(m => { if (m.reactions) map[m._id] = m.reactions; });
      setReactions(map);
    } catch (e) { console.error(e); }
  };

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend); setSelectedGroup(null);
    setChatType('dm'); setReplyTo(null); setContextMenu(null);
    loadMessages(friend._id);
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group); setSelectedFriend(null);
    setChatType('group'); setReplyTo(null); setContextMenu(null);
    loadGroupMessages(group._id);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedFriend) return;
    socketRef.current.emit('send_message', {
      receiverId: selectedFriend._id,
      content: newMessage,
      replyTo: replyTo?._id || null
    });
    setNewMessage('');
    setReplyTo(null);
    loadFriends();
  };

  const handleSendGroupMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;
    socketRef.current.emit('send_message', {
      groupId: selectedGroup._id,
      content: newMessage,
      replyTo: replyTo?._id || null
    });
    setNewMessage('');
    setReplyTo(null);
    loadGroups();
  };

  const handleContextMenu = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    const x = e.clientX + 220 > window.innerWidth ? e.clientX - 220 : e.clientX;
    const y = e.clientY + 180 > window.innerHeight ? e.clientY - 180 : e.clientY;
    setContextMenu({ x, y, message: msg });
  };

  const handleReact = (messageId, emoji) => {
    socketRef.current.emit('react_message', { messageId, emoji });
    setContextMenu(null);
    setReactions(prev => {
      const cur = { ...(prev[messageId] || {}) };
      if (!cur[emoji]) cur[emoji] = [];
      const idx = cur[emoji].indexOf(user?.id);
      if (idx > -1) {
        cur[emoji] = cur[emoji].filter(id => id !== user?.id);
        if (!cur[emoji].length) delete cur[emoji];
      } else {
        cur[emoji] = [...cur[emoji], user?.id];
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

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const r = await axios.get(`http://localhost:5000/api/users/search?query=${query}`);
      setSearchResults(r.data);
    } catch (e) { console.error(e); }
  };

  const handleAddFriend = async (userId) => {
    try {
      await axios.post(`http://localhost:5000/api/users/add-friend/${userId}`);
      setSearchQuery(''); setSearchResults([]); setShowSearch(false); loadFriends();
    } catch (e) { alert(e.response?.data?.error || 'Error adding friend'); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
      const up = await axios.post('http://localhost:5000/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
  const handleGroupCreated = (g) => setGroups(prev => [g, ...prev]);
  const handleGroupUpdated = (updated) => {
    setGroups(prev => prev.map(g => g._id === updated._id ? updated : g));
    if (selectedGroup?._id === updated._id) setSelectedGroup(updated);
  };

  const buildMixedSidebar = () => {
    const items = [];
    friends.forEach(f => {
      const ts = f.lastMessage?.createdAt ? new Date(f.lastMessage.createdAt).getTime() : 0;
      items.push({ type: 'dm', data: f, ts });
    });
    groups.forEach(g => {
      const ts = g.lastMessage?.createdAt ? new Date(g.lastMessage.createdAt).getTime() : 0;
      items.push({ type: 'group', data: g, ts });
    });
    return items.sort((a, b) => b.ts - a.ts);
  };

  // Renders quoted reply block inside the bubble — WhatsApp/Discord style
  const renderReplyQuote = (msg, isOwn, allMessages) => {
    if (!msg.replyTo) return null;
    const isPopulated = typeof msg.replyTo === 'object' && msg.replyTo !== null;
    const refId = isPopulated ? msg.replyTo._id : msg.replyTo;
    const orig = isPopulated ? msg.replyTo : allMessages.find(m => m._id === refId);
    const senderName = orig?.sender?.username || 'Unknown';
    const previewText = orig?.fileUrl
      ? '📎 Media'
      : orig?.content
        ? orig.content.length > 60 ? orig.content.substring(0, 60) + '…' : orig.content
        : 'Original message';

    return (
      <div
        onClick={(e) => { e.stopPropagation(); refId && scrollToMessage(refId); }}
        style={{
          borderLeft: `3px solid ${isOwn ? 'rgba(0,0,0,0.3)' : '#555'}`,
          backgroundColor: isOwn ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',
          borderRadius: '4px',
          padding: '5px 8px',
          marginBottom: '6px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
        title="Jump to original message"
      >
        <span style={{ fontSize: '11px', fontWeight: '700', color: isOwn ? 'rgba(0,0,0,0.5)' : '#aaa' }}>
          {senderName}
        </span>
        <span style={{ fontSize: '12px', color: isOwn ? 'rgba(0,0,0,0.4)' : '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {previewText}
        </span>
      </div>
    );
  };

  const renderReactions = (msg) => {
    const r = reactions[msg._id];
    if (!r || !Object.values(r).some(a => a.length > 0)) return null;
    return (
      <div style={s.reactionsRow}>
        {Object.entries(r).map(([emoji, users]) =>
          users.length > 0 ? (
            <button key={emoji}
              onClick={() => handleReact(msg._id, emoji)}
              style={{
                ...s.reactionBadge,
                backgroundColor: users.includes(user?.id) ? '#2d2d2d' : '#141414',
                border: `1px solid ${users.includes(user?.id) ? '#555' : '#222'}`
              }}
            >
              {emoji} <span style={s.reactionCount}>{users.length}</span>
            </button>
          ) : null
        )}
      </div>
    );
  };

  const renderMessageContent = (msg, isOwn) => {
    if (msg.fileUrl) {
      if (msg.fileType === 'image') return (
        <img src={msg.fileUrl} alt={msg.fileName || 'Image'} style={s.messageImage}
          onClick={() => window.open(msg.fileUrl, '_blank')} />
      );
      if (msg.fileType === 'video') return <video src={msg.fileUrl} controls style={s.messageVideo} />;
      return (
        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer"
          style={{ ...s.fileLink, color: isOwn ? '#000' : '#fff' }}>
          <FileIcon /><span>{msg.fileName || msg.content}</span>
        </a>
      );
    }
    return <span style={s.messageText}>{msg.content}</span>;
  };

  const SearchIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>);
  const UserPlusIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>);
  const UsersIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
  const UsersIconLg = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
  const SettingsIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/></svg>);
  const LogoutIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
  const SendIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
  const CloseIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
  const MessageIcon = () => (<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>);
  const PaperclipIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>);
  const FileIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>);
  const ReplyIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>);

  const sidebarItems = buildMixedSidebar();

  return (
    <div style={s.container} onClick={() => setContextMenu(null)}>

      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{ ...s.contextMenu, top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <div style={s.contextEmojiRow}>
            {EMOJI_LIST.map(emoji => {
              const reacted = reactions[contextMenu.message._id]?.[emoji]?.includes(user?.id);
              return (
                <button key={emoji} onClick={() => handleReact(contextMenu.message._id, emoji)} title={emoji}
                  style={{
                    ...s.contextEmojiBtn,
                    transform: reacted ? 'scale(1.3)' : 'scale(1)',
                    backgroundColor: reacted ? '#2a2a2a' : 'transparent',
                    outline: reacted ? '1px solid #555' : 'none', outlineOffset: '1px'
                  }}>
                  {emoji}
                </button>
              );
            })}
          </div>
          <div style={s.contextDivider} />
          <button
            style={s.contextMenuItem}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1a1a1a'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            onClick={() => { setReplyTo(contextMenu.message); setContextMenu(null); }}
          >
            <ReplyIcon /><span>Reply</span>
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.searchBar}>
          <div style={s.searchInputWrapper} onClick={() => setShowSearch(true)}>
            <SearchIcon />
            <input type="text" placeholder="Search or start new chat" style={s.searchInput} readOnly />
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #1a1a1a' }}>
          <button onClick={() => setShowCreateGroup(true)} style={s.createGroupButton}>
            <UsersIconLg /> Create Group
          </button>
        </div>
        <div style={s.friendsList}>
          {sidebarItems.map(item => {
            const isDm = item.type === 'dm';
            const data = item.data;
            const isActive = isDm
              ? chatType === 'dm' && selectedFriend?._id === data._id
              : chatType === 'group' && selectedGroup?._id === data._id;
            const pic = isDm ? data.profilePicture : data.groupPicture;
            const name = isDm ? data.username : data.name;
            const lm = data.lastMessage;
            const preview = isDm
              ? lm ? `${lm.isSentByMe ? 'You: ' : ''}${lm.content.length > 28 ? lm.content.substring(0, 28) + '…' : lm.content}` : 'No messages yet'
              : lm ? (lm.content.length > 28 ? lm.content.substring(0, 28) + '…' : lm.content) : `${data.members?.length || 0} members`;
            return (
              <div key={(isDm ? 'dm_' : 'grp_') + data._id}
                onClick={() => isDm ? handleFriendSelect(data) : handleGroupSelect(data)}
                style={{ ...s.friendItem, backgroundColor: isActive ? '#1a1a1a' : 'transparent' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#0f0f0f'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = isActive ? '#1a1a1a' : 'transparent'; }}
              >
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
            <button onClick={() => navigate('/profile')} style={s.iconBtn} title="Settings"><SettingsIcon /></button>
            <button onClick={logout} style={s.iconBtn} title="Logout"><LogoutIcon /></button>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div style={s.chatArea}>
        {chatType === 'group' && selectedGroup ? (
          <GroupChatView
            group={selectedGroup}
            messages={messages}
            user={user}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={handleSendGroupMessage}
            onFileSelect={handleFileSelect}
            messagesEndRef={messagesEndRef}
            fileInputRef={fileInputRef}
            selectedFile={selectedFile}
            filePreview={filePreview}
            uploading={uploading}
            onSendFile={handleSendFile}
            onCancelFile={cancelFileUpload}
            onOpenSettings={() => setShowGroupSettings(true)}
            replyTo={replyTo}
            onCancelReply={() => setReplyTo(null)}
            reactions={reactions}
            onContextMenu={handleContextMenu}
            messageRefs={messageRefs}
            currentUserId={user?.id}
            scrollToMessage={scrollToMessage}
          />
        ) : selectedFriend ? (
          <>
            <div style={s.chatHeader}>
              <div style={s.chatHeaderLeft}>
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

            <div style={s.messagesArea}>
              {messages.map((msg, index) => {
                const isOwn = msg.sender.username === user?.username;
                const hasReactions = reactions[msg._id] && Object.values(reactions[msg._id]).some(a => a.length > 0);
                return (
                  <div key={index}
                    ref={el => { if (msg._id) messageRefs.current[msg._id] = el; }}
                    style={{ ...s.messageWrapper, alignItems: isOwn ? 'flex-end' : 'flex-start' }}
                    onContextMenu={e => handleContextMenu(e, msg)}
                  >
                    <div style={{ ...s.messageRowInner, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                      <div style={s.messageAvatar}>
                        {isOwn
                          ? user?.profilePicture ? <img src={user.profilePicture} alt="" style={s.messageAvatarImg} /> : <div style={s.messageAvatarPlaceholder}>{user?.username?.[0]?.toUpperCase()}</div>
                          : selectedFriend.profilePicture ? <img src={selectedFriend.profilePicture} alt="" style={s.messageAvatarImg} /> : <div style={s.messageAvatarPlaceholder}>{selectedFriend.username[0].toUpperCase()}</div>
                        }
                      </div>
                      <div style={s.bubbleCol}>
                        <div style={{
                          ...s.messageBubble,
                          backgroundColor: isOwn ? '#ffffff' : '#1a1a1a',
                          color: isOwn ? '#000000' : '#ffffff',
                          borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        }}>
                          {/* Reply quote at top of bubble */}
                          {msg.replyTo && renderReplyQuote(msg, isOwn, messages)}
                          {/* Message content */}
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

            {selectedFile && (
              <div style={s.filePreviewContainer}>
                <div style={s.filePreviewContent}>
                  {filePreview
                    ? filePreview.startsWith('data:image')
                      ? <img src={filePreview} alt="Preview" style={s.filePreviewImage} />
                      : <video src={filePreview} style={s.filePreviewVideo} />
                    : <div style={s.filePreviewDoc}><FileIcon /><span>{selectedFile.name}</span></div>
                  }
                  <div style={s.filePreviewActions}>
                    <button onClick={cancelFileUpload} style={s.cancelButton}>Cancel</button>
                    <button onClick={handleSendFile} disabled={uploading} style={s.uploadButton}>{uploading ? 'Uploading…' : 'Send'}</button>
                  </div>
                </div>
              </div>
            )}

            {/* Reply banner above input */}
            {replyTo && (
              <div style={s.replyBanner}>
                <div style={s.replyBannerLeft}>
                  <ReplyIcon />
                  <div style={{ marginLeft: '10px' }}>
                    <div style={s.replyBannerSender}>Replying to {replyTo.sender?.username}</div>
                    <div style={s.replyBannerText}>
                      {replyTo.content ? (replyTo.content.length > 65 ? replyTo.content.substring(0, 65) + '…' : replyTo.content) : '[media]'}
                    </div>
                  </div>
                </div>
                <button onClick={() => setReplyTo(null)} style={s.replyBannerClose}><CloseIcon /></button>
              </div>
            )}

            <div style={s.messageInputArea}>
              <form onSubmit={handleSendMessage} style={s.messageForm}>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
                <button type="button" onClick={() => fileInputRef.current?.click()} style={s.attachButton}><PaperclipIcon /></button>
                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedFriend.username}`} style={s.messageInput} />
                <button type="submit" style={s.sendButton} disabled={!newMessage.trim()}><SendIcon /></button>
              </form>
            </div>
          </>
        ) : (
          <div style={s.noChat}>
            <MessageIcon />
            <h2 style={s.noChatTitle}>Select a conversation</h2>
            <p style={s.noChatText}>Choose from your existing conversations, start a new one, or create a group</p>
          </div>
        )}
      </div>

      {showSearch && (
        <div style={s.modal} onClick={() => setShowSearch(false)}>
          <div style={s.modalContent} onClick={e => e.stopPropagation()}>
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
                  : searchQuery.length >= 2 ? <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666', fontSize: '15px' }}>No users found</div> : null
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
  container: { display: 'flex', height: '100vh', backgroundColor: '#000000', position: 'relative', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#ffffff' },
  contextMenu: { position: 'fixed', zIndex: 9999, backgroundColor: '#111111', border: '1px solid #2a2a2a', borderRadius: '14px', padding: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.75)', minWidth: '210px' },
  contextEmojiRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 4px 8px', gap: '2px' },
  contextEmojiBtn: { border: 'none', cursor: 'pointer', fontSize: '22px', padding: '6px 8px', borderRadius: '8px', transition: 'transform 0.12s, background 0.12s', lineHeight: 1 },
  contextDivider: { height: '1px', backgroundColor: '#222222', margin: '2px 0 4px' },
  contextMenuItem: { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'transparent', border: 'none', color: '#dddddd', cursor: 'pointer', fontSize: '14px', borderRadius: '8px', transition: 'background 0.12s', textAlign: 'left' },
  sidebar: { width: '320px', backgroundColor: '#0a0a0a', borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column' },
  searchBar: { padding: '20px', borderBottom: '1px solid #1a1a1a' },
  searchInputWrapper: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#000000', borderRadius: '12px', border: '1px solid #1a1a1a', color: '#666666', cursor: 'pointer' },
  searchInput: { flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#ffffff', fontSize: '14px', cursor: 'pointer' },
  createGroupButton: { width: '100%', padding: '10px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  friendsList: { flex: 1, overflowY: 'auto', padding: '8px' },
  friendItem: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'background-color 0.15s', marginBottom: '2px' },
  friendAvatarWrap: { width: '48px', height: '48px', marginRight: '12px', flexShrink: 0, position: 'relative' },
  avatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '600' },
  groupBadge: { position: 'absolute', bottom: '-1px', right: '-3px', width: '17px', height: '17px', borderRadius: '50%', backgroundColor: '#2a2a2a', border: '1.5px solid #0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888888' },
  friendInfo: { flex: 1, overflow: 'hidden' },
  friendName: { fontSize: '15px', fontWeight: '500', color: '#ffffff', marginBottom: '3px' },
  friendStatus: { fontSize: '13px', color: '#666666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userFooter: { padding: '16px', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#000000' },
  userFooterLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  userAvatar: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600', overflow: 'hidden' },
  userAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  userInfo: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: '14px', fontWeight: '500', color: '#ffffff' },
  userStatus: { fontSize: '12px', color: '#666666' },
  userFooterActions: { display: 'flex', gap: '8px' },
  iconBtn: { background: 'none', border: 'none', color: '#666666', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000000' },
  chatHeader: { height: '72px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 24px', backgroundColor: '#0a0a0a' },
  chatHeaderLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  chatAvatar: { width: '40px', height: '40px' },
  chatAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  chatAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600' },
  chatHeaderName: { fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' },
  chatHeaderStatus: { fontSize: '13px', color: '#666666' },
  messagesArea: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '6px' },
  messageWrapper: { display: 'flex', flexDirection: 'column', paddingBottom: '2px' },
  messageRowInner: { display: 'flex', alignItems: 'flex-end', gap: '8px', maxWidth: '70%' },
  messageAvatar: { width: '32px', height: '32px', flexShrink: 0 },
  messageAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  messageAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '600' },
  bubbleCol: { display: 'flex', flexDirection: 'column', maxWidth: 'calc(100% - 40px)', minWidth: 0 },
  messageBubble: {
    fontSize: '15px', lineHeight: '1.5',
    wordBreak: 'break-word', overflowWrap: 'anywhere',
    display: 'flex', flexDirection: 'column',  // flex column so reply quote stacks above text
    padding: '10px 14px',
    maxWidth: '480px',
  },
  messageText: { display: 'block' },
  messageImage: { maxWidth: '300px', maxHeight: '300px', borderRadius: '12px', cursor: 'pointer', display: 'block' },
  messageVideo: { maxWidth: '300px', maxHeight: '300px', borderRadius: '12px', display: 'block' },
  fileLink: { display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', padding: '4px 8px' },
  replyBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', backgroundColor: '#0d0d0d', borderTop: '1px solid #1a1a1a' },
  replyBannerLeft: { display: 'flex', alignItems: 'center', color: '#aaaaaa' },
  replyBannerSender: { fontSize: '12px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' },
  replyBannerText: { fontSize: '12px', color: '#777' },
  replyBannerClose: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
  reactionsRow: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '5px', paddingLeft: '2px' },
  reactionBadge: { display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', cursor: 'pointer', fontSize: '14px', color: '#cccccc', transition: 'all 0.12s' },
  reactionCount: { fontSize: '12px' },
  filePreviewContainer: { padding: '16px 24px', borderTop: '1px solid #1a1a1a', backgroundColor: '#0a0a0a' },
  filePreviewContent: { display: 'flex', flexDirection: 'column', gap: '12px' },
  filePreviewImage: { maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' },
  filePreviewVideo: { maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' },
  filePreviewDoc: { display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' },
  filePreviewActions: { display: 'flex', gap: '8px' },
  cancelButton: { padding: '8px 16px', backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #1a1a1a', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  uploadButton: { padding: '8px 16px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  messageInputArea: { padding: '24px', borderTop: '1px solid #1a1a1a', backgroundColor: '#0a0a0a' },
  messageForm: { display: 'flex', gap: '12px', alignItems: 'center' },
  attachButton: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'transparent', color: '#666', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  messageInput: { flex: 1, padding: '14px 20px', backgroundColor: '#000000', border: '1px solid #1a1a1a', borderRadius: '24px', color: '#ffffff', fontSize: '15px', outline: 'none' },
  sendButton: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  noChat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#666', gap: '16px' },
  noChatTitle: { fontSize: '24px', fontWeight: '600', color: '#ffffff', margin: 0 },
  noChatText: { fontSize: '15px', color: '#666', margin: 0 },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { backgroundColor: '#0a0a0a', borderRadius: '16px', width: '90%', maxWidth: '500px', maxHeight: '600px', display: 'flex', flexDirection: 'column', border: '1px solid #1a1a1a' },
  modalHeader: { padding: '24px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: 0 },
  modalClose: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
  modalBody: { padding: '24px', flex: 1, overflowY: 'auto' },
  modalSearchWrapper: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', backgroundColor: '#000000', border: '1px solid #1a1a1a', borderRadius: '12px', marginBottom: '20px', color: '#666' },
  modalSearchInput: { flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#ffffff', fontSize: '15px' },
  searchResultItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#000000', border: '1px solid #1a1a1a', borderRadius: '12px' },
  searchResultLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  searchResultAvatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600' },
  searchResultAvatarImg: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
  searchResultName: { fontSize: '15px', fontWeight: '500', color: '#ffffff' },
  addFriendBtn: { padding: '8px 14px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '500' },
};

export default Chat;