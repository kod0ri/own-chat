import React, { useEffect } from 'react';
import './Chat.css';

function Chat({
  userId,
  roomId,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  editMode,
  editText,
  setEditText,
  startEdit,
  cancelEdit,
  saveEdit,
  deleteMessage
}) {
  
  // Автопрокрутка до низу при нових повідомленнях
  useEffect(() => {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }, [messages, editMode]);

  return (
    <div className="chat-area">
      <div className="chat-header">
        <div>
          <span className="font-bold">Your Matrix ID:</span>
          <span className="ml-1">{userId ? userId : 'Loading...'}</span>
        </div>
        <div className="text-right">
          <span className="font-bold">Room ID: </span>
          <span className="room-id">{roomId || 'Not selected'}</span>
        </div>
      </div>

      <div id="messages">
        {messages.length === 0 ? (
          <p style={{textAlign: 'center', color: 'var(--color-text-secondary)'}}>
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map(msg => (
            <div className="message-item" key={msg.id}>
              <div className="message-content-row">
                <div>
                   <strong className={`message-sender ${msg.sender === userId ? 'you' : ''}`}>
                    {msg.sender === userId ? 'You' : msg.sender.split(':')[0].substring(1)}:
                  </strong>
                  
                  <span className="message-body">{msg.body}</span>
                  
                  {msg.edited && <span className="edited-label">(edited)</span>}
                </div>

                {msg.sender === userId && (
                   <div className="message-actions">
                     <button 
                       className="action-btn edit-btn" 
                       onClick={() => startEdit(msg.id, msg.body)}
                     >
                       Edit
                     </button>
                     <button 
                       className="action-btn delete-btn" 
                       onClick={() => deleteMessage(msg.id)}
                     >
                       Delete
                     </button>
                   </div>
                )}
              </div>

              {editMode === msg.id && (
                <div className="edit-form">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveEdit(msg.id);
                        } else if (e.key === 'Escape') {
                            cancelEdit();
                        }
                    }}
                    className="edit-textarea"
                    rows="2"
                  />
                  <div className="edit-buttons">
                    <button className="save-btn" onClick={() => saveEdit(msg.id)}>Save</button>
                    <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="message-input-area">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message here..."
          className="message-input"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button onClick={sendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;