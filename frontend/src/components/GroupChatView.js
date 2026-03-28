import React, { useRef } from 'react';
import { REACTIONS } from './Chat';

const GroupChatView = ({
  group, messages, user,
  newMessage, onMessageChange, onSendMessage,
  onFileSelect, messagesEndRef, fileInputRef,
  selectedFile, filePreview, uploading,
  onSendFile, onCancelFile, onOpenSettings,
  replyTo, onCancelReply, reactions,
  onContextMenu, onTouchStart, onTouchEnd,
  messageRefs, currentUserId, scrollToMessage,
  isMobile, onBack, onReact, currentUser,
}) => {
  const longPressTimer = useRef(null);

  const handleTouchStart = (msg) => {
    longPressTimer.current = setTimeout(() => {
      onContextMenu?.({
        preventDefault: () => {}, stopPropagation: () => {},
        clientX: window.innerWidth / 2, clientY: window.innerHeight / 2,
        centered: true
      }, msg);
    }, 500);
  };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  const renderReplyQuote = (msg) => {
    if (!msg.replyTo) return null;
    const isPopulated = typeof msg.replyTo === 'object' && msg.replyTo !== null;
    const refId = isPopulated ? msg.replyTo._id : msg.replyTo;
    const orig = isPopulated ? msg.replyTo : messages.find(m => m._id === refId);
    const senderName = orig?.sender?.username || 'Unknown';
    const previewText = orig?.fileUrl ? '📎 Media' : orig?.content
      ? (orig.content.length > 50 ? orig.content.substring(0, 50) + '…' : orig.content)
      : 'Original message';
    return (
      <div onClick={(e) => { e.stopPropagation(); refId && scrollToMessage?.(refId); }}
        style={{ borderLeft: '3px solid #555', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '5px 8px', marginBottom: '6px', cursor: 'pointer' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: '#aaa', marginBottom: '2px' }}>{senderName}</div>
        <div style={{ fontSize: '12px', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{previewText}</div>
      </div>
    );
  };

  const renderReactions = (msg) => {
    if (!reactions) return null;
    const r = reactions[msg._id];
    if (!r || !Object.values(r).some(a => a.length > 0)) return null;
    return (
      <div style={styles.reactionsRow}>
        {REACTIONS.map(({ id, svg, color }) => {
          const users = r[id] || [];
          if (!users.length) return null;
          const reacted = users.includes(currentUserId);
          return (
            <button key={id} onClick={() => onReact?.(msg._id, id)}
              style={{ ...styles.reactionBadge, backgroundColor: reacted ? `${color}22` : '#141414', border: `1px solid ${reacted ? color : '#222'}` }}>
              {svg}
              <span style={{ ...styles.reactionCount, color: reacted ? color : '#888' }}>{users.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const PaperclipIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>);
  const SendIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
  const FileIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>);
  const SettingsIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/></svg>);
  const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
  const ReplyIcon = () => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>);
  const BackIcon = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>);

  return (
    <>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {isMobile && (
            <button onClick={onBack} style={styles.backBtn}><BackIcon /></button>
          )}
          <div style={styles.groupAvatar}>
            {group.groupPicture
              ? <img src={group.groupPicture} alt={group.name} style={styles.groupAvatarImg} />
              : <div style={styles.groupAvatarPlaceholder}>{group.name[0].toUpperCase()}</div>
            }
          </div>
          <div>
            <div style={styles.groupName}>{group.name}</div>
            <div style={styles.groupMembers}>{group.members.length} members</div>
          </div>
        </div>
        <button onClick={onOpenSettings} style={styles.settingsButton}><SettingsIcon /></button>
      </div>

      {/* Messages */}
      <div style={styles.messagesArea} className="messages-scroll">
        {messages.map((msg, index) => {
          const isOwn = msg.sender._id === currentUserId;
          const hasReactions = reactions?.[msg._id] && Object.values(reactions[msg._id]).some(a => a.length > 0);
          return (
            <div key={index}
              ref={el => { if (msg._id && messageRefs) messageRefs.current[msg._id] = el; }}
              style={styles.messageWrapper}
              onContextMenu={e => onContextMenu?.(e, msg)}
              onTouchStart={() => handleTouchStart(msg)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchEnd}>
              <div style={styles.messageRow}>
                <div style={styles.senderAvatar}>
                  {msg.sender.profilePicture
                    ? <img src={msg.sender.profilePicture} alt="" style={styles.senderAvatarImg} />
                    : <div style={styles.senderAvatarPlaceholder}>{msg.sender.username[0].toUpperCase()}</div>
                  }
                </div>
                <div style={styles.messageContentWrapper}>
                  <div style={styles.senderInfo}>
                    <span style={{ ...styles.senderName, color: isOwn ? '#a0c4ff' : '#fff' }}>{msg.sender.username}</span>
                    <span style={styles.messageTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={styles.messageBubble}>
                    {msg.replyTo && renderReplyQuote(msg)}
                    <div style={styles.messageContent}>
                      {msg.fileUrl ? (
                        msg.fileType === 'image'
                          ? <img src={msg.fileUrl} alt={msg.fileName || 'Image'} style={styles.messageImage} onClick={() => window.open(msg.fileUrl, '_blank')} />
                          : msg.fileType === 'video'
                            ? <video src={msg.fileUrl} controls style={styles.messageVideo} />
                            : <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.fileLink}><FileIcon /><span>{msg.fileName || msg.content}</span></a>
                      ) : msg.content}
                    </div>
                  </div>
                  {hasReactions && renderReactions(msg)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div style={styles.filePreviewContainer}>
          {filePreview
            ? (filePreview.startsWith('data:image') ? <img src={filePreview} alt="Preview" style={styles.filePreviewImage} /> : <video src={filePreview} style={styles.filePreviewImage} />)
            : <div style={styles.filePreviewDoc}><FileIcon /><span style={{ fontSize: '13px', color: '#fff' }}>{selectedFile.name}</span></div>
          }
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={onCancelFile} style={styles.cancelButton}>Cancel</button>
            <button onClick={onSendFile} disabled={uploading} style={styles.uploadButton}>{uploading ? 'Sending…' : 'Send'}</button>
          </div>
        </div>
      )}

      {/* Reply Banner */}
      {replyTo && (
        <div style={styles.replyBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <ReplyIcon />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>Replying to {replyTo.sender?.username}</div>
              <div style={{ fontSize: '12px', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyTo.content || '[media]'}</div>
            </div>
          </div>
          <button onClick={onCancelReply} style={styles.replyBannerClose}><CloseIcon /></button>
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <form onSubmit={onSendMessage} style={styles.inputForm}>
          <input type="file" ref={fileInputRef} onChange={onFileSelect} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.attachButton}><PaperclipIcon /></button>
          <input type="text" value={newMessage} onChange={(e) => onMessageChange(e.target.value)}
            placeholder={`Message ${group.name}…`} style={styles.input} />
          <button type="submit" style={styles.sendButton} disabled={!newMessage.trim()}><SendIcon /></button>
        </form>
      </div>
    </>
  );
};

const styles = {
  header: { height: '58px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', backgroundColor: '#0a0a0a', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '8px' },
  backBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center', flexShrink: 0 },
  groupAvatar: { width: '34px', height: '34px', flexShrink: 0 },
  groupAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  groupAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' },
  groupName: { fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '1px' },
  groupMembers: { fontSize: '11px', color: '#666' },
  settingsButton: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  messagesArea: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', WebkitOverflowScrolling: 'touch' },
  messageWrapper: { display: 'flex', flexDirection: 'column' },
  messageRow: { display: 'flex', gap: '8px', alignItems: 'flex-start' },
  senderAvatar: { width: '30px', height: '30px', flexShrink: 0 },
  senderAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  senderAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '600' },
  messageContentWrapper: { flex: 1, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 },
  senderInfo: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  senderName: { fontSize: '13px', fontWeight: '600' },
  messageTime: { fontSize: '10px', color: '#555' },
  messageBubble: { display: 'flex', flexDirection: 'column', backgroundColor: '#111', borderRadius: '0 10px 10px 10px', padding: '8px 12px', maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'anywhere' },
  messageContent: { color: '#dbdee1', fontSize: '14px', lineHeight: '1.5' },
  messageImage: { maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer', display: 'block', marginTop: '4px' },
  messageVideo: { maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', display: 'block', marginTop: '4px' },
  fileLink: { display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', textDecoration: 'none', padding: '6px 10px', backgroundColor: '#1a1a1a', borderRadius: '6px', marginTop: '4px', width: 'fit-content' },
  reactionsRow: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' },
  reactionBadge: { display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 7px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.12s' },
  reactionCount: { fontSize: '11px', fontWeight: '600' },
  replyBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', backgroundColor: '#0d0d0d', borderTop: '1px solid #1a1a1a', flexShrink: 0, gap: '8px' },
  replyBannerClose: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 },
  filePreviewContainer: { padding: '10px 14px', borderTop: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', flexShrink: 0 },
  filePreviewImage: { maxWidth: '120px', maxHeight: '120px', borderRadius: '8px' },
  filePreviewDoc: { display: 'flex', alignItems: 'center', gap: '8px' },
  cancelButton: { padding: '7px 14px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #1a1a1a', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' },
  uploadButton: { padding: '7px 14px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' },
  inputArea: { padding: '10px 12px', borderTop: '1px solid #1a1a1a', backgroundColor: '#0a0a0a', flexShrink: 0, paddingBottom: 'max(10px, env(safe-area-inset-bottom))' },
  inputForm: { display: 'flex', gap: '6px', alignItems: 'center' },
  attachButton: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'transparent', color: '#666', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  input: { flex: 1, padding: '10px 14px', backgroundColor: '#000', border: '1px solid #1a1a1a', borderRadius: '22px', color: '#fff', fontSize: '15px', outline: 'none', minWidth: 0 },
  sendButton: { width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#fff', color: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
};

export default GroupChatView;