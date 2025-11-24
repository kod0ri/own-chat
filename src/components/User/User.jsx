import React from "react";
import "./User.css";

// 1. Приймаємо 'kickUser' та 'currentUserId' у props
function User({
  roomId,
  roomMembers,
  inviteUser,
  setInviteUser,
  inviteUserToRoom,
  joinRoomId,
  setJoinRoomId,
  joinRoom,
  kickUser,
  currentUserId
}) {
  return (
    <div className="user-sidebar">
      <h2 className="sidebar-title">Users</h2>

      {/* Список учасників */}
      {roomId && (
        <div className="members-list-block">
          <h3>Учасники кімнати</h3>
          {roomMembers.length === 0 ? (
            <p>Завантаження...</p>
          ) : (
            <ul className="members-list">
              {roomMembers.map((member) => (
                <li key={member.userId}>
                  {/* 2. Обгортаємо текст в div */}
                  <div className="member-info">
                    <strong>{member.displayName}</strong>
                    <span className="username">
                      {" "}
                      ({member.userId.split(":")[0].substring(1)})
                    </span>
                  </div>

                  {/* 3. Додаємо кнопку "Kick" (тільки якщо це не ми самі) */}
                  {member.userId !== currentUserId && (
                    <button
                      className="kick-user-btn"
                      title="Викинути з кімнати"
                      onClick={() => kickUser(member.userId)}
                    >
                      X
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Запрошення та приєднання */}
      <div className="invite-join-area">
        {/* ... (код форми запрошення без змін) ... */}
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