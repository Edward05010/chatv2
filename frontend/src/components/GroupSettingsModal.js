import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GroupSettingsModal = ({ show, onClose, group, onGroupUpdated, currentUserId, allFriends }) => {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showRemoveMember, setShowRemoveMember] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (currentUserId) {
        setCurrentUser(currentUserId);
      } else {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('https://chatv2-i91j.onrender.com/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setCurrentUser(response.data._id);
        } catch (error) {
          console.error('Error fetching current user:', error);
        }
      }
    };
    
    if (show && group) {
      fetchCurrentUser();
    }
  }, [show, group, currentUserId]);

  if (!show || !group || !currentUser) return null;

  const isAdmin = group.admin._id === currentUser || group.admin === currentUser;

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('groupPicture', file);
      
      const response = await axios.post(
        `https://chatv2-i91j.onrender.com/api/groups/${group._id}/picture`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (response.data.group) {
        onGroupUpdated(response.data.group);
      }
      
      alert('Group picture updated successfully!');
      setTimeout(() => {
        setPreviewImage(null);
        onClose();
      }, 500);
      
    } catch (error) {
      console.error('Upload Error:', error.response?.data);
      const errorMessage = error.response?.data?.error || 'Error uploading group picture';
      alert(errorMessage);
      setPreviewImage(null);
    } finally {
      setUploading(false);
    }
  };

  const handleAddMember = async (friendId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://chatv2-i91j.onrender.com/api/groups/${group._id}/members`,
        { userId: friendId },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      onGroupUpdated(response.data);
      setShowAddMember(false);
      setSearchQuery('');
      alert('Member added successfully!');
    } catch (error) {
      console.error('Add member error:', error);
      alert(error.response?.data?.error || 'Error adding member');
    }
  };

  const handleRemoveMember = async (memberId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `https://chatv2-i91j.onrender.com/api/groups/${group._id}/members/${memberId}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      onGroupUpdated(response.data);
      setShowRemoveMember(null);
      alert('Member removed successfully!');
    } catch (error) {
      console.error('Remove member error:', error);
      alert(error.response?.data?.error || 'Error removing member');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `https://chatv2-i91j.onrender.com/api/groups/${group._id}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      alert('Group deleted successfully');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.error || 'Error deleting group');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `https://chatv2-i91j.onrender.com/api/groups/${group._id}/leave`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      alert('You have left the group');
      onClose();
      window.location.reload();
    } catch (error) {
      console.error('Leave error:', error);
      alert(error.response?.data?.error || 'Error leaving group');
    }
  };

  // Filter friends who are not already in the group
  const availableFriends = (allFriends || []).filter(friend => 
    !group.members.some(member => member._id === friend._id)
  ).filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CloseIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
  const UploadIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
  const UsersIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
  const TrashIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>);
  const LogOutIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
  const UserPlusIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>);
  const UserMinusIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Group Settings</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <CloseIcon />
          </button>
        </div>

        <div style={styles.body}>
          {/* Group Picture Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Group Picture</h3>
            <div style={styles.pictureSection}>
              <div style={styles.currentPicture}>
                {previewImage ? (
                  <img src={previewImage} alt="Preview" style={styles.pictureImg} />
                ) : group.groupPicture ? (
                  <img src={group.groupPicture} alt={group.name} style={styles.pictureImg} />
                ) : (
                  <div style={styles.picturePlaceholder}>
                    {group.name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div style={styles.pictureActions}>
                {isAdmin ? (
                  <>
                    <input
                      type="file"
                      id="groupPictureInput"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={styles.fileInput}
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="groupPictureInput" 
                      style={{
                        ...styles.uploadButton,
                        opacity: uploading ? 0.5 : 1,
                        cursor: uploading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <UploadIcon />
                      {uploading ? 'Uploading...' : 'Upload Picture'}
                    </label>
                    <p style={styles.pictureHint}>Recommended: Square image, at least 256x256px</p>
                  </>
                ) : (
                  <p style={styles.pictureHint}>Only the group admin can change the group picture</p>
                )}
              </div>
            </div>
          </div>

          {/* Group Information Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Group Information</h3>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Group Name:</span>
              <span style={styles.infoValue}>{group.name}</span>
            </div>
            {group.description && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Description:</span>
                <span style={styles.infoValue}>{group.description}</span>
              </div>
            )}
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Members:</span>
              <span style={styles.infoValue}>{group.members.length}</span>
            </div>
          </div>

          {/* Members List Section */}
          <div style={styles.section}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
              <h3 style={{...styles.sectionTitle, marginBottom: 0}}>
                <UsersIcon />
                <span style={{marginLeft: '8px'}}>Members</span>
              </h3>
              {isAdmin && (
                <button onClick={() => setShowAddMember(true)} style={styles.addMemberButton}>
                  <UserPlusIcon /> Add Member
                </button>
              )}
            </div>
            <div style={styles.membersList}>
              {group.members.map(member => {
                const isMemberAdmin = member._id === group.admin._id || member._id === group.admin;
                const canRemove = isAdmin && !isMemberAdmin && member._id !== currentUser;
                
                return (
                  <div key={member._id} style={styles.memberItem}>
                    {member.profilePicture ? (
                      <img src={member.profilePicture} alt={member.username} style={styles.memberAvatar} />
                    ) : (
                      <div style={styles.memberAvatarPlaceholder}>
                        {member.username[0].toUpperCase()}
                      </div>
                    )}
                    <div style={styles.memberInfo}>
                      <span style={styles.memberName}>{member.username}</span>
                      {isMemberAdmin && (
                        <span style={styles.adminBadge}>Admin</span>
                      )}
                    </div>
                    {canRemove && (
                      <button 
                        onClick={() => setShowRemoveMember(member)} 
                        style={styles.removeMemberButton}
                        title="Remove member"
                      >
                        <UserMinusIcon />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone Section */}
          <div style={styles.section}>
            <h3 style={{...styles.sectionTitle, color: '#ff4444'}}>Danger Zone</h3>
            
            <div style={styles.dangerZone}>
              {isAdmin ? (
                <>
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    style={styles.deleteButton}
                  >
                    <TrashIcon />
                    Delete Group
                  </button>
                  <p style={styles.dangerHint}>
                    This will permanently delete the group and all its messages. This action cannot be undone.
                  </p>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => setShowLeaveConfirm(true)} 
                    style={styles.leaveButton}
                  >
                    <LogOutIcon />
                    Leave Group
                  </button>
                  <p style={styles.dangerHint}>
                    You will no longer be able to see messages or participate in this group.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div style={styles.confirmOverlay} onClick={() => setShowAddMember(false)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Add Member</h3>
            <input 
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />
            <div style={styles.friendsList}>
              {availableFriends.length > 0 ? (
                availableFriends.map(friend => (
                  <div key={friend._id} style={styles.friendItem}>
                    {friend.profilePicture ? (
                      <img src={friend.profilePicture} alt={friend.username} style={styles.friendAvatar} />
                    ) : (
                      <div style={styles.friendAvatarPlaceholder}>
                        {friend.username[0].toUpperCase()}
                      </div>
                    )}
                    <span style={styles.friendName}>{friend.username}</span>
                    <button 
                      onClick={() => handleAddMember(friend._id)} 
                      style={styles.addButton}
                    >
                      Add
                    </button>
                  </div>
                ))
              ) : (
                <p style={styles.noFriendsText}>
                  {searchQuery ? 'No friends found' : 'All your friends are already in this group'}
                </p>
              )}
            </div>
            <div style={styles.confirmButtons}>
              <button 
                onClick={() => {setShowAddMember(false); setSearchQuery('');}} 
                style={styles.cancelButton}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation */}
      {showRemoveMember && (
        <div style={styles.confirmOverlay} onClick={() => setShowRemoveMember(null)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Remove Member?</h3>
            <p style={styles.confirmText}>
              Are you sure you want to remove <strong>{showRemoveMember.username}</strong> from the group?
            </p>
            <div style={styles.confirmButtons}>
              <button 
                onClick={() => setShowRemoveMember(null)} 
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleRemoveMember(showRemoveMember._id)} 
                style={styles.confirmDeleteButton}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={styles.confirmOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Delete Group?</h3>
            <p style={styles.confirmText}>
              Are you sure you want to delete "<strong>{group.name}</strong>"? This action cannot be undone and all messages will be permanently deleted.
            </p>
            <div style={styles.confirmButtons}>
              <button 
                onClick={() => setShowDeleteConfirm(false)} 
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteGroup();
                }} 
                style={styles.confirmDeleteButton}
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveConfirm && (
        <div style={styles.confirmOverlay} onClick={() => setShowLeaveConfirm(false)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>Leave Group?</h3>
            <p style={styles.confirmText}>
              Are you sure you want to leave "<strong>{group.name}</strong>"? You will no longer see messages from this group.
            </p>
            <div style={styles.confirmButtons}>
              <button 
                onClick={() => setShowLeaveConfirm(false)} 
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowLeaveConfirm(false);
                  handleLeaveGroup();
                }} 
                style={styles.confirmLeaveButton}
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: '#0a0a0a', borderRadius: '16px', width: '90%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid #1a1a1a' },
  header: { padding: '24px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: '20px', fontWeight: '600', color: '#ffffff', margin: 0 },
  closeButton: { background: 'none', border: 'none', color: '#666666', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' },
  body: { padding: '24px', overflowY: 'auto' },
  section: { marginBottom: '32px' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center' },
  pictureSection: { display: 'flex', gap: '24px', alignItems: 'flex-start' },
  currentPicture: { width: '120px', height: '120px', flexShrink: 0 },
  pictureImg: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1a1a1a' },
  picturePlaceholder: { width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '600', border: '3px solid #1a1a1a' },
  pictureActions: { flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' },
  fileInput: { display: 'none' },
  uploadButton: { padding: '12px 20px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', width: 'fit-content' },
  pictureHint: { fontSize: '12px', color: '#666666', margin: 0 },
  infoRow: { display: 'flex', gap: '12px', marginBottom: '12px' },
  infoLabel: { fontSize: '14px', color: '#666666', fontWeight: '500', minWidth: '100px' },
  infoValue: { fontSize: '14px', color: '#ffffff' },
  addMemberButton: { padding: '8px 14px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  membersList: { display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' },
  memberItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#000000', borderRadius: '8px', border: '1px solid #1a1a1a' },
  memberAvatar: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' },
  memberAvatarPlaceholder: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '600' },
  memberInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: '8px' },
  memberName: { fontSize: '15px', color: '#ffffff', fontWeight: '500' },
  adminBadge: { padding: '2px 8px', backgroundColor: '#ffffff', color: '#000000', fontSize: '11px', fontWeight: '600', borderRadius: '4px', textTransform: 'uppercase' },
  removeMemberButton: { padding: '6px', backgroundColor: 'transparent', color: '#ff4444', border: '1px solid #ff4444', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.2s' },
  dangerZone: { padding: '16px', backgroundColor: '#0a0a0a', border: '1px solid #ff4444', borderRadius: '8px' },
  deleteButton: { padding: '12px 20px', backgroundColor: '#ff4444', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', width: '100%' },
  leaveButton: { padding: '12px 20px', backgroundColor: '#ff8844', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', width: '100%' },
  dangerHint: { fontSize: '12px', color: '#666666', marginTop: '12px', marginBottom: 0 },
  confirmOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  confirmModal: { backgroundColor: '#0a0a0a', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '90%', border: '1px solid #1a1a1a' },
  confirmTitle: { fontSize: '20px', fontWeight: '600', color: '#ffffff', marginBottom: '16px', marginTop: 0 },
  confirmText: { fontSize: '14px', color: '#cccccc', marginBottom: '24px', lineHeight: '1.5' },
  searchInput: { width: '100%', padding: '12px 16px', backgroundColor: '#000000', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#ffffff', fontSize: '14px', outline: 'none', marginBottom: '16px' },
  friendsList: { maxHeight: '300px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  friendItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', backgroundColor: '#000000', border: '1px solid #1a1a1a', borderRadius: '8px' },
  friendAvatar: { width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' },
  friendAvatarPlaceholder: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' },
  friendName: { flex: 1, fontSize: '14px', color: '#ffffff', fontWeight: '500' },
  addButton: { padding: '6px 14px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  noFriendsText: { textAlign: 'center', color: '#666666', fontSize: '14px', padding: '20px' },
  confirmButtons: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelButton: { padding: '10px 20px', backgroundColor: '#1a1a1a', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  confirmDeleteButton: { padding: '10px 20px', backgroundColor: '#ff4444', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  confirmLeaveButton: { padding: '10px 20px', backgroundColor: '#ff8844', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
};

export default GroupSettingsModal;
