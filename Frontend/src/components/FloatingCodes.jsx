const FloatingCodes = () => {
  const snippets = [
    "const db = await mongoose.connect();",
    "<UserCard profile={user} />",
    "git push origin main",
    "useEffect(() => { fetchFeed() }, []);",
    "npm run dev",
    "router.post('/login', auth);",
    "display: flex; justify-content: center;",
    "docker-compose up -d",
    "console.log('DevCollab loaded!');",
    "try { await login() } catch (e) {}",
    "SELECT * FROM users WHERE skills='React'",
    "const [user, setUser] = useState(null);"
  ];

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {snippets.map((text, i) => (
        <div 
          key={i} 
          className="floating-code"
          style={{ 
            left: `${Math.random() * 80 + 10}%`, // Random spread across width
            animationDuration: `${15 + Math.random() * 20}s`, // Random speed
            animationDelay: `-${Math.random() * 20}s`, // Start at different heights
            fontSize: `${0.9 + Math.random() * 0.8}rem`, // Random sizes
            opacity: 0 // handled by animation
          }}
        >
          {text}
        </div>
      ))}
    </div>
  );
};

export default FloatingCodes;
