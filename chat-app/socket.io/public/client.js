const socket = io();

const loginScreen = document.getElementById('loginScreen');
const chatScreen = document.getElementById('chatScreen');
const usernameInput = document.getElementById('usernameInput');
const joinButton = document.getElementById('joinButton');
const messages = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const userCount = document.getElementById('userCount');

let username = '';
let typingTimer;

joinButton.addEventListener('click', joinChat);
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinChat();
});

function joinChat() {
    username = usernameInput.value.trim();
    if (username) {
        joinButton.disabled = true;
        joinButton.textContent = 'Joining...';
        socket.emit('user_join', username);
    } else {
        alert('Please enter a username');
    }
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
        socket.emit('send_message', { message });
        messageInput.value = '';
        socket.emit('typing_stop');
    }
}

messageInput.addEventListener('input', () => {
    socket.emit('typing_start');
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        socket.emit('typing_stop');
    }, 1000);
});

socket.on('join_success', () => {
    loginScreen.style.display = 'none';
    chatScreen.style.display = 'flex';
    messageInput.disabled = false;
    sendButton.disabled = false;
    messageInput.focus();
    addSystemMessage(`You joined as ${username}`);
});

socket.on('join_error', (error) => {
    alert(error);
    joinButton.disabled = false;
    joinButton.textContent = 'Join Chat';
});

socket.on('receive_message', (data) => {
    addMessage(data.username, data.message, data.timestamp, data.username !== username);
});

socket.on('user_joined', (joinedUsername) => {
    addSystemMessage(`${joinedUsername} joined the chat`);
});

socket.on('user_left', (leftUsername) => {
    addSystemMessage(`${leftUsername} left the chat`);
});

socket.on('user_list', (userList) => {
    userCount.textContent = `${userList.length} users online`;
});

socket.on('user_typing', (typingUsername) => {
    typingIndicator.textContent = `${typingUsername} is typing...`;
});

socket.on('user_stopped_typing', () => {
    typingIndicator.textContent = '';
});

socket.on('connect_error', (error) => {
    alert('Failed to connect to server.');
});

function addMessage(sender, text, timestamp, isOther = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOther ? 'other' : 'own'}`;
    messageDiv.innerHTML = `
        <div class="message-sender">${sender}</div>
        <div class="message-text">${text}</div>
        <div class="message-time">${timestamp}</div>
    `;
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

function addSystemMessage(text) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'message system';
    systemDiv.style.cssText = 'text-align: center; color: #666; font-style: italic; background: none; border: none;';
    systemDiv.textContent = text;
    messages.appendChild(systemDiv);
    messages.scrollTop = messages.scrollHeight;
}