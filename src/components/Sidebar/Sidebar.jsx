import React from 'react';
import './Sidebar.css'; // Імпортуємо стилі

// Видалено всі класи Tailwind
function Sidebar({
  rooms,
  roomId,
  switchRoom,
  newRoomName,
  setNewRoomName,
  newRoomId,
  createRoom
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
            {room.name || room.roomId}
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