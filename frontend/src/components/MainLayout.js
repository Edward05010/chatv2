import React, { useContext, useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const SIDEBAR_WIDTH = 220;

const MainLayout = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useContext(AuthContext);
  const [collapsed, setCollapsed]   = useState(true);
  const [tooltip, setTooltip]       = useState({ visible: false, label: '', y: 0 });
  const [isMobile, setIsMobile]     = useState(window.innerWidth <= 768);
  const sidebarRef = useRef(null);

  // Auto-collapse on /chat
  useEffect(() => {
    if (location.pathname === '/chat') setCollapsed(true);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', Icon: DashboardIcon },
    { path: '/chat',      label: 'Chat',       Icon: ChatIcon      },
    { path: '/forum',     label: 'Forum',      Icon: ForumIcon     },
    { path: '/focus',     label: 'Focus Mode', Icon: FocusIcon     },
  ];

  const handleMouseEnterNav = (e, label) => {
    if (collapsed) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({ visible: true, label, y: rect.top + rect.height / 2 });
    }
  };
  const handleMouseLeaveNav = () => setTooltip({ visible: false, label: '', y: 0 });

  // Chat page needs overflow:hidden so the chat component owns its own scroll
  const isChat = location.pathname === '/chat';

  // ── Mobile ──────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; }
          html, body, #root { height: 100%; overflow: hidden; }
          .mobile-nav-btn:active { background-color: #1a1a1a !important; }
        `}</style>
        <div style={{
          display: 'flex', flexDirection: 'column',
          height: '100%',           // fills #root which is 100vh
          background: '#000',
          fontFamily: "'DM Sans', sans-serif",
          overflow: 'hidden',
        }}>
          {/* Page content — overflow:hidden for chat, auto for others */}
          <div style={{
            flex: 1,
            minHeight: 0,
            overflow: isChat ? 'hidden' : 'auto',
          }}>
            <Outlet />
          </div>

          {/* Bottom nav — hidden when in chat (Chat has its own back button) */}
          {!isChat && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-around',
              background: '#0a0a0a', borderTop: '1px solid #151515',
              padding: '8px 0',
              paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
              flexShrink: 0,
            }}>
              {navItems.map(({ path, label, Icon }) => {
                const active = location.pathname === path;
                return (
                  <button key={path} className="mobile-nav-btn"
                    onClick={() => navigate(path)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                      background: 'transparent', border: 'none',
                      color: active ? '#fff' : '#555',
                      cursor: 'pointer', padding: '6px 14px', borderRadius: 10,
                      fontFamily: "'DM Sans', sans-serif",
                      minWidth: 56,
                    }}>
                    <Icon active={active} />
                    <span style={{ fontSize: 10, fontWeight: active ? 600 : 400 }}>{label}</span>
                  </button>
                );
              })}
              <button className="mobile-nav-btn"
                onClick={() => navigate('/profile')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  background: 'transparent', border: 'none',
                  color: location.pathname === '/profile' ? '#fff' : '#555',
                  cursor: 'pointer', padding: '6px 14px', borderRadius: 10,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                <AvatarEl user={user} size={22} />
                <span style={{ fontSize: 10, fontWeight: location.pathname === '/profile' ? 600 : 400 }}>Profile</span>
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  // ── Desktop ──────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body, #root { height: 100%; overflow: hidden; }
        .nav-btn:hover    { background-color: #141414 !important; color: #fff !important; }
        .toggle-btn:hover { border-color: #333 !important; color: #aaa !important; }
        .logout-btn:hover { border-color: #333 !important; color: #ff4444 !important; }
        .profile-btn:hover { border-color: #2a2a2a !important; }
        .avatar-btn:hover  { opacity: 0.85; }
      `}</style>

      <div style={{
        display: 'flex', height: '100%',
        background: '#000',
        fontFamily: "'DM Sans', sans-serif",
        overflow: 'hidden',
      }}>
        {/* Sidebar */}
        <div ref={sidebarRef} style={{
          width: collapsed ? 64 : SIDEBAR_WIDTH,
          background: '#0a0a0a',
          borderRight: '1px solid #151515',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 100,
        }}>
          {/* Logo row */}
          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '22px 0' : '22px 16px',
            borderBottom: '1px solid #151515', minHeight: 70, flexShrink: 0,
          }}>
            {!collapsed && (
              <span style={{ fontSize: 17, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
                MindNest
              </span>
            )}
            <button className="toggle-btn" onClick={() => setCollapsed(c => !c)} style={{
              width: 30, height: 30, background: 'transparent', border: '1px solid #1e1e1e',
              borderRadius: 8, color: '#555', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s',
            }}>
              <ChevronIcon collapsed={collapsed} />
            </button>
          </div>

          {/* Nav */}
          <nav style={{ flex: 1, padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>
            {navItems.map(({ path, label, Icon }) => {
              const active = location.pathname === path;
              return (
                <button key={path} className="nav-btn"
                  onClick={() => navigate(path)}
                  onMouseEnter={e => handleMouseEnterNav(e, label)}
                  onMouseLeave={handleMouseLeaveNav}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: collapsed ? '13px 0' : '12px 18px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: active ? '#141414' : 'transparent',
                    border: 'none', borderLeft: `3px solid ${active ? '#fff' : 'transparent'}`,
                    color: active ? '#fff' : '#666',
                    cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
                    width: '100%', whiteSpace: 'nowrap',
                    transition: 'all 0.15s', textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                  <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <Icon active={active} />
                  </span>
                  {!collapsed && <span>{label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #151515',
            padding: collapsed ? '16px 0' : '16px 12px',
            display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: 8, flexShrink: 0,
          }}>
            {collapsed ? (
              <button className="avatar-btn" onClick={() => navigate('/profile')} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AvatarEl user={user} size={34} />
              </button>
            ) : (
              <>
                <button className="profile-btn" onClick={() => navigate('/profile')} style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', background: 'transparent',
                  border: '1px solid #1a1a1a', borderRadius: 10,
                  cursor: 'pointer', overflow: 'hidden', transition: 'border-color 0.15s',
                }}>
                  <AvatarEl user={user} size={30} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>
                      {user?.username}
                    </span>
                    <span style={{ fontSize: 11, color: '#3a3', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4CAF50', display: 'inline-block' }} />
                      Online
                    </span>
                  </div>
                </button>
                <button className="logout-btn" onClick={logout} title="Logout" style={{
                  width: 38, height: 38, background: 'transparent',
                  border: '1px solid #1a1a1a', borderRadius: 10,
                  color: '#555', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s',
                }}>
                  <LogoutIcon />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tooltip */}
        {tooltip.visible && collapsed && (
          <div style={{
            position: 'fixed', left: 72, top: tooltip.y - 16,
            background: '#1a1a1a', border: '1px solid #2a2a2a',
            color: '#fff', fontSize: 12, fontWeight: 600,
            padding: '6px 12px', borderRadius: 7,
            pointerEvents: 'none', zIndex: 999,
            whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            {tooltip.label}
          </div>
        )}

                {/* Main content — overflow:hidden for chat, auto for everything else */}
        <div style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflow: isChat ? 'hidden' : 'auto',
          background: '#000',
          height: '100%',
          position: 'relative',
        }}>
          <Outlet />
        </div>
      </div>
    </>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const AvatarEl = ({ user, size }) => (
  user?.profilePicture
    ? <img src={user.profilePicture} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    : <div style={{ width: size, height: size, borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 700, flexShrink: 0 }}>
        {user?.username?.[0]?.toUpperCase()}
      </div>
);

const ChevronIcon = ({ collapsed }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    style={{ transition: 'transform 0.22s', transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const DashboardIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const ChatIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const ForumIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
    <path d="M17 8H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h3l3 3 3-3h3a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2z"/>
    <line x1="7" y1="12" x2="7" y2="12" strokeLinecap="round" strokeWidth="2.5"/>
    <line x1="12" y1="12" x2="12" y2="12" strokeLinecap="round" strokeWidth="2.5"/>
    <line x1="17" y1="12" x2="17" y2="12" strokeLinecap="round" strokeWidth="2.5"/>
  </svg>
);
const FocusIcon = ({ active }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
    <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default MainLayout;