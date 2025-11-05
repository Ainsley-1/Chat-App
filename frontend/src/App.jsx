import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

// FIXED: Connect to port 3002 where backend is running
const socket = io("http://localhost:3002", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

function App() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("general");
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server on port 3002");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("chat_message", (data) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on("users_list", (usersList) => {
      setUsers(usersList);
    });

    socket.on("rooms_list", (roomsList) => {
      setRooms(roomsList);
    });

    socket.on("user_typing", (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.userId !== data.userId);
        return [...filtered, data];
      });
    });

    socket.on("user_stopped_typing", (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("chat_message");
      socket.off("users_list");
      socket.off("rooms_list");
      socket.off("user_typing");
      socket.off("user_stopped_typing");
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit("user_join", { username: username.trim() });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && username) {
      const messageData = {
        message: message.trim(),
        room: currentRoom
      };
      socket.emit("chat_message", messageData);
      setMessage("");
    }
  };

  const joinRoom = (roomName) => {
    socket.emit("join_room", roomName);
    setCurrentRoom(roomName);
  };

  if (!username) {
    return (
      <div className="login-container">
        <form onSubmit={handleLogin} className="login-form">
          <h2>Join Chat App</h2>
          <div style={{color: isConnected ? 'green' : 'red', marginBottom: '1rem'}}>
            Status: {isConnected ? 'Connected to server' : 'Disconnected'}
          </div>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button type="submit">Join Chat</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="chat-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>Chat Rooms</h3>
            <div className="connection-status">
              {isConnected ? '🟢' : '🔴'}
            </div>
          </div>

          <div className="rooms-list">
            {rooms.map(room => (
              <div
                key={room}
                className={`room-item ${currentRoom === room ? 'active' : ''}`}
                onClick={() => joinRoom(room)}
              >
                # {room}
              </div>
            ))}
          </div>

          <div className="users-section">
            <h4>Online Users ({users.length})</h4>
            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className="user-item">
                  <img src={user.avatar} alt={user.username} className="user-avatar" />
                  {user.username}
                  {user.id === socket.id && ' (You)'}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="main-chat">
          <div className="chat-header">
            <div className="chat-info">
              <h2># {currentRoom}</h2>
              {typingUsers.filter(u => u.room === currentRoom).length > 0 && (
                <div className="typing-indicator">
                  {typingUsers.filter(u => u.room === currentRoom).map(u => u.username).join(', ')} typing...
                </div>
              )}
            </div>
          </div>
          
          <div className="messages-container">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                <div className="message-header">
                  <strong>{msg.username}</strong>
                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-content">{msg.message}</div>
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage} className="message-form">
            <input
              type="text"
              placeholder={`Message #${currentRoom}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
