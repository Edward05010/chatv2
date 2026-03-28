import React, { useRef, useState } from 'react';
import { REACTIONS, MessageMenu, SwipeableMessage } from './Chat';

// Re-export so GroupChatView can use the same components
// (They are exported from Chat.js)

const GroupChatView = ({
  group, messages, user,
  newMessage, onMessageChange, onSendMessage,
  onFileSelect, messagesEndRef, fileInputRef,
  selectedFile, filePreview, uploading,
  onSendFile, onCancelFile, onOpenSettings,
  replyTo, onCancelReply, reactions,
  messageRefs, currentUserId, scrollToMessage,
  isMobile, onBack, onReact, onReply,
}) => {

  const renderReplyQuote = (msg) => {
    if (!msg.replyTo) return null;
    const pop = typeof msg.replyTo === 'object';
    const refId = pop ? msg.replyTo._id : msg.replyTo;
    const orig = pop ? msg.replyTo : messages.find(m => m._id === refId);
    const senderName = orig?.sender?.username || 'Unknown';
    const preview = orig?.fileUrl ? '📎 Media' : orig?.content
      ? (orig.content.length > 50 ? orig.content.substring(0, 50) + '…' : orig.content)
      : 'Original message';
    return (
      <div onClick={(e) => { e.stopPropagation(); refId && scrollToMessage?.(refId); }}
        style={{ borderLeft: '3px solid #555', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '5px 8px', marginBottom: 6, cursor: 'pointer' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', marginBottom: 2 }}>{senderName}</div>
        <div style={{ fontSize: 12, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{preview}</div>
      </div>
    );
  };

  const renderReactions = (msg) => {
    if (!reactions) return null;
    const r = reactions[msg._id];
    if (!r || !Object.values(r).some(a => a.length > 0)) return null;
    return (
      <div style={st.reactionsRow}>
        {REACTIONS.map(({ id, svg, color }) => {
          const users = r[id] || []; if (!users.length) return null;
          const reacted = users.includes(currentUserId);
          return (
            <button key={id} onClick={() => onReact?.(msg._id, id)}
              style={{ ...st.reactionBadge, backgroundColor: reacted ? `${color}22` : '#141414', border: `1px solid ${reacted ? color : '#222'}` }}>
              {svg}<span style={{ ...st.reactionCount, color: reacted ? color : '#888' }}>{users.length}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const PaperclipIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>;
  const SendIcon      = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
  const FileIcon      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>;
  const SettingsIcon  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m9-9h-6m-6 0H3"/></svg>;
  const CloseIcon     = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
  const ReplyIcon     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>;
  const BackIcon      = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>;
  const SwipeHintIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 17 4 12 9 7"/><path d="M20 12H4"/></svg>;

  return (
    <>
      {/* Fixed header */}
      <div style={st.header}>
        <div style={st.headerLeft}>
          {isMobile && <button onClick={onBack} style={st.backBtn}><BackIcon /></button>}
          <div style={st.groupAv}>
            {group.groupPicture
              ? <img src={group.groupPicture} alt={group.name} style={st.groupAvImg} />
              : <div style={st.groupAvPh}>{group.name[0].toUpperCase()}</div>
            }
          </div>
          <div>
            <div style={st.groupName}>{group.name}</div>
            <div style={st.groupSub}>{group.members.length} members</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isMobile && (
            <div style={{ color: '#444', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
              <SwipeHintIcon /> swipe
            </div>
          )}
          <button onClick={onOpenSettings} style={st.settingsBtn}><SettingsIcon /></button>
        </div>
      </div>

      {/* Scrollable messages */}
      <div style={st.msgs}>
        {messages.map((msg, idx) => {
          const isOwn = msg.sender._id === currentUserId;
          const hasR  = reactions?.[msg._id] && Object.values(reactions[msg._id]).some(a => a.length > 0);
          return (
            <div key={idx}
              ref={el => { if (msg._id && messageRefs) messageRefs.current[msg._id] = el; }}
              style={{ ...st.msgWrapper, userSelect: 'none' }}>
              <SwipeableMessage isOwn={false} onSwipe={() => onReply?.(msg)}>
                <div style={st.msgRow}>
                  <div style={st.senderAv}>
                    {msg.sender.profilePicture
                      ? <img src={msg.sender.profilePicture} alt="" style={st.senderAvImg} />
                      : <div style={st.senderAvPh}>{msg.sender.username[0].toUpperCase()}</div>
                    }
                  </div>
                  <div style={st.msgContent}>
                    <div style={st.senderInfo}>
                      <span style={{ ...st.senderName, color: isOwn ? '#a0c4ff' : '#fff' }}>{msg.sender.username}</span>
                      <span style={st.msgTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                      <div style={st.bubble}>
                        {msg.replyTo && renderReplyQuote(msg)}
                        <div style={st.bubbleText}>
                          {msg.fileUrl
                            ? (msg.fileType === 'image'
                                ? <img src={msg.fileUrl} alt={msg.fileName || 'Image'} style={st.msgImg} onClick={() => window.open(msg.fileUrl, '_blank')} />
                                : msg.fileType === 'video'
                                  ? <video src={msg.fileUrl} controls style={st.msgVideo} />
                                  : <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" style={st.fileLink}><FileIcon /><span>{msg.fileName || msg.content}</span></a>
                              )
                            : msg.content
                          }
                        </div>
                      </div>
                      {/* Three-dot menu */}
                      <div style={{ paddingTop: 4, flexShrink: 0 }}>
                        <MessageMenu
                          msg={msg} isOwn={isOwn}
                          onReply={onReply}
                          onReact={onReact}
                          currentUserId={currentUserId}
                          reactions={reactions}
                        />
                      </div>
                    </div>
                    {hasR && renderReactions(msg)}
                  </div>
                </div>
              </SwipeableMessage>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed bottom */}
      <div style={st.bottom}>
        {selectedFile && (
          <div style={st.filePrev}>
            {filePreview
              ? (filePreview.startsWith('data:image') ? <img src={filePreview} alt="Preview" style={st.filePrevImg} /> : <video src={filePreview} style={st.filePrevImg} />)
              : <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileIcon /><span style={{ fontSize: 13, color: '#fff' }}>{selectedFile.name}</span></div>
            }
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={onCancelFile} style={st.cancelBtn}>Cancel</button>
              <button onClick={onSendFile} disabled={uploading} style={st.sendFileBtn}>{uploading ? 'Sending…' : 'Send'}</button>
            </div>
          </div>
        )}
        {replyTo && (
          <div style={st.replyBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <ReplyIcon />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Replying to {replyTo.sender?.username}</div>
                <div style={{ fontSize: 12, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyTo.content || '[media]'}</div>
              </div>
            </div>
            <button onClick={onCancelReply} style={st.replyClose}><CloseIcon /></button>
          </div>
        )}
        <div style={st.inputArea}>
          <form onSubmit={onSendMessage} style={st.inputForm}>
            <input type="file" ref={fileInputRef} onChange={onFileSelect} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip" />
            <button type="button" onClick={() => fileInputRef.current?.click()} style={st.attachBtn}><PaperclipIcon /></button>
            <input type="text" value={newMessage} onChange={e => onMessageChange(e.target.value)}
              placeholder={`Message ${group.name}…`} style={st.input} />
            <button type="submit" style={st.sendBtn} disabled={!newMessage.trim()}><SendIcon /></button>
          </form>
        </div>
      </div>
    </>
  );
};

const st = {
  header: { height: 58, borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', backgroundColor: '#0a0a0a', flexShrink: 0 },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  backBtn: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center', flexShrink: 0 },
  groupAv: { width: 34, height: 34, flexShrink: 0 },
  groupAvImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  groupAvPh: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600 },
  groupName: { fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 1 },
  groupSub: { fontSize: 11, color: '#666' },
  settingsBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  msgs: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, WebkitOverflowScrolling: 'touch' },

  msgWrapper: { display: 'flex', flexDirection: 'column' },
  msgRow: { display: 'flex', gap: 8, alignItems: 'flex-start' },
  senderAv: { width: 30, height: 30, flexShrink: 0 },
  senderAvImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' },
  senderAvPh: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 },
  msgContent: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  senderInfo: { display: 'flex', alignItems: 'baseline', gap: 6 },
  senderName: { fontSize: 13, fontWeight: 600 },
  msgTime: { fontSize: 10, color: '#555' },
  bubble: { display: 'flex', flexDirection: 'column', backgroundColor: '#111', borderRadius: '0 10px 10px 10px', padding: '8px 12px', maxWidth: '100%', wordBreak: 'break-word', overflowWrap: 'anywhere' },
  bubbleText: { color: '#dbdee1', fontSize: 14, lineHeight: 1.5 },
  msgImg: { maxWidth: 200, maxHeight: 200, borderRadius: 8, cursor: 'pointer', display: 'block', marginTop: 4 },
  msgVideo: { maxWidth: 200, maxHeight: 200, borderRadius: 8, display: 'block', marginTop: 4 },
  fileLink: { display: 'flex', alignItems: 'center', gap: 6, color: '#fff', textDecoration: 'none', padding: '6px 10px', backgroundColor: '#1a1a1a', borderRadius: 6, marginTop: 4, width: 'fit-content' },
  reactionsRow: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  reactionBadge: { display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.12s' },
  reactionCount: { fontSize: 11, fontWeight: 600 },

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
};

export default GroupChatView;