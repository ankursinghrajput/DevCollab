import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { UserContext } from '../context/UserContext.jsx';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:7777';

const Chat = () => {
  const { targetUserId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [targetUser, setTargetUser] = useState(null);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchTargetUser = async () => {
      try {
        const res = await axios.get(`/api/user/${targetUserId}`);
        if (res.data.user) {
          setTargetUser(res.data.user);
        }
      } catch (err) {
        console.error('Failed to fetch target user', err);
      }
    };

    if (targetUserId) {
      fetchTargetUser();
    }
  }, [targetUserId]);

  // ─── Load persisted chat history from the database ───────────────────────────
  useEffect(() => {
    if (!targetUserId) return;

    const fetchChatHistory = async () => {
      try {
        const res = await axios.get(`/api/chat/${targetUserId}`, {
          withCredentials: true,
        });

        const chatData = res.data;
        if (chatData && chatData.messages) {
          // Map the DB message format → the UI message shape
          const history = chatData.messages.map((msg) => ({
            id: msg._id,
            text: msg.content,                 // DB field is "content"
            senderId: msg.sender?._id || msg.sender,  // populated sender object or raw ObjectId
            timestamp: msg.timestamp,
          }));
          setMessages(history);
        }
      } catch (err) {
        console.error('Failed to load chat history', err);
      }
    };

    fetchChatHistory();
  }, [targetUserId]);
  // ─────────────────────────────────────────────────────────────────────────────
  // ─── Socket connection for real-time messaging ───────────────────────────────
  useEffect(() => {
    if (!user || !targetUserId) return;

    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinChat', {
        firstname: user.name,
        userId: user._id,
        targetUserId,
      });
    });

    socket.on('receiveMessage', (payload) => {
      if (payload.userId === user._id) return;
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: payload.message,
          senderId: payload.userId,
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    socket.on('userTyping', ({ userId }) => {
      if (userId === targetUserId) {
        setTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 1200);
      }
    });

    socket.on('userDisconnected', ({ userId }) => {
      if (userId === targetUserId) {
        setTyping(false);
      }
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, targetUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messagePayload = {
      firstname: user.name,
      message: newMessage.trim(),
      userId: user._id,
      targetUserId,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: messagePayload.message,
        senderId: user._id,
        timestamp: new Date().toISOString(),
      },
    ]);

    socketRef.current?.emit('sendMessage', messagePayload);
    setNewMessage('');
  };

  const handleTyping = (value) => {
    setNewMessage(value);
    if (!user) return;
    socketRef.current?.emit('typing', {
      userId: user._id,
      targetUserId,
    });
  };

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div className="chat-container">
        <div className="chat-header">
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              marginRight: '1rem',
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ←
          </button>
          <div>
            <h3>{targetUser ? targetUser.name : `User ${targetUserId ? targetUserId.slice(-4) : ''}`}</h3>
            <span style={{ fontSize: '0.75rem', color: '#10b981' }}>● Online</span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => {
            const isMe = user ? msg.senderId === user._id : msg.senderId === 'me';
            return (
              <div
                key={msg.id}
                className={`message-bubble ${isMe ? 'message-sent' : 'message-received'}`}
              >
                {msg.text}
                <span className="message-time" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            );
          })}
          {typing && (
            <div className="typing-indicator" style={{ marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
              {targetUser?.name || 'They'} is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => handleTyping(e.target.value)}
            disabled={!user}
          />
          <button type="submit" className="chat-send-btn" disabled={!newMessage.trim() || !user}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
