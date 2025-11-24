import { useState, useEffect } from 'react'
import './App.css'
// --- Імпортуємо компоненти ---
import Login from './components/Login/Login.jsx'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import Chat from './components/Chat/Chat.jsx'

function App() {
  // --- ВЕСЬ СТАН ЗАЛИШАЄТЬСЯ ТУТ ---
  // 1. Стан для полів форми
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 2. Стан для відповіді API
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  
  // 3. Стан для інтерфейсу
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 4. Стан для кімнат
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomId, setNewRoomId] = useState('');

  // 5. Стан для чату
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [inviteUser, setInviteUser] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [lastSyncToken, setLastSyncToken] = useState('');

  
  // --- ВСІ ФУНКЦІЇ ЗАЛИШАЮТЬСЯ ТУТ ---

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
          const newMessages = [];
          roomData.timeline.events.forEach(event => {
            if (event.type === 'm.room.message' && event.content.body) {
              newMessages.push({
                id: event.event_id,
                body: event.content.body,
                sender: event.sender
              });
            }
          });
          setMessages(prevMessages => {
            const existingIds = new Set(prevMessages.map(m => m.id));
            const filteredNew = newMessages.filter(m => !existingIds.has(m.id));
            return [...prevMessages, ...filteredNew];
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
      } else {
        console.error('Send failed:', data);
      }
    } catch (e) {
      console.error('Send message error:', e);
    }
  };

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

  const switchRoom = (newRoomId) => {
    if (newRoomId) {
      setRoomId(newRoomId);
    }
  };

  // --- Хуки 'useEffect' ---
  useEffect(() => {
    if (accessToken && roomId) {
      setMessages([]); 
      setLastSyncToken('');
      fetchMessages(true); 
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


  // --- JSX (РОЗМІТКА) ---
  // Вона стала набагато чистішою!
  return (
    <div 
      className={`app-container ${
        accessToken ? 'chat' : 'login' 
      }`}
    >
      
      {!accessToken ? (
        
        // --- ВІКНО ВХОДУ ---
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

        // --- ВІКНО ПІСЛЯ ВХОДУ (ОСНОВНИЙ ІНТЕРФЕЙС) ---
        <div className="main-chat-window">
          <div className="chat-layout">
            
            {/* === SIDEBAR === */}
            <Sidebar 
              rooms={rooms}
              roomId={roomId}
              switchRoom={switchRoom}
              newRoomName={newRoomName}
              setNewRoomName={setNewRoomName}
              newRoomId={newRoomId}
              createRoom={createRoom}
            />
            
            {/* === ОБЛАСТЬ ЧАТУ === */}
            <Chat 
              userId={userId}
              roomId={roomId}
              messages={messages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessage={sendMessage}
              inviteUser={inviteUser}
              setInviteUser={setInviteUser}
              inviteUserToRoom={inviteUserToRoom}
              joinRoomId={joinRoomId}
              setJoinRoomId={setJoinRoomId}
              joinRoom={joinRoom}
            />
            
          </div>
        </div>
      )}
      
    </div>
  );
}

export default App;