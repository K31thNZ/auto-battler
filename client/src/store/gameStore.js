import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export const useGameStore = create(
  persist(
    (set, get) => ({
      player: null,
      token: null,
      collection: [],
      team: [],
      isLoading: false,
      error: null,

      setToken: (token) => {
        localStorage.setItem('illuvara_token', token);
        set({ token });
      },

      connectWallet: async (address) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.connectWallet(address);
          localStorage.setItem('illuvara_token', data.token);
          set({ player: data.player, token: data.token, isLoading: false });
          return data;
        } catch (err) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      refreshPlayer: async () => {
        try {
          const data = await api.getMe();
          set({ player: data });
        } catch {}
      },

      loadCollection: async () => {
        try {
          const data = await api.getCollection();
          const team = data.filter(c => c.in_team).sort((a, b) => a.team_slot - b.team_slot);
          set({ collection: data, team });
        } catch (err) {
          console.error('loadCollection error:', err);
        }
      },

      updateTeam: async (slots) => {
        await api.setTeam(slots);
        await get().loadCollection();
        await get().refreshPlayer();
      },

      logout: () => {
        localStorage.removeItem('illuvara_token');
        set({ player: null, token: null, collection: [], team: [] });
      },
    }),
    { name: 'illuvara-store', partialize: (s) => ({ token: s.token, player: s.player }) }
  )
);

export const TYPE_COLORS = {
  Fire: '#ef4444', Water: '#3b82f6', Wind: '#10b981', Earth: '#84cc16',
  Thunder: '#eab308', Ice: '#67e8f9', Shadow: '#8b5cf6', Light: '#fbbf24',
  Poison: '#a855f7', Metal: '#9ca3af', Psychic: '#ec4899', Nature: '#22c55e',
};

export const RARITY_COLORS = {
  Common: '#6b7280', Rare: '#3b82f6', Legendary: '#fbbf24', Apex: '#ec4899',
};

export const TIER_NAMES = { 1: 'Tier I', 2: 'Tier II', 3: 'Tier III', 4: 'Legendary', 5: 'Apex' };

export const XP_NEEDED = (level) => level * 50;
