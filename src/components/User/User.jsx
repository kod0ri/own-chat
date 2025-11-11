import React from "react";
import "./User.css";

// Цей компонент, як і інші, отримує все від App.jsx
function User({
  roomId,
  roomMembers,
  inviteUser,
  setInviteUser,
  inviteUserToRoom,
  joinRoomId,
  setJoinRoomId,
  joinRoom,
}) {
  return (
    <div className="user-sidebar">
    <h2 className="sidebar-title">Users</h2>

      {/* Список учасників [cite: 354-372] */}
      {roomId && (
        <div className="members-list-block">
          <h3>Учасники кімнати</h3>
          {roomMembers.length === 0 ? (
            <p>Завантаження...</p>
          ) : (
            <ul className="members-list">
              {roomMembers.map((member) => (
                <li key={member.userId}>
                  <strong>{member.displayName}</strong>
                  <span className="username">
                    {" "}
                    ({member.userId.split(":")[0].substring(1)})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Запрошення та приєднання [cite: 373-387] */}
      <div className="invite-join-area">
        <div>
          <input
            value={inviteUser}
            onChange={(e) => setInviteUser(e.target.value)}
            placeholder="Invite user (e.g., @user:matrix.org)"
          />
          <button onClick={inviteUserToRoom} className="invite-button">
            Invite
          </button>
        </div>
        <div>
          <input
            value={joinRoomId}
            onChange={(e) => setJoinRoomId(e.target.value)}
            placeholder="Room ID to join (e.g., !roomId:matrix.org)"
          />
          <button onClick={joinRoom} className="join-button">
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}

export default User;
