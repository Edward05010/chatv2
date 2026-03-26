import React from 'react';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '😡'];

const GroupChatView = ({
  group,
  messages,
  user,
  newMessage,
  onMessageChange,
  onSendMessage,
  onFileSelect,
  messagesEndRef,
  fileInputRef,
  selectedFile,
  filePreview,
  uploading,
  onSendFile,
  onCancelFile,
  onOpenSettings,
  replyTo,
  onCancelReply,
  reactions,
  onContextMenu,
  messageRefs,
  currentUserId,
  scrollToMessage,
}) => {

  const renderReplyQuote = (msg) => {
    if (!msg.replyTo) return null;
    const isPopulated = typeof msg.replyTo === 'object' && msg.replyTo !== null;
    const refId = isPopulated ? msg.replyTo._id : msg.replyTo;
    const orig = isPopulated ? msg.replyTo : messages.find(m => m._id === refId);
    const senderName = orig?.sender?.username || 'Unknown';
    const previewText = orig?.fileUrl
      ? '📎 Media'
      : orig?.content
        ? orig.content.length > 60 ? orig.content.substring(0, 60) + '…' : orig.content
        : 'Original message';

    return (
      <div
        onClick={(e) => { e.stopPropagation(); refId && scrollToMessage?.(refId); }}
        style={{
          borderLeft: '3px solid #555',
          backgroundColor: 'rgba(255,255,255,0.06)',
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
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#aaa' }}>{senderName}</span>
        <span style={{ fontSize: '12px', color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {previewText}
        </span>
      </div>
    );
  };

  const renderReactions = (msg) => {
    if (!reactions) return null;
    const r = reactions[msg._id];
    if (!r || !Object.values(r).some(a => a.length > 0)) return null;
    return (
      <div style={styles.reactionsRow}>
        {Object.entries(r).map(([emoji, users]) =>
          users.length > 0 ? (
            <span key={emoji} style={{
              ...styles.reactionBadge,
              backgroundColor: users.includes(currentUserId) ? '#2d2d2d' : '#141414',
              border: `1px solid ${users.includes(currentUserId) ? '#555' : '#222'}`
            }}>
              {emoji} <span style={styles.reactionCount}>{users.length}</span>
            </span>
          ) : null
        )}
      </div>
    );
  };

  // Icons
  const PaperclipIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>);
  const SendIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
  const FileIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>);
  const SettingsIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/></svg>);
  const CloseIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
  const ReplyIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>);

  return (
    <>
      {/* Group Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.groupAvatar}>
            {group.groupPicture
              ? <img src={group.groupPicture} alt={group.name} style={styles.groupAvatarImg} />
              : <div style={styles.groupAvatarPlaceholder}>{group.name[0].toUpperCase()}</div>
            }
          </div>
          <div style={styles.headerInfo}>
            <div style={styles.groupName}>{group.name}</div>
            <div style={styles.groupMembers}>{group.members.length} members</div>
          </div>
        </div>
        <button onClick={onOpenSettings} style={styles.settingsButton} title="Group Settings">
          <SettingsIcon />
        </button>
      </div>

      {/* Messages */}
      <div style={styles.messagesArea}>
        {messages.map((msg, index) => {
          const isOwn = msg.sender._id === currentUserId;
          const hasReactions = reactions?.[msg._id] && Object.values(reactions[msg._id]).some(a => a.length > 0);

          return (
            <div
              key={index}
              ref={el => { if (msg._id && messageRefs) messageRefs.current[msg._id] = el; }}
              style={styles.messageWrapper}
              onContextMenu={e => onContextMenu?.(e, msg)}
            >
              <div style={styles.messageHeader}>
                {/* Avatar */}
                <div style={styles.senderAvatar}>
                  {msg.sender.profilePicture
                    ? <img src={msg.sender.profilePicture} alt="" style={styles.senderAvatarImg} />
                    : <div style={styles.senderAvatarPlaceholder}>{msg.sender.username[0].toUpperCase()}</div>
                  }
                </div>

                {/* Content */}
                <div style={styles.messageContentWrapper}>
                  <div style={styles.senderInfo}>
                    <span style={styles.senderName}>{msg.sender.username}</span>
                    <span style={styles.messageTime}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Bubble with optional reply quote inside */}
                  <div style={styles.messageBubble}>
                    {msg.replyTo && renderReplyQuote(msg)}
                    <div style={styles.messageContent}>
                      {msg.fileUrl ? (
                        msg.fileType === 'image' ? (
                          <img src={msg.fileUrl} alt={msg.fileName || 'Image'} style={styles.messageImage} onClick={() => window.open(msg.fileUrl, '_blank')} />
                        ) : msg.fileType === 'video' ? (
                          <video src={msg.fileUrl} controls style={styles.messageVideo} />
                        ) : (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={styles.fileLink}>
                            <FileIcon /><span>{msg.fileName || msg.content}</span>
                          </a>
                        )
                      ) : (
                        msg.content
                      )}
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
          <div style={styles.filePreviewContent}>
            {filePreview
              ? filePreview.startsWith('data:image')
                ? <img src={filePreview} alt="Preview" style={styles.filePreviewImage} />
                : <video src={filePreview} style={styles.filePreviewVideo} />
              : <div style={styles.filePreviewDoc}><FileIcon /><span>{selectedFile.name}</span></div>
            }
            <div style={styles.filePreviewActions}>
              <button onClick={onCancelFile} style={styles.cancelButton}>Cancel</button>
              <button onClick={onSendFile} disabled={uploading} style={styles.uploadButton}>
                {uploading ? 'Uploading...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply banner above input */}
      {replyTo && (
        <div style={styles.replyBanner}>
          <div style={styles.replyBannerLeft}>
            <ReplyIcon />
            <div style={{ marginLeft: '10px' }}>
              <div style={styles.replyBannerSender}>Replying to {replyTo.sender?.username}</div>
              <div style={styles.replyBannerText}>
                {replyTo.content
                  ? replyTo.content.length > 65 ? replyTo.content.substring(0, 65) + '…' : replyTo.content
                  : '[media]'}
              </div>
            </div>
          </div>
          <button onClick={onCancelReply} style={styles.replyBannerClose}><CloseIcon /></button>
        </div>
      )}

      {/* Input */}
      <div style={styles.inputArea}>
        <form onSubmit={onSendMessage} style={styles.inputForm}>
          <input type="file" ref={fileInputRef} onChange={onFileSelect} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
          <button type="button" onClick={() => fileInputRef.current?.click()} style={styles.attachButton}>
            <PaperclipIcon />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={`Message ${group.name}`}
            style={styles.input}
          />
          <button type="submit" style={styles.sendButton} disabled={!newMessage.trim()}>
            <SendIcon />
          </button>
        </form>
      </div>
    </>
  );
};

const styles = {
  header: { height: '72px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', backgroundColor: '#0a0a0a' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  groupAvatar: { width: '40px', height: '40px' },
  groupAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  groupAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600' },
  headerInfo: { display: 'flex', flexDirection: 'column' },
  groupName: { fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' },
  groupMembers: { fontSize: '13px', color: '#666666' },
  settingsButton: { background: 'none', border: 'none', color: '#666666', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  messagesArea: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
  messageWrapper: { display: 'flex', flexDirection: 'column' },
  messageHeader: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  senderAvatar: { width: '36px', height: '36px', flexShrink: 0 },
  senderAvatarImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  senderAvatarPlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' },
  messageContentWrapper: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' },
  senderInfo: { display: 'flex', alignItems: 'baseline', gap: '8px' },
  senderName: { fontSize: '15px', fontWeight: '600', color: '#ffffff' },
  messageTime: { fontSize: '12px', color: '#666666' },
  // Bubble wraps reply quote + content together (Discord-style)
  messageBubble: {
    display: 'flex', flexDirection: 'column',
    backgroundColor: '#111111',
    borderRadius: '0 12px 12px 12px',
    padding: '10px 14px',
    maxWidth: '480px',
    wordBreak: 'break-word',
    overflowWrap: 'anywhere',
  },
  messageContent: { color: '#dbdee1', fontSize: '15px', lineHeight: '1.5' },
  messageImage: { maxWidth: '300px', maxHeight: '300px', borderRadius: '12px', cursor: 'pointer', display: 'block', marginTop: '4px' },
  messageVideo: { maxWidth: '300px', maxHeight: '300px', borderRadius: '12px', display: 'block', marginTop: '4px' },
  fileLink: { display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', textDecoration: 'none', padding: '8px 12px', backgroundColor: '#1a1a1a', borderRadius: '8px', marginTop: '4px', width: 'fit-content' },
  reactionsRow: { display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' },
  reactionBadge: { display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '12px', fontSize: '14px', color: '#cccccc' },
  reactionCount: { fontSize: '12px' },
  // Reply banner
  replyBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', backgroundColor: '#0d0d0d', borderTop: '1px solid #1a1a1a' },
  replyBannerLeft: { display: 'flex', alignItems: 'center', color: '#aaaaaa' },
  replyBannerSender: { fontSize: '12px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' },
  replyBannerText: { fontSize: '12px', color: '#777' },
  replyBannerClose: { background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
  // File preview
  filePreviewContainer: { padding: '16px 24px', borderTop: '1px solid #1a1a1a', backgroundColor: '#0a0a0a' },
  filePreviewContent: { display: 'flex', flexDirection: 'column', gap: '12px' },
  filePreviewImage: { maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' },
  filePreviewVideo: { maxWidth: '200px', maxHeight: '200px', borderRadius: '8px' },
  filePreviewDoc: { display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' },
  filePreviewActions: { display: 'flex', gap: '8px' },
  cancelButton: { padding: '8px 16px', backgroundColor: 'transparent', color: '#ffffff', border: '1px solid #1a1a1a', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  uploadButton: { padding: '8px 16px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  // Input
  inputArea: { padding: '24px', borderTop: '1px solid #1a1a1a', backgroundColor: '#0a0a0a' },
  inputForm: { display: 'flex', gap: '12px', alignItems: 'center' },
  attachButton: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'transparent', color: '#666666', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  input: { flex: 1, padding: '14px 20px', backgroundColor: '#000000', border: '1px solid #1a1a1a', borderRadius: '24px', color: '#ffffff', fontSize: '15px', outline: 'none' },
  sendButton: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
};

export default GroupChatView;