import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { UserContext } from '../context/UserContext';
import axios from 'axios';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser, theme, toggleTheme } = useContext(UserContext);
  const isLoginPage = location.pathname === '/login' || location.pathname === '/signup';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [requestsDropdownOpen, setRequestsDropdownOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const avatarMenuRef = useRef(null);
  const requestsDropdownRef = useRef(null);
  const searchRef = useRef(null);

  const mainLinks = [
    { name: 'Feed', path: '/feed' },
    { name: 'Connections', path: '/connections' },
  ];

  // Close all dropdowns on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setAvatarMenuOpen(false);
    setRequestsDropdownOpen(false);
    setSearchDropdownOpen(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        try {
          const res = await axios.get(`/api/user/search?q=${searchQuery}`);
          setSearchResults(res.data.users || []);
          setSearchDropdownOpen(true);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setSearchDropdownOpen(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Fetch pending requests
  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    try {
      const response = await axios.get('/api/user/requests/received');
      if (response.data.receivedRequests) {
        setPendingRequests(response.data.receivedRequests);
      }
    } catch (err) {
      // Silently fail - user may not be authenticated yet
    }
  }, [user]);

  // Fetch unread chat count (distinct senders)
  const fetchUnreadChatCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/chat/unread-count', { withCredentials: true });
      if (res?.data?.unreadPersonsCount !== undefined) {
        setUnreadChatCount(res.data.unreadPersonsCount);
      }
    } catch (err) {
      // Silently fail
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPendingRequests();
      fetchUnreadChatCount();
      const interval = setInterval(() => {
        fetchPendingRequests();
        fetchUnreadChatCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchPendingRequests, fetchUnreadChatCount]);

  const handleReviewRequest = async (status, requestId) => {
    try {
      await axios.post(`/api/request/review/${status}/${requestId}`);
      setPendingRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (err) {
      console.error('Failed to review request', err);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setUser(null);
      setPendingRequests([]);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleThemeClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    toggleTheme();
    setTimeout(() => setIsAnimating(false), 580);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(event.target)) {
        setAvatarMenuOpen(false);
      }
      if (requestsDropdownRef.current && !requestsDropdownRef.current.contains(event.target)) {
        setRequestsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav style={{
      background: 'var(--glass-bg)',
      borderBottom: '1px solid var(--glass-border)',
      padding: '1rem 0',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.05)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <Link to="/feed" style={{ 
            fontSize: '1.5rem', 
            fontWeight: '800', 
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
            textShadow: '0 2px 10px rgba(255,255,255,0.5)'
          }}>
            DevTinder<span style={{ color: 'var(--accent-primary)' }}>.</span>
          </Link>

          {/* Desktop Navigation Links */}
          {!isLoginPage && user && (
            <div className="desktop-only" style={{ display: 'flex', gap: '1.5rem' }}>
              {mainLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link 
                    key={link.name} 
                    to={link.path}
                    style={{
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? '600' : '500',
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        
        {/* --- Search Bar --- */}
        {!isLoginPage && user && (
          <div className="desktop-only" style={{ flex: 1, maxWidth: '400px', margin: '0 2rem', position: 'relative' }} ref={searchRef}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
              <span style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }}>🔍</span>
              <input
                type="text"
                placeholder="Search developers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => { if (searchQuery.trim().length > 0) setSearchDropdownOpen(true); }}
                style={{
                  width: '100%',
                  padding: '0.6rem 1rem 0.6rem 2.5rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            </div>
            
            {searchDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 0.5rem)',
                left: 0,
                right: 0,
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {isSearching ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Searching...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map(u => (
                    <Link 
                      to={`/user/${u._id}`} 
                      key={u._id} 
                      onClick={() => {
                        setSearchDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        padding: '0.75rem 1rem', 
                        borderBottom: '1px solid var(--border-color)',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background-color 0.15s ease'
                      }}
                      className="search-result-item"
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, backgroundColor: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {u.photoUrl ? (
                          <img src={u.photoUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>{u.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.skills?.[0] || 'Developer'}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No developers found.</div>
                )}
              </div>
            )}
          </div>
        )}
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* ── Theme Toggle: always visible ── */}
          <button
            id="theme-toggle-btn"
            className="theme-toggle-btn"
            onClick={handleThemeClick}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className={`theme-icon${isAnimating ? ' theme-icon-spin' : ''}`}>
              {theme === 'light' ? (
                /* Moon icon – shown in light mode, click → dark */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                /* Sun / Brightness icon – shown in dark mode, click → light */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1"  x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1"  y1="12" x2="3"  y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </span>
          </button>
          {!isLoginPage && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              
              {/* Chat Icon with Unread Badge */}
              <Link
                to="/connections"
                id="chat-icon-btn"
                title={unreadChatCount > 0 ? `${unreadChatCount} user${unreadChatCount > 1 ? 's have' : ' has'} messaged you` : 'Messages'}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.35rem',
                  color: 'var(--text-secondary)',
                  padding: '0.35rem',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                }}
              >
                💬
                {unreadChatCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-4px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: '700',
                    minWidth: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    border: '2px solid var(--bg-color)',
                    animation: 'pulseNotif 2s ease-in-out infinite',
                    lineHeight: 1,
                  }}>
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </Link>

              {/* Connection Requests Bell Icon */}
              <div style={{ position: 'relative' }} ref={requestsDropdownRef}>
                <button
                  id="requests-bell-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRequestsDropdownOpen(prev => !prev);
                    setAvatarMenuOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.35rem',
                    color: 'var(--text-secondary)',
                    position: 'relative',
                    padding: '0.35rem',
                    borderRadius: 'var(--radius-md)',
                    transition: 'all 0.2s ease',
                    backgroundColor: requestsDropdownOpen ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                  }}
                >
                  🔔
                  {pendingRequests.length > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-4px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: '700',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--surface-color)',
                      animation: 'pulseNotif 2s ease-in-out infinite'
                    }}>
                      {pendingRequests.length}
                    </span>
                  )}
                </button>

                {/* Requests Dropdown */}
                {requestsDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '360px',
                    maxHeight: '480px',
                    overflowY: 'auto',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100,
                    animation: 'dropdownSlide 0.2s ease-out'
                  }}>
                    {/* Dropdown Header */}
                    <div style={{
                      padding: '1rem 1.25rem',
                      borderBottom: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                        Connection Requests
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: pendingRequests.length > 0 ? '#6366f1' : 'var(--text-secondary)',
                        backgroundColor: pendingRequests.length > 0 ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-full)'
                      }}>
                        {pendingRequests.length} pending
                      </span>
                    </div>

                    {/* Requests List */}
                    {pendingRequests.length === 0 ? (
                      <div style={{ 
                        padding: '2.5rem 1.25rem', 
                        textAlign: 'center', 
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem'
                      }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }}>📭</div>
                        No pending requests
                      </div>
                    ) : (
                      <div>
                        {pendingRequests.map((request) => (
                          <div key={request._id} style={{
                            padding: '1rem 1.25rem',
                            borderBottom: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            transition: 'background-color 0.15s ease'
                          }}
                          className="request-item"
                          >
                            {/* Avatar */}
                            <div style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              backgroundColor: '#f3f4f6',
                              flexShrink: 0,
                              border: '2px solid var(--border-color)'
                            }}>
                              {request.sender?.photoUrl ? (
                                <img src={request.sender.photoUrl} alt={request.sender.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-secondary)', backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                                  {request.sender?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                              )}
                            </div>

                            {/* Name */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {request.sender?.name || 'Unknown'}
                              </p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                                wants to connect
                              </p>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                              <button
                                id={`reject-btn-${request._id}`}
                                onClick={() => handleReviewRequest('rejected', request._id)}
                                style={{
                                  padding: '0.35rem 0.7rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  borderRadius: 'var(--radius-md)',
                                  border: '1.5px solid #ef4444',
                                  backgroundColor: 'transparent',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                Reject
                              </button>
                              <button
                                id={`accept-btn-${request._id}`}
                                onClick={() => handleReviewRequest('accepted', request._id)}
                                style={{
                                  padding: '0.35rem 0.7rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  borderRadius: 'var(--radius-md)',
                                  border: 'none',
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 1px 4px rgba(16, 185, 129, 0.3)'
                                }}
                              >
                                Accept
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* View All Link */}
                    {pendingRequests.length > 0 && (
                      <Link
                        to="/connections"
                        onClick={() => setRequestsDropdownOpen(false)}
                        style={{
                          display: 'block',
                          textAlign: 'center',
                          padding: '0.75rem',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          color: 'var(--accent-primary)',
                          textDecoration: 'none',
                          borderTop: '1px solid var(--border-color)',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        View all in Connections →
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Avatar Dropdown */}
              <div className="desktop-only" style={{ position: 'relative' }} ref={avatarMenuRef}>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setAvatarMenuOpen(prev => !prev);
                    setRequestsDropdownOpen(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    Hi, {(user.name || 'User').split(' ')[0]}
                  </span>
                  <div style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', 
                    backgroundColor: 'var(--accent-primary)', border: '2px solid var(--surface-color)',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)', flexShrink: 0
                  }}>
                    {user.photoUrl ? (
                      <img src={user.photoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </button>

                {avatarMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '120%',
                    right: 0,
                    width: '200px',
                    background: 'var(--surface-color)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'dropdownSlide 0.2s ease-out'
                  }}>
                    <Link to="/profile" onClick={() => setAvatarMenuOpen(false)} style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem', borderBottom: '1px solid var(--border-color)' }}>
                      My Profile
                    </Link>
                    <Link to="/profile/edit" onClick={() => setAvatarMenuOpen(false)} style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.875rem', borderBottom: '1px solid var(--border-color)' }}>
                      Edit Profile
                    </Link>
                    <button onClick={() => { toggleTheme(); setAvatarMenuOpen(false); }} style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)', fontSize: '0.875rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
                      Theme: {theme === 'dark' ? 'Dark' : 'Light'}
                    </button>
                    <button onClick={handleLogout} style={{ padding: '0.75rem 1rem', color: '#ef4444', fontSize: '0.875rem', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
              
              {/* Mobile Hamburger */}
              <button 
                className="mobile-only"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: '0.25rem'
                }}
              >
                ☰
              </button>
            </div>
          ) : !isLoginPage ? (
            <Link to="/login">
              <button className="btn-primary">
                Log In
              </button>
            </Link>
          ) : null}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && !isLoginPage && user && (
        <div className="mobile-only" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--surface-color)',
          borderBottom: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1rem'
        }}>
          {mainLinks.map((item) => (
            <Link 
              key={item.name} 
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                padding: '1rem',
                color: 'var(--text-primary)',
                fontWeight: '500',
                borderBottom: '1px solid var(--border-color)',
                textDecoration: 'none'
              }}
            >
              {item.name}
            </Link>
          ))}
          <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500', borderBottom: '1px solid var(--border-color)', textDecoration: 'none' }}>
            My Profile
          </Link>
          <Link to="/profile/edit" onClick={() => setMobileMenuOpen(false)} style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500', borderBottom: '1px solid var(--border-color)', textDecoration: 'none' }}>
            Edit Profile
          </Link>
          <button onClick={() => { toggleTheme(); setMobileMenuOpen(false); }} style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '500', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--border-color)' }}>
            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
          <button onClick={handleLogout} style={{ padding: '1rem', color: '#ef4444', fontWeight: '500', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
