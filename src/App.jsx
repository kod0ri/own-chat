import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // 1. Стан для полів форми
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // 2. Стан для відповіді API
  const [accessToken, setAccessToken] = useState('');
  const [userId, setUserId] = useState('');
  
  // 3. Стан для інтерфейсу (помилки, завантаження)
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [rooms, setRooms] = useState([]); // [cite: 134]
  const [roomId, setRoomId] = useState(''); // [cite: 131]
  const [newRoomName, setNewRoomName] = useState(''); // [cite: 133]
  const [newRoomId, setNewRoomId] = useState(''); // [cite: 134]

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
        // **ЛОКАЛІЗАЦІЯ (Request 2)**
        setError(data.error || 'Невірний логін або пароль');
      }

    } catch (e) {
      // **ЛОКАЛІЗАЦІЯ (Request 2)**
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
        headers: { 'Authorization': `Bearer ${token}`} // [cite: 235]
      });
      const data = await res.json();
      if (data.joined_rooms) {
        const roomPromises = data.joined_rooms.map(async (roomId) => {
          const nameRes = await fetch(`https://matrix.org/_matrix/client/r0/rooms/${encodeURIComponent(roomId)}/state/m.room.name`, {
            headers: { 'Authorization': `Bearer ${token}` } // [cite: 240, 242]
          });
          const nameData = await nameRes.json();
          return {
            roomId,
            name: nameData?.name || roomId // [cite: 248]
          };
        });
        const fetchedRooms = await Promise.all(roomPromises);
        
        // Сортування, як у завданні [cite: 250]
        fetchedRooms.sort((a, b) => a.name.localeCompare(b.name));
        
        setRooms(fetchedRooms);
        if (fetchedRooms.length > 0 && !roomId) {
          setRoomId(fetchedRooms[0].roomId); // [cite: 251, 252]
        }
      }
    } catch (e) {
      console.error('Fetch rooms error:', e); // [cite: 258]
    }
  };

  // --- ДОДАЙТЕ ЦЮ ФУНКЦІЮ (Логіка з createRoom [cite: 199]) ---
  const createRoom = async () => {
    if (!newRoomName.trim()) return; // [cite: 201]
    try {
      const res = await fetch('https://matrix.org/_matrix/client/r0/createRoom', {
        method: 'POST', // [cite: 204]
        headers: {
          'Content-Type': 'application/json', // [cite: 206]
          'Authorization': `Bearer ${accessToken}` // [cite: 207]
        },
        body: JSON.stringify({ preset: 'private_chat', name: newRoomName.trim() }) // [cite: 209, 210]
      });
      const data = await res.json();
      if (data.room_id) {
        setNewRoomId(data.room_id); // [cite: 214]
        setRoomId(data.room_id); // [cite: 215]
        await fetchRoomsWithNames(accessToken); // Оновлюємо список кімнат [cite: 218]
        alert(`Room '${newRoomName}' created with ID: ${data.room_id}`); // [cite: 221]
        setNewRoomName('');
      } else {
        alert('Create room failed: ' + (data.error || 'Unknown error')); // [cite: 224]
      }
    } catch (e) {
      alert('Create room error: ' + e.message); // [cite: 227]
    }
  };

  useEffect(() => {
  if (accessToken) {
    const interval = setInterval(() => {
      fetchRoomsWithNames(accessToken);
    }, 5000); // [cite: 77]

    return () => clearInterval(interval); // Очистка
  }
  }, [accessToken]);

  return (
    <div className="bg-gray-100 flex items-center justify-center h-screen p-4">
      {/* **РОЗШИРЕННЯ ВІКНА (Request 3)** Змінюємо ширину контейнера в залежності від стану accessToken
      */}
      <div 
        className={`bg-white p-6 rounded shadow-md transition-all duration-300 ${
          accessToken ? 'w-full max-w-2xl' : 'w-96'
        }`}
      >
        
        {!accessToken ? (
          // --- ВІКНО ВХОДУ ---
          <div>
            <h2 className="text-xl font-bold mb-4">Login to Matrix</h2>
            
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (e.g., @user:matrix.org)"
              className="border p-2 w-full mb-2 rounded"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="border p-2 w-full mb-2 rounded"
            />
            
            <button
              onClick={handleLogin}
              disabled={loading}
              className="bg-blue-500 text-white p-2 w-full rounded disabled:bg-gray-400"
            >
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
            
            {error && (
              <p className="text-red-500 mt-2">{error}</p>
            )}
          </div>
        ) : (
          // --- ВІКНО ПІСЛЯ ВХОДУ (Requests 1 & 4) ---
          // --- ВІКНО ПІСЛЯ ВХОДУ (Адаптація Завдання 2) ---
          <div className="flex flex-col h-[550px]">
            {/* Блок з ID, як у вас і було */}
            <div className="mb-2 p-2 bg-gray-200 rounded text-sm break-words">
              <span className="font-bold">Your Matrix ID:</span>
              <span> {userId ? userId : 'Loading...'}</span>
            </div>

            <div className="flex flex-grow overflow-hidden border rounded">
              
              {/* === SIDEBAR (ЗАВДАННЯ 2) [cite: 177-197] === */}
              <div className="sidebar p-4 bg-gray-50 border-r border-gray-200 overflow-y-auto"> {/* [cite: 179] */}
                <h2 className="text-xl font-bold mb-4">Rooms</h2> {/* [cite: 180] */}
                
                {/* Список кімнат [cite: 181] */}
                <ul className="room-list space-y-1">
                  {rooms.map(room => (
                    <li
                      key={room.roomId}
                      onClick={() => setRoomId(room.roomId)} // [cite: 184]
                      // [cite: 185, 187]
                      className={`cursor-pointer rounded-lg ${room.roomId === roomId ? 'active' : ''}`} 
                    >
                      {room.name || room.roomId} {/* [cite: 186] */}
                    </li>
                  ))}
                </ul>

                {/* Форма створення кімнати [cite: 191-195] */}
                <div className="mt-4">
                  <input
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="New room name"
                    className="border p-2 w-full mb-2 rounded" // [cite: 192]
                  />
                  <button
                    onClick={createRoom}
                    className="bg-indigo-500 text-white p-2 w-full rounded hover:bg-indigo-600 transition" // [cite: 193]
                  >
                    Create Room
                  </button>
                  {newRoomId && (
                    <p className="text-sm text-gray-600 mt-1">Room ID: <span>{newRoomId}</span></p> // [cite: 194]
                  )}
                </div>
              </div>
              
              {/* === ОБЛАСТЬ ЧАТУ (поки що заглушка) === */}
              <div className="chat-area flex-grow p-4 flex flex-col"> {/* [cite: 103, 104] */}
                <h2 className="text-xl font-bold mb-4">Chat Area</h2>
                <p className="mb-2">Selected Room ID: <span className="font-mono">{roomId}</span></p>
                <div className="flex-grow bg-gray-100 p-2 rounded border overflow-y-auto">
                  <p className="text-gray-500">Повідомлення з'являться тут...</p>
                </div>
                <textarea
                  placeholder="Type a message..."
                  className="message-input border p-2 w-full mt-2 rounded" // [cite: 106]
                />
              </div>

            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default App;