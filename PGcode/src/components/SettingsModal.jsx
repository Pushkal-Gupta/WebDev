import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, UserPlus, Users, Check, Clock, Trash2 } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ session, onClose }) {
  const [activeTab, setActiveTab] = useState('friends');
  const [friendEmail, setFriendEmail] = useState('');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friendProgress, setFriendProgress] = useState({});
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!session?.user) return;
    loadProfile();
    loadFriends();
  }, [session]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('PGcode_profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (data) {
      setDisplayName(data.display_name || '');
    }
  };

  const saveProfile = async () => {
    await supabase.from('PGcode_profiles').upsert({
      user_id: session.user.id,
      display_name: displayName,
    });
    setMessage({ type: 'success', text: 'Profile saved!' });
    setTimeout(() => setMessage(null), 2000);
  };

  const loadFriends = async () => {
    // Get accepted friends (where I'm the sender or receiver)
    const { data: sent } = await supabase
      .from('PGcode_friends')
      .select('*, friend:friend_id(email:user_id)')
      .eq('user_id', session.user.id)
      .eq('status', 'accepted');

    const { data: received } = await supabase
      .from('PGcode_friends')
      .select('*, sender:user_id(email:user_id)')
      .eq('friend_id', session.user.id)
      .eq('status', 'accepted');

    const { data: pending } = await supabase
      .from('PGcode_friends')
      .select('*')
      .eq('friend_id', session.user.id)
      .eq('status', 'pending');

    setFriends([...(sent || []), ...(received || [])]);
    setPendingRequests(pending || []);

    // Load friend progress (total solved counts)
    const friendIds = [
      ...(sent || []).map(f => f.friend_id),
      ...(received || []).map(f => f.user_id),
    ];

    if (friendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('PGcode_profiles')
        .select('*')
        .in('user_id', friendIds);

      const map = {};
      (profiles || []).forEach(p => { map[p.user_id] = p; });
      setFriendProgress(map);
    }
  };

  const sendFriendRequest = async () => {
    if (!friendEmail.trim()) return;

    // Look up the user by email - we need to search auth.users
    // Since we can't query auth.users directly, we'll store the email as friend_id placeholder
    // In practice, you'd need a profiles table lookup
    setMessage({ type: 'info', text: `Friend request system requires user lookup. For now, share your profile link!` });
    setFriendEmail('');
    setTimeout(() => setMessage(null), 3000);
  };

  const acceptRequest = async (requestId) => {
    await supabase
      .from('PGcode_friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    loadFriends();
  };

  const rejectRequest = async (requestId) => {
    await supabase
      .from('PGcode_friends')
      .delete()
      .eq('id', requestId);
    loadFriends();
  };

  return (
    <div className="settings-overlay" onClick={(e) => {
      if (e.target.className === 'settings-overlay') onClose();
    }}>
      <div className="settings-content">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="closeBtn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`settings-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends
          </button>
        </div>

        <div className="settings-body">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <label className="settings-label">Display Name</label>
              <input
                type="text"
                className="settings-input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your display name"
              />
              <p className="settings-hint">Email: {session?.user?.email}</p>
              <button className="settings-save-btn" onClick={saveProfile}>Save Profile</button>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="friends-section">
              {/* Add Friend */}
              <div className="add-friend-row">
                <input
                  type="email"
                  className="settings-input"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  placeholder="Friend's email address"
                />
                <button className="add-friend-btn" onClick={sendFriendRequest}>
                  <UserPlus size={14} /> Add
                </button>
              </div>

              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div className="friend-group">
                  <span className="friend-group-label">
                    <Clock size={12} /> Pending Requests
                  </span>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="friend-item pending">
                      <span className="friend-name">Request from user</span>
                      <div className="friend-actions">
                        <button className="friend-accept" onClick={() => acceptRequest(req.id)}>
                          <Check size={14} />
                        </button>
                        <button className="friend-reject" onClick={() => rejectRequest(req.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Friends List */}
              <div className="friend-group">
                <span className="friend-group-label">
                  <Users size={12} /> Friends ({friends.length})
                </span>
                {friends.length === 0 ? (
                  <p className="friends-empty">No friends yet. Add someone to see their progress!</p>
                ) : (
                  friends.map((f, i) => {
                    const fId = f.friend_id === session.user.id ? f.user_id : f.friend_id;
                    const profile = friendProgress[fId];
                    return (
                      <div key={i} className="friend-item">
                        <div className="friend-info">
                          <span className="friend-name">{profile?.display_name || 'User'}</span>
                          <span className="friend-stats">
                            {profile?.total_solved || 0} solved · {profile?.current_streak || 0} day streak
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {message && (
            <div className={`settings-message ${message.type}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
