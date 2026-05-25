import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { UserContext } from '../context/UserContext';
import axios from 'axios';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, theme, toggleTheme } = useContext(UserContext);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const menuItems = [
    { name: 'Feed', path: '/feed' },
    { name: 'Connections', path: '/connections' },
    { name: 'Messages', path: '/messages' },
    { name: 'Edit Profile', path: '/profile/edit' },
  ];

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside className="desktop-only" style={{
      background: 'var(--glass-bg)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem 1rem',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
      border: '1px solid var(--glass-border)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      height: 'calc(100vh - 100px)',
      position: 'sticky',
      top: '80px',
      flexDirection: 'column',
      gap: '0.5rem',
      overflowY: 'auto',
      minWidth: '240px',
      maxWidth: '280px'
    }}>
      <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: '700', letterSpacing: '0.05em' }}>
          Menu
        </h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s',
                textDecoration: 'none'
              }}
            >
              {item.name}
            </Link>
          );
        })}

        {/* Settings Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button 
            onClick={() => setSettingsOpen(!settingsOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: settingsOpen ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
              color: 'var(--text-primary)',
              fontWeight: '500',
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              Settings
            </div>
            <span style={{ transform: settingsOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
          </button>
          
          {settingsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '2.5rem', marginTop: '0.25rem' }}>
              <Link to="/profile" style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s' }}>
                Account preference
              </Link>
              <button onClick={toggleTheme} style={{ padding: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}>
                Change theme ({theme === 'dark' ? 'Light' : 'Dark'})
              </button>
              <button onClick={handleLogout} style={{ padding: '0.5rem', color: '#ef4444', fontSize: '0.875rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}>
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {user && (
        <Link to="/profile" style={{ marginTop: 'auto', textDecoration: 'none' }}>
          <div style={{ padding: '1rem', border: '1px solid var(--glass-border)', backgroundColor: 'var(--glass-bg)', borderRadius: 'var(--radius-md)', transition: 'background-color 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0, border: '2px solid var(--surface-color)' }}>
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <p style={{ margin: 0, fontWeight: '700', fontSize: '0.925rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {user.skills && user.skills.length > 0 ? user.skills.slice(0, 2).join(', ') : 'Developer'}
                </p>
              </div>
            </div>
          </div>
        </Link>
      )}
    </aside>
  );
};

export default Sidebar;
