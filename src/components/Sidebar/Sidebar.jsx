import React from 'react';
import './Sidebar.css'; 

// 1. Приймаємо 'leaveRoom' у props
function Sidebar({
  rooms,
  roomId,
  switchRoom,
  newRoomName,
  setNewRoomName,
  newRoomId,
  createRoom,
  leaveRoom 
}) {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Rooms</h2>
      
      <ul className="room-list">
        {rooms.map(room => (
          <li
            key={room.roomId}
            onClick={() => switchRoom(room.roomId)}
            className={room.roomId === roomId ? 'active' : ''}
          >
            {/* 2. Обгортаємо назву в span, щоб кнопка була окремо */}
            <span className="room-name">{room.name || room.roomId}</span>
            
            {/* 3. Додаємо кнопку Видалення */}
            <button
              className="leave-room-btn"
              title="Покинути кімнату"
              onClick={(e) => {
                e.stopPropagation(); // Це аналог ".stop" з Alpine.js [cite: 19]
                leaveRoom(room.roomId);
              }}
            >
              X
            </button>
          </li>
        ))}
      </ul>
      
      <div className="create-room-form">
        <input
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          placeholder="New room name"
        />
        <button onClick={createRoom}>
          Create Room
        </button>
        {newRoomId && (
          <p className="room-id-display">
            Room ID: <span>{newRoomId}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default Sidebar;