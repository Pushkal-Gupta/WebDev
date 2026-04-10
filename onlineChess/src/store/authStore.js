import { create } from 'zustand';
import { supabase } from '../utils/supabase';

let _authSub = null;

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  username: null,

  init: async () => {
    if (_authSub) return; // already initialized — prevent duplicate listeners

    const deriveUsername = (user) =>
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      user.email;

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      set({
        user: session.user,
        token: session.access_token,
        username: deriveUsername(session.user),
      });
    }

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        set({
          user: session.user,
          token: session.access_token,
          username: deriveUsername(session.user),
        });
      } else {
        set({ user: null, token: null, username: null });
      }
    });
    _authSub = data.subscription;
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  signup: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    });
    if (error) throw error;
    return data;
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (error) throw error;
  },

  resetPasswordForEmail: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  },

  verifyOtp: async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
    if (error) throw error;
  },

  updatePassword: async (newPass) => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, token: null, username: null });
  },
}));

export default useAuthStore;
