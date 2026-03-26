import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GroupSettingsModal = ({ show, onClose, group, onGroupUpdated, currentUserId, allFriends = [] }) => {
  const [groupName, setGroupName] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [addSearch, setAddSearch] = useState('');

  useEffect(() => {
    if (group) { setGroupName(group.name || ''); setActiveTab('members'); }
  }, [group]);

  if (!show || !group) return null;

  const isAdmin = group.admin === currentUserId || group.admin?._id === currentUserId;
  const currentMemberIds = group.members?.map(m => m._id || m) || [];

  // FIX 3: All members can search and add friends, not just admins
  const eligibleFriends = allFriends
    .filter(f => !currentMemberIds.includes(f._id))
    .filter(f => f.username.toLowerCase().includes(addSearch.toLowerCase()));

  const handleSaveName = async () => {
    if (!groupName.trim()) return;
    setSaving(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/groups/${group._id}`, { name: groupName });
      onGroupUpdated(res.data);
    } catch (e) { alert('Error updating group name'); }
    finally { setSaving(false); }
  };

  const handleAddMember = async (userId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/groups/${group._id}/members`, { userId });
      onGroupUpdated(res.data);
      setAddSearch('');
    } catch (e) { alert(e.response?.data?.error || 'Error adding member'); }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the group?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/groups/${group._id}/members/${userId}`);
      onGroupUpdated(res.data);
    } catch (e) { alert(e.response?.data?.error || 'Error removing member'); }
  };

  const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );

  const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );

  // FIX 3: 'add' tab is always visible to all members; 'settings' is admin-only
  const tabs = ['members', 'add', ...(isAdmin ? ['settings'] : [])];
  const tabLabels = { members: 'Members', add: '+ Add People', settings: 'Settings' };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>

        <div style={s.header}>
          <div style={s.groupInfo}>
            <div style={s.groupAvatar}>
              {group.groupPicture
                ? <img src={group.groupPicture} alt="" style={s.groupAvatarImg} />
                : <span>{group.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <div style={s.groupName}>{group.name}</div>
              <div style={s.memberCount}>{group.members?.length || 0} members</div>
            </div>
          </div>
          <button onClick={onClose} style={s.closeBtn}><CloseIcon /></button>
        </div>

        <div style={s.tabs}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}>
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div style={s.body}>

          {/* ── Members Tab ── */}
          {activeTab === 'members' && (
            <div style={s.list}>
              {group.members?.map(member => {
                const mId = member._id || member;
                const mName = member.username || 'Unknown';
                const mPic = member.profilePicture;
                const isGroupAdmin = group.admin === mId || group.admin?._id === mId;
                return (
                  <div key={mId} style={s.memberItem}>
                    <div style={s.memberLeft}>
                      <div style={s.memberAvatar}>
                        {mPic
                          ? <img src={mPic} alt="" style={s.avatarImg} />
                          : <span>{mName[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div>
                        <div style={s.memberName}>{mName}</div>
                        {isGroupAdmin && <div style={s.adminBadge}>Admin</div>}
                        {mId === currentUserId && !isGroupAdmin && (
                          <div style={s.youBadge}>You</div>
                        )}
                      </div>
                    </div>
                    {isAdmin && !isGroupAdmin && mId !== currentUserId && (
                      <button onClick={() => handleRemoveMember(mId)} style={s.removeBtn}>Remove</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Add People Tab — visible to ALL members ── */}
          {activeTab === 'add' && (
            <div>
              <div style={s.searchWrapper}>
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search friends to add…"
                  value={addSearch}
                  onChange={e => setAddSearch(e.target.value)}
                  style={s.searchInput}
                  autoFocus
                />
              </div>
              <div style={s.list}>
                {eligibleFriends.length === 0 ? (
                  <div style={s.emptyState}>
                    <div style={s.emptyIcon}>👥</div>
                    <div style={s.emptyTitle}>
                      {addSearch ? 'No matching friends found' : 'All caught up!'}
                    </div>
                    <div style={s.emptyText}>
                      {addSearch
                        ? 'Try a different name'
                        : 'All your friends are already in this group'
                      }
                    </div>
                  </div>
                ) : (
                  eligibleFriends.map(f => (
                    <div key={f._id} style={s.memberItem}>
                      <div style={s.memberLeft}>
                        <div style={s.memberAvatar}>
                          {f.profilePicture
                            ? <img src={f.profilePicture} alt="" style={s.avatarImg} />
                            : <span>{f.username[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <div style={s.memberName}>{f.username}</div>
                      </div>
                      <button onClick={() => handleAddMember(f._id)} style={s.addBtn}>
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── Settings Tab — admin only ── */}
          {activeTab === 'settings' && isAdmin && (
            <div style={s.settingsSection}>
              <label style={s.label}>Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                style={s.nameInput}
                placeholder="Group name"
              />
              <button onClick={handleSaveName} disabled={saving || !groupName.trim()} style={s.saveBtn}>
                {saving ? 'Saving…' : 'Save Name'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

const s = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: '#0a0a0a', borderRadius: '16px', width: '90%', maxWidth: '480px',
    maxHeight: '650px', display: 'flex', flexDirection: 'column', border: '1px solid #1a1a1a', overflow: 'hidden'
  },
  header: {
    padding: '20px 24px', borderBottom: '1px solid #1a1a1a',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
  },
  groupInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
  groupAvatar: {
    width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ffffff',
    color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', fontWeight: '700', overflow: 'hidden', flexShrink: 0
  },
  groupAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  groupName: { fontSize: '16px', fontWeight: '600', color: '#ffffff' },
  memberCount: { fontSize: '13px', color: '#666666', marginTop: '2px' },
  closeBtn: { background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '4px', display: 'flex' },

  tabs: { display: 'flex', borderBottom: '1px solid #1a1a1a', padding: '0 16px' },
  tab: {
    padding: '12px 16px', background: 'none', border: 'none', color: '#666',
    cursor: 'pointer', fontSize: '14px', fontWeight: '500',
    borderBottom: '2px solid transparent', marginBottom: '-1px', transition: 'all 0.15s'
  },
  tabActive: { color: '#ffffff', borderBottomColor: '#ffffff' },

  body: { flex: 1, overflowY: 'auto', padding: '16px' },
  list: { display: 'flex', flexDirection: 'column', gap: '6px' },

  memberItem: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 12px', borderRadius: '10px', backgroundColor: '#000000', border: '1px solid #1a1a1a'
  },
  memberLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  memberAvatar: {
    width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ffffff',
    color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px', fontWeight: '600', overflow: 'hidden', flexShrink: 0
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' },
  memberName: { fontSize: '14px', fontWeight: '500', color: '#ffffff' },
  adminBadge: {
    fontSize: '11px', color: '#888', backgroundColor: '#1a1a1a',
    padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '3px'
  },
  youBadge: {
    fontSize: '11px', color: '#555', backgroundColor: '#111',
    padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '3px'
  },
  removeBtn: {
    padding: '6px 12px', backgroundColor: 'transparent', color: '#ff4444',
    border: '1px solid #ff4444', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500'
  },
  addBtn: {
    padding: '6px 16px', backgroundColor: '#ffffff', color: '#000000',
    border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
    flexShrink: 0
  },

  // Search inside add tab
  searchWrapper: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', backgroundColor: '#000000',
    border: '1px solid #1a1a1a', borderRadius: '10px',
    marginBottom: '14px', color: '#555'
  },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent',
    color: '#ffffff', fontSize: '14px'
  },

  // Empty state for add tab
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '40px 16px', gap: '8px'
  },
  emptyIcon: { fontSize: '32px', marginBottom: '4px' },
  emptyTitle: { fontSize: '15px', fontWeight: '600', color: '#ffffff' },
  emptyText: { fontSize: '13px', color: '#555', textAlign: 'center' },

  // Settings tab
  settingsSection: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px' },
  label: { fontSize: '13px', fontWeight: '500', color: '#888' },
  nameInput: {
    padding: '12px 16px', backgroundColor: '#000000', border: '1px solid #1a1a1a',
    borderRadius: '10px', color: '#ffffff', fontSize: '15px', outline: 'none'
  },
  saveBtn: {
    padding: '12px', backgroundColor: '#ffffff', color: '#000000',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
  },
};

export default GroupSettingsModal;