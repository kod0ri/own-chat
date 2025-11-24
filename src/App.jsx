import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login/Login.jsx';
import Sidebar from './components/Sidebar/Sidebar.jsx';
import Chat from './components/Chat/Chat.jsx';
import User from './components/User/User.jsx';

function App() {
  // --- СТАН ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomId, setNewRoomId] = useState('');

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [inviteUser, setInviteUser] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [lastSyncToken, setLastSyncToken] = useState('');
  const [roomMembers, setRoomMembers] = useState([]);

  // --- СТАН ДЛЯ РЕДАГУВАННЯ ---
  const [editMode, setEditMode] = useState(null);
  const [editText, setEditText] = useState('');

  // --- ЛОГІКА ВХОДУ ---
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('https://matrix.org/_matrix/client/r0/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'm.login.password',
          user: username,
          password: password
        })
      });
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        setUserId(data.user_id);
        
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        await fetchRoomsWithNames(data.access_token);
      } else {
        setError(data.error || 'Невірний логін або пароль');
      }
    } catch (e) {
      setError('Помилка під час входу. Перевірте з\'єднання.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- РОБОТА З КІМНАТАМИ ---
  const fetchRoomsWithNames = async (token) => {
    if (!token) return;
    try {
      const res = await fetch('https://matrix.org/_matrix/client/r0/joined_rooms', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.joined_rooms) {
        const roomPromises = data.joined_rooms.map(async (roomId) => {
          const nameRes = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/state/m.room.name`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const nameData = await nameRes.json();
          return {
            roomId,
            name: nameData?.name || roomId
          };
        });
        const fetchedRooms = await Promise.all(roomPromises);
        fetchedRooms.sort((a, b) => a.name.localeCompare(b.name));
        setRooms(fetchedRooms);
        if (fetchedRooms.length > 0 && !roomId) {
          setRoomId(fetchedRooms[0].roomId);
        }
      }
    } catch (e) {
      console.error('Fetch rooms error:', e);
    }
  };

  const createRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const res = await fetch('https://matrix.org/_matrix/client/r0/createRoom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ preset: 'private_chat', name: newRoomName.trim() })
      });
      const data = await res.json();
      if (data.room_id) {
        setNewRoomId(data.room_id);
        setRoomId(data.room_id);
        await fetchRoomsWithNames(accessToken);
        alert(`Room '${newRoomName}' created with ID: ${data.room_id}`);
        setNewRoomName('');
      } else {
        alert('Create room failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Create room error: ' + e.message);
    }
  };

  const joinRoom = async () => {
    if (!joinRoomId.trim()) return;
    try {
      const res = await fetch(`https://matrix.org/_matrix/client/r0/join/${encodeURIComponent(joinRoomId.trim())}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.room_id) {
        setRoomId(data.room_id);
        setJoinRoomId('');
        await fetchRoomsWithNames(accessToken);
      } else {
        alert('Join failed: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('Join room error: ' + e.message);
    }
  };

  const leaveRoom = async (roomIdToLeave) => {
    if (!confirm('Ви впевнені, що хочете покинути (видалити) кімнату?')) return;
    try {
      const res = await fetch(
        `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomIdToLeave)}/leave`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      if (res.ok) {
        alert('Кімнату покинуто.');
        setRooms(prevRooms => prevRooms.filter(r => r.roomId !== roomIdToLeave));
        if (roomId === roomIdToLeave) {
          setRoomId('');
          setMessages([]);
          setRoomMembers([]);
        }
      } else {
        const data = await res.json();
        alert('Не вдалося покинути кімнату: ' + (data.error || 'Невідома помилка'));
      }
    } catch (e) {
      alert('Помилка: ' + e.message);
    }
  };

  // --- СПОВІЩЕННЯ ---
  const playNotificationSound = () => {
    const audio = new Audio('/ping.mp3'); 
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Sound blocked:', e));
  };

  const showDesktopNotification = (sender, body) => {
    if (Notification.permission !== 'granted') return;
    
    const title = sender === userId ? 'Ти' : sender.split(':')[0].substring(1);
    const options = {
      body: body.length > 100 ? body.substring(0, 97) + '...' : body,
      tag: 'matrix-chat',
      renotify: true
    };
    
    const notification = new Notification(title, options);
    setTimeout(() => notification.close(), 5000);
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  // --- ЧАТ ---
const fetchMessages = async (isFreshLoad = false) => {
    if (!accessToken || !roomId) return;
    const tokenParam = (lastSyncToken && !isFreshLoad) ? `&since=${lastSyncToken}` : '';
    const url = `https://matrix.org/_matrix/client/r0/sync?timeout=30000${tokenParam}`;
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const data = await res.json();
      if (data.next_batch) {
        setLastSyncToken(data.next_batch);
        const roomData = data.rooms?.join?.[roomId];
        if (roomData && roomData.timeline?.events) {
          
          const incomingMessages = [];
          const incomingEdits = [];

          // 1. Розсортуємо події: де нові повідомлення, а де редагування
          roomData.timeline.events.forEach(event => {
            if (event.type === 'm.room.message' && event.content.body) {
              
              // Перевіряємо, чи це подія редагування (m.replace)
              const relatesTo = event.content['m.relates_to'];
              if (relatesTo && relatesTo.rel_type === 'm.replace') {
                 incomingEdits.push({
                    originalId: relatesTo.event_id,
                    newBody: event.content['m.new_content']?.body || event.content.body
                 });
              } else {
                 // Це звичайне нове повідомлення
                 incomingMessages.push({
                    id: event.event_id,
                    body: event.content.body,
                    sender: event.sender,
                    edited: !!event.content['m.new_content']
                 });
              }
            }
          });

          setMessages(prevMessages => {
            // 2. Спочатку застосуємо редагування до ВЖЕ існуючих повідомлень
            let updatedMessages = prevMessages.map(msg => {
                const edit = incomingEdits.find(e => e.originalId === msg.id);
                if (edit) {
                    // Оновлюємо текст і ставимо позначку edited
                    return { ...msg, body: edit.newBody, edited: true };
                }
                return msg;
            });

            // 3. Тепер додаємо тільки справжні нові повідомлення (уникаючи дублікатів)
            const existingIds = new Set(updatedMessages.map(m => m.id));
            const uniqueNewMessages = incomingMessages.filter(m => !existingIds.has(m.id));
            
            // Сповіщення (логіка без змін)
            if (!isFreshLoad && uniqueNewMessages.length > 0) {
                uniqueNewMessages.forEach(msg => {
                    if (msg.sender !== userId && document.hidden) {
                        showDesktopNotification(msg.sender, msg.body);
                        playNotificationSound();
                    }
                });
            }

            return [...updatedMessages, ...uniqueNewMessages];
          });
        }
      }
    } catch (e) {
      console.error('Fetch messages error: ', e);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !roomId) return;
    const msg = newMessage.trim();
    setNewMessage('');
    try {
      const res = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${roomId}/send/m.room.message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ msgtype: 'm.text', body: msg })
      });
      const data = await res.json();
      if (data.event_id) {
        setMessages(prev => [...prev, { id: data.event_id, body: msg, sender: userId }]);
      }
    } catch (e) {
      console.error('Send message error:', e);
    }
  };

  // --- РЕДАГУВАННЯ ТА ВИДАЛЕННЯ ПОВІДОМЛЕНЬ ---
  const startEdit = (messageId, currentBody) => {
    setEditMode(messageId);
    setEditText(currentBody);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditText('');
  };

  const saveEdit = async (messageId) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${roomId}/send/m.room.message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            msgtype: 'm.text',
            body: editText.trim(),
            "m.new_content": {
                msgtype: 'm.text',
                body: editText.trim()
            },
            "m.relates_to": {
                rel_type: "m.replace",
                event_id: messageId
            }
        })
      });
      const data = await res.json();
      if (data.event_id) {
        setMessages(prev => prev.map(m => {
            if (m.id === messageId) {
                return { ...m, body: editText.trim(), edited: true };
            }
            return m;
        }));
        cancelEdit();
      } else {
         alert('Помилка редагування: ' + (data.error || 'Невідома помилка'));
      }
    } catch (e) {
        alert('Помилка: ' + e.message);
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Видалити повідомлення?')) return;
    try {
        const res = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${roomId}/redact/${messageId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${accessToken}` },
            body: JSON.stringify({})
        });
        
        if (res.ok) {
             setMessages(prev => prev.filter(m => m.id !== messageId));
        } else {
            const data = await res.json();
            alert('Не вдалося видалити: ' + (data.error || 'Помилка'));
        }
    } catch (e) {
        alert('Помилка: ' + e.message);
    }
  };

  // --- УЧАСНИКИ ---
  const inviteUserToRoom = async () => {
    if (!inviteUser.trim() || !roomId) return;
    try {
      const res = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${roomId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ user_id: inviteUser.trim() })
      });
      const data = await res.json();
      if (data.errcode) {
        alert('Invite failed: ' + (data.error || 'Unknown error'));
      } else {
        alert(`User ${inviteUser} invited to ${roomId}`);
        setInviteUser('');
      }
    } catch (e) {
      alert('Invite error: ' + e.message);
    }
  };

  const fetchRoomMembers = async (currentRoomId, currentToken) => {
    if (!currentToken || !currentRoomId) return;
    try {
      const res = await fetch(
        `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(currentRoomId)}/joined_members`,
        { headers: { 'Authorization': `Bearer ${currentToken}` } }
      );
      const data = await res.json();
      if (data.joined) {
        const members = Object.entries(data.joined).map(([userId, info]) => ({
          userId,
          displayName: info.display_name || userId.split(':')[0].substring(1),
          avatarUrl: info.avatar_url
        }));
        setRoomMembers(members);
      }
    } catch (e) {
      console.error('Error fetching room members:', e);
    }
  };

  const kickUser = async (userIdToKick) => {
    if (!confirm(`Викинути користувача ${userIdToKick} з кімнати?`)) return;
    try {
      const res = await fetch(
        `https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/kick`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ user_id: userIdToKick })
        }
      );
      if (res.ok) {
        alert(`Користувач ${userIdToKick} викинутий.`);
        setRoomMembers(prev => prev.filter(m => m.userId !== userIdToKick));
      } else {
        const data = await res.json();
        alert('Не вдалося викинути: ' + (data.error || 'Невідома помилка'));
      }
    } catch (e) {
      alert('Помилка: ' + e.message);
    }
  };

  const switchRoom = (newRoomId) => {
    if (newRoomId) {
      setRoomId(newRoomId);
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (accessToken && roomId) {
      setMessages([]);
      setLastSyncToken('');
      setRoomMembers([]);
      fetchMessages(true);
      fetchRoomMembers(roomId, accessToken);
    }
  }, [roomId, accessToken]);

  useEffect(() => {
    if (accessToken && roomId) {
      const interval = setInterval(() => {
        fetchMessages(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [accessToken, roomId, lastSyncToken]);

  return (
    <div className={`app-container ${accessToken ? 'chat' : 'login'}`}>
      {!accessToken ? (
        <Login 
          username={username}
          setUsername={setUsername}
          password={password}
          setPassword={setPassword}
          loading={loading}
          error={error}
          handleLogin={handleLogin}
        />
      ) : (
        <div className="main-chat-window">
          <div className="chat-layout">
            
            <Sidebar 
              rooms={rooms}
              roomId={roomId}
              switchRoom={switchRoom}
              newRoomName={newRoomName}
              setNewRoomName={setNewRoomName}
              newRoomId={newRoomId}
              createRoom={createRoom}
              leaveRoom={leaveRoom}
            />
            
            <Chat 
              userId={userId}
              roomId={roomId}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessage={sendMessage}
              editMode={editMode}
              editText={editText}
              setEditText={setEditText}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              saveEdit={saveEdit}
              deleteMessage={deleteMessage}
            />

            <User 
              roomId={roomId}
              roomMembers={roomMembers}
              inviteUser={inviteUser}
              setInviteUser={setInviteUser}
              inviteUserToRoom={inviteUserToRoom}
              joinRoomId={joinRoomId}
              setJoinRoomId={setJoinRoomId}
              joinRoom={joinRoom}
              kickUser={kickUser}
              currentUserId={userId}
            />
            
          </div>
        </div>
      )}
    </div>
  );
}

export default App;