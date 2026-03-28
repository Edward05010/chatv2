import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const MILESTONES = [
  { minutes: 30,    label: '30m',   name: 'Spark',    color: '#a0c4ff' },
  { minutes: 60,    label: '1h',    name: 'Quartz',   color: '#caffbf' },
  { minutes: 300,   label: '5h',    name: 'Topaz',    color: '#fdffb6' },
  { minutes: 600,   label: '10h',   name: 'Citrine',  color: '#ffd166' },
  { minutes: 1500,  label: '25h',   name: 'Amber',    color: '#ef8c3a' },
  { minutes: 3000,  label: '50h',   name: 'Ruby',     color: '#ef233c' },
  { minutes: 4500,  label: '75h',   name: 'Amethyst', color: '#c77dff' },
  { minutes: 6000,  label: '100h',  name: 'Sapphire', color: '#4895ef' },
  { minutes: 12000, label: '200h',  name: 'Emerald',  color: '#52b788' },
  { minutes: 18000, label: '300h',  name: 'Diamond',  color: '#e0f4ff' },
];

const GemSVG = ({ tier, earned }) => {
  const c = tier.color;
  const op = earned ? '1' : '0.28';
  const fi = earned ? '0.22' : '0.06';
  const ii = earned ? '0.45' : '0.10';
  const gid = `gem_${tier.name}`;
  const glowFilter = earned ? `<defs><filter id="${gid}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>` : '';
  const gf = earned ? `filter="url(#${gid})"` : '';
  const shapes = {
    Spark: `<path d="M28 8 L40 34 Q40 54 28 56 Q16 54 16 34 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/><path d="M28 8 L40 34 L28 44 L16 34 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/><line x1="16" y1="34" x2="40" y2="34" stroke="${c}" stroke-width="1" opacity="${earned ? '0.4' : '0.1'}"/>`,
    Quartz: `<path d="M28 6 L46 28 L28 58 L10 28 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/><line x1="10" y1="28" x2="46" y2="28" stroke="${c}" stroke-width="1" opacity="${earned ? '0.45' : '0.1'}"/><path d="M28 6 L46 28 L28 34 L10 28 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Topaz: `<path d="M28 6 L46 28 L28 58 L10 28 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/><path d="M28 6 L40 18 L28 28 L16 18 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Citrine: `<path d="M28 5 L48 22 L40 54 L16 54 L8 22 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/><path d="M28 5 L48 22 L28 32 L8 22 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Amber: `<path d="M28 5 L48 22 L40 54 L16 54 L8 22 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/><path d="M28 5 L48 22 L28 32 L8 22 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Ruby: `<path d="M28 5 L48 18 L48 42 L28 58 L8 42 L8 18 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/><path d="M28 5 L48 18 L28 28 L8 18 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Amethyst: `<path d="M28 5 L48 18 L48 42 L28 58 L8 42 L8 18 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/><path d="M28 14 L40 22 L40 38 L28 46 L16 38 L16 22 Z" fill="${c}" fill-opacity="${ii}" stroke="${c}" stroke-width="1" opacity="${op}"/>`,
    Sapphire: `<path d="M18 6 L38 6 L50 18 L50 38 L38 54 L18 54 L6 38 L6 18 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/><path d="M18 6 L50 18 L38 28 L18 28 L6 18 Z" fill="${c}" fill-opacity="${ii}" stroke="none" opacity="${op}"/>`,
    Emerald: `<path d="M18 6 L38 6 L50 18 L50 38 L38 54 L18 54 L6 38 L6 18 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" opacity="${op}" ${gf}/><path d="M22 14 L34 14 L42 22 L42 38 L34 46 L22 46 L14 38 L14 22 Z" fill="${c}" fill-opacity="${ii}" stroke="${c}" stroke-width="1" opacity="${op}"/>`,
    Diamond: `<path d="M18 6 L38 6 L50 18 L50 38 L38 54 L18 54 L6 38 L6 18 Z" fill="${c}" fill-opacity="${fi}" stroke="${c}" stroke-width="2" stroke-linejoin="round" opacity="${op}" ${gf}/><path d="M28 10 L44 28 L28 50 L12 28 Z" fill="${c}" fill-opacity="${ii}" stroke="${c}" stroke-width="1" opacity="${op}"/><circle cx="28" cy="28" r="4" fill="${c}" opacity="${earned ? '0.85' : '0.15'}"/>`,
  };
  return <svg width="48" height="56" viewBox="0 0 56 64" dangerouslySetInnerHTML={{ __html: glowFilter + (shapes[tier.name] || '') }} />;
};

const Profile = () => {
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [earnedMilestones, setEarnedMilestones] = useState([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile(); loadAchievements();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadProfile = async () => {
    try {
      const res = await axios.get('https://chatv2-i91j.onrender.com/api/profile');
      setEmail(res.data.email); setProfilePicture(res.data.profilePicture);
    } catch (e) { console.error(e); }
  };

  const loadAchievements = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('https://chatv2-i91j.onrender.com/api/achievements', { headers: { Authorization: `Bearer ${token}` } });
      setEarnedMilestones(res.data.earned || []); setTotalMinutes(res.data.totalMinutes || 0);
    } catch (e) { console.error(e); }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) { showMessage('Please select a file first', 'error'); return; }
    setLoading(true);
    const formData = new FormData(); formData.append('profilePicture', selectedFile);
    try {
      const res = await axios.post('https://chatv2-i91j.onrender.com/api/profile/picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfilePicture(res.data.profilePicture); setSelectedFile(null); setPreview('');
      showMessage('Profile picture updated!', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) { showMessage(e.response?.data?.error || 'Error uploading picture', 'error'); }
    finally { setLoading(false); }
  };

  const handleUpdateEmail = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await axios.put('https://chatv2-i91j.onrender.com/api/profile', { email });
      showMessage('Email updated!', 'success');
    } catch (e) { showMessage(e.response?.data?.error || 'Error updating email', 'error'); }
    finally { setLoading(false); }
  };

  const showMessage = (msg, type) => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const earnedCount = earnedMilestones.length;
  const totalCount = MILESTONES.length;
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const nextMilestone = MILESTONES.find(m => !earnedMilestones.includes(m.minutes));
  const hoursThisMonth = (totalMinutes / 60).toFixed(1);

  const UploadIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
  const SaveIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>);
  const TrashIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>);

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: '#ffffff' }}>

      {/* Header */}
      <div style={{ padding: isMobile ? '20px 16px 16px' : '32px 32px 20px', borderBottom: '1px solid #1a1a1a' }}>
        <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: '700', color: '#ffffff', margin: 0 }}>My Account</h1>
      </div>

      {message && (
        <div style={{ margin: isMobile ? '12px 16px' : '16px 32px', padding: '14px 18px', borderRadius: '8px', border: '1px solid', fontSize: '14px', fontWeight: '500', backgroundColor: messageType === 'success' ? '#0a3a1a' : '#3a0a0a', borderColor: messageType === 'success' ? '#22c55e' : '#ef4444', color: messageType === 'success' ? '#86efac' : '#fca5a5' }}>
          {message}
        </div>
      )}

      <div style={{ padding: isMobile ? '16px' : '24px 32px', maxWidth: '800px' }}>

        {/* Profile Picture */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 6px' }}>Profile Picture</h3>
          <p style={{ fontSize: '13px', color: '#666666', margin: '0 0 20px' }}>Upload a custom avatar</p>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: '90px', height: '90px', flexShrink: 0 }}>
              {profilePicture
                ? <img src={profilePicture} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1a1a1a' }} />
                : <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#ffffff', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '700' }}>{user?.username?.[0]?.toUpperCase() || '?'}</div>
              }
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} id="fileInput" />
              <label htmlFor="fileInput" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                <UploadIcon /> Choose Image
              </label>
              {selectedFile && (
                <div style={{ marginTop: '14px', padding: '14px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px' }}>
                  <div style={{ fontSize: '13px', color: '#ffffff', marginBottom: '10px' }}>{selectedFile.name}</div>
                  {preview && <img src={preview} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', display: 'block' }} />}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleUploadPicture} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#22c55e', color: '#000000', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                      <SaveIcon />{loading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button onClick={() => { setSelectedFile(null); setPreview(''); }} style={{ display: 'flex', alignItems: 'center', padding: '8px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #1a1a1a', borderRadius: '6px', cursor: 'pointer' }}>
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: '1px', backgroundColor: '#1a1a1a', margin: '24px 0' }} />

        {/* Achievements */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 4px' }}>Monthly Achievements</h3>
              <p style={{ fontSize: '13px', color: '#666666', margin: 0 }}>{monthName} · {hoursThisMonth} hrs studied</p>
            </div>
            <div style={{ padding: '6px 14px', backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '20px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>{earnedCount} / {totalCount}</span>
            </div>
          </div>
          <div style={{ height: '3px', backgroundColor: '#1a1a1a', borderRadius: '2px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ height: '100%', backgroundColor: '#FFD700', borderRadius: '2px', width: `${(earnedCount / totalCount) * 100}%`, transition: 'width 0.6s ease' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(5, 1fr)' : 'repeat(5, 1fr)', gap: isMobile ? '8px' : '12px', marginBottom: '16px' }}>
            {MILESTONES.map(milestone => {
              const earned = earnedMilestones.includes(milestone.minutes);
              return (
                <div key={milestone.minutes} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: isMobile ? '10px 4px 8px' : '16px 8px 12px', backgroundColor: '#0a0a0a', border: `1px solid ${earned ? milestone.color + '55' : '#1a1a1a'}`, borderRadius: '10px', position: 'relative', boxShadow: earned ? `0 0 14px -4px ${milestone.color}44` : 'none' }}>
                  <GemSVG tier={milestone} earned={earned} />
                  <span style={{ fontSize: isMobile ? '9px' : '11px', fontWeight: '600', textAlign: 'center', color: earned ? milestone.color : '#333333' }}>{milestone.name}</span>
                  <span style={{ fontSize: '10px', color: '#444444', textAlign: 'center' }}>{milestone.label}</span>
                  {!earned && (
                    <div style={{ position: 'absolute', top: '6px', right: '6px', opacity: 0.6 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {nextMilestone && earnedCount < totalCount && (
            <div style={{ padding: '12px 16px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '10px', marginBottom: '12px' }}>
              <span style={{ color: '#666666', fontSize: '13px' }}>
                Next: study <strong style={{ color: '#ffffff' }}>{nextMilestone.label}</strong> to unlock <strong style={{ color: nextMilestone.color }}>{nextMilestone.name}</strong>
              </span>
            </div>
          )}
        </div>

        <div style={{ height: '1px', backgroundColor: '#1a1a1a', margin: '24px 0' }} />

        {/* Account Info */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', margin: '0 0 6px' }}>Account Information</h3>
          <p style={{ fontSize: '13px', color: '#666666', margin: '0 0 20px' }}>Manage your account details</p>

          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Username</div>
              <div style={{ fontSize: '15px', color: '#ffffff' }}>@{user?.username}</div>
            </div>
            <span style={{ fontSize: '12px', color: '#666666', backgroundColor: '#1a1a1a', padding: '4px 12px', borderRadius: '12px' }}>Cannot be changed</span>
          </div>

          <form onSubmit={handleUpdateEmail}>
            <div style={{ fontSize: '12px', fontWeight: '600', color: '#666666', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Email Address</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ flex: 1, minWidth: '200px', padding: '12px 16px', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', color: '#ffffff', fontSize: '15px', outline: 'none' }} required />
              <button type="submit" disabled={loading} style={{ padding: '12px 24px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

        <div style={{ height: '1px', backgroundColor: '#1a1a1a', margin: '24px 0' }} />

        {/* Danger Zone */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#ef4444', margin: '0 0 6px' }}>Danger Zone</h3>
          <p style={{ fontSize: '13px', color: '#666666', margin: '0 0 20px' }}>Irreversible actions</p>
          <div style={{ border: '1px solid #3a0a0a', borderRadius: '8px', backgroundColor: '#1a0000', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>Logout</div>
              <div style={{ fontSize: '13px', color: '#999999' }}>Sign out from this device</div>
            </div>
            <button onClick={logout} style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;