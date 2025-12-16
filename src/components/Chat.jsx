import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';

function Chat({ onBack }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const previousMessagesLengthRef = useRef(0);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    
    // Poll for new conversations and messages every 3 seconds
    const interval = setInterval(() => {
      fetchConversations(); // Refresh conversations list to pick up new confirmed appointments
      if (selectedConversation) {
        fetchMessages(selectedConversation.user._id);
      }
      fetchUnreadCount();
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Check if user is near bottom of chat
  const isNearBottom = () => {
    if (!messagesContainerRef.current) return true;
    const container = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Handle scroll events to track if user manually scrolled
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      shouldAutoScrollRef.current = isNearBottom();
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [selectedConversation]);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. User is near bottom (hasn't scrolled up), OR
    // 2. New messages were actually added (not just re-fetched)
    const hasNewMessages = messages.length > previousMessagesLengthRef.current;
    
    if (shouldAutoScrollRef.current || hasNewMessages) {
      scrollToBottom();
    }
    
    previousMessagesLengthRef.current = messages.length;
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/chat/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
      } else {
        console.error('Failed to fetch conversations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/chat/messages/${otherUserId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.messages) {
        // Ensure all messages have proper sender data
        const validMessages = data.messages.filter(msg => msg && msg.sender);
        setMessages(validMessages);
        // Update conversation in list
        if (validMessages.length > 0) {
          setConversations(prev => 
            prev.map(conv => {
              const convUserId = conv.user?._id || conv.user?.id;
              const otherUserIdStr = otherUserId?.toString();
              const convUserIdStr = convUserId?.toString();
              if (convUserIdStr === otherUserIdStr) {
                return { ...conv, lastMessage: validMessages[validMessages.length - 1], unreadCount: 0 };
              }
              return conv;
            })
          );
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/chat/unread-count`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    shouldAutoScrollRef.current = true; // Reset to auto-scroll when selecting new conversation
    fetchMessages(conversation.user._id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: selectedConversation.user._id,
          message: newMessage
        })
      });

      const data = await res.json();
      if (data.success) {
        shouldAutoScrollRef.current = true; // Auto-scroll when sending a message
        setMessages([...messages, data.message]);
        setNewMessage('');
        fetchConversations(); // Refresh conversations to update last message
      } else {
        alert(data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="chat-container">
        <div className="chat-loading">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h2>Messages</h2>
          {unreadCount > 0 && (
            <span className="chat-unread-badge">{unreadCount}</span>
          )}
        </div>
        <div className="chat-conversations-list">
          {conversations.length === 0 ? (
            <div className="chat-empty-state">
              <p>No conversations yet</p>
              <p className="chat-empty-hint">
                {user?.role === 'doctor' 
                  ? 'Start chatting with your patients who have confirmed appointments' 
                  : 'You can chat with doctors who have confirmed your appointments'}
              </p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.user._id}
                className={`chat-conversation-item ${
                  selectedConversation?.user._id === conversation.user._id ? 'active' : ''
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <div className="chat-conversation-avatar">
                  {conversation.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="chat-conversation-info">
                  <div className="chat-conversation-header">
                    <span className="chat-conversation-name">
                      {conversation.user.name}
                      {conversation.user.role === 'doctor' && conversation.user.specialization && (
                        <span className="chat-conversation-specialty">
                          {' '}• {conversation.user.specialization}
                        </span>
                      )}
                    </span>
                    {conversation.lastMessage && (
                      <span className="chat-conversation-time">
                        {formatTime(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {conversation.lastMessage && (
                    <div className="chat-conversation-preview">
                      <span className="chat-conversation-message">
                        {conversation.lastMessage.senderId === user._id ? 'You: ' : ''}
                        {conversation.lastMessage.message}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span className="chat-conversation-unread">{conversation.unreadCount}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        {selectedConversation ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  {selectedConversation.user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3>{selectedConversation.user.name}</h3>
                  {selectedConversation.user.role === 'doctor' && selectedConversation.user.specialization && (
                    <p className="chat-header-specialty">{selectedConversation.user.specialization}</p>
                  )}
                </div>
              </div>
              {onBack && (
                <button className="btn btn-text" onClick={onBack}>
                  Back
                </button>
              )}
            </div>

            <div className="chat-messages" ref={messagesContainerRef}>
              {messages.length === 0 ? (
                <div className="chat-messages-empty">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  // Safely check if message is from current user
                  const senderId = message.sender?._id || message.sender?.id;
                  const userId = user?._id || user?.id;
                  const isOwn = senderId && userId && (
                    senderId.toString() === userId.toString() || 
                    senderId === userId
                  );
                  
                  return (
                    <div
                      key={message._id}
                      className={`chat-message-wrapper ${isOwn ? 'own' : 'other'}`}
                    >
                      {!isOwn && message.sender && (
                        <div className="chat-message-avatar">
                          {(message.sender.name || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className={`chat-message ${isOwn ? 'own' : 'other'}`}>
                        {!isOwn && message.sender && (
                          <div className="chat-message-sender">{message.sender.name || 'Unknown'}</div>
                        )}
                        <div className="chat-message-content">
                          <p>{message.message || ''}</p>
                          <span className="chat-message-time">
                            {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                className="btn btn-primary chat-send-btn"
                disabled={!newMessage.trim() || sending}
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </>
        ) : (
          <div className="chat-welcome">
            <h2>Select a conversation</h2>
            <p>Choose a conversation from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;

