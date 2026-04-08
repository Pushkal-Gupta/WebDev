import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, UserPlus, Users, Check, Clock, Trash2 } from 'lucide-react';
import './SettingsModal.css';

export default function SettingsModal({ session, onClose }) {
  const [activeTab, setActiveTab] = useState('profile');
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
    if (!session?.user) return;
    try {
      const { data } = await supabase
        .from('PGcode_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (data) {
        setDisplayName(data.display_name || '');
      }
    } catch (err) {
      // Profile may not exist yet
    }
  };

  const saveProfile = async () => {
    if (!session?.user) return;
    const { error } = await supabase.from('PGcode_profiles').upsert({
      user_id: session.user.id,
      display_name: displayName,
    });
    if (error) {
      setMessage({ type: 'error', text: 'Failed to save profile.' });
    } else {
      setMessage({ type: 'success', text: 'Profile saved!' });
    }
    setTimeout(() => setMessage(null), 2000);
  };

  const loadFriends = async () => {
    if (!session?.user) return;
    try {
      const { data: sent } = await supabase
        .from('PGcode_friends')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'accepted');

      const { data: received } = await supabase
        .from('PGcode_friends')
        .select('*')
        .eq('friend_id', session.user.id)
        .eq('status', 'accepted');

      const { data: pending } = await supabase
        .from('PGcode_friends')
        .select('*')
        .eq('friend_id', session.user.id)
        .eq('status', 'pending');

      setFriends([...(sent || []), ...(received || [])]);
      setPendingRequests(pending || []);

      // Load friend profiles
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
    } catch (err) {
      console.error('Error loading friends:', err);
    }
  };

  const sendFriendRequest = async () => {
    if (!friendEmail.trim() || !session?.user) return;
    setMessage({ type: 'info', text: 'Friend request system requires user lookup. Share your profile link for now!' });
    setFriendEmail('');
    setTimeout(() => setMessage(null), 3000);
  };

  const acceptRequest = async (requestId) => {
    const { error } = await supabase
      .from('PGcode_friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (!error) loadFriends();
  };

  const rejectRequest = async (requestId) => {
    const { error } = await supabase
      .from('PGcode_friends')
      .delete()
      .eq('id', requestId);
    if (!error) loadFriends();
  };

  return (
    <div className="settings-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="settings-content">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="settings-close" onClick={onClose}><X size={20} /></button>
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

              {pendingRequests.length > 0 && (
                <div className="friend-group">
                  <span className="friend-group-label">
                    <Clock size={12} /> Pending Requests
                  </span>
                  {pendingRequests.map(req => (
                    <div key={req.id} className="friend-item pending">
                      <span className="friend-name">Friend request</span>
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
                            {profile?.total_solved || 0} solved
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
