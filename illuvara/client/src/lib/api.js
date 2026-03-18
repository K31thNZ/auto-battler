const BASE = '/api';

function getToken() {
  return localStorage.getItem('illuvara_token');
}

function headers(extra = {}) {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra
  };
}

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  connectWallet: (wallet_address) => req('/auth/connect', { method: 'POST', body: { wallet_address } }),
  getMe: () => req('/auth/me'),
  getProfile: () => req('/profile'),

  // Creatures
  getAllCreatures: () => req('/creatures/all'),
  getCollection: () => req('/creatures/collection'),
  setTeam: (slots) => req('/creatures/team', { method: 'POST', body: { slots } }),
  captureCreature: (zone) => req('/creatures/capture', { method: 'POST', body: { zone } }),
  evolveCreature: (playerCreatureId, choiceA) => req('/creatures/evolve', { method: 'POST', body: { playerCreatureId, choiceA } }),
  mergeCreatures: (playerCreatureIds) => req('/creatures/merge', { method: 'POST', body: { playerCreatureIds } }),

  // Battle
  startBattle: (difficulty) => req('/battle/start', { method: 'POST', body: { difficulty } }),
  getBattleHistory: () => req('/battle/history'),

  // Marketplace
  getListings: (filters = {}) => {
    const params = new URLSearchParams(Object.entries(filters).filter(([, v]) => v));
    return req(`/marketplace?${params}`);
  },
  buyListing: (listingId) => req(`/marketplace/buy/${listingId}`, { method: 'POST' }),
  listCreature: (playerCreatureId, price) => req('/marketplace/list', { method: 'POST', body: { playerCreatureId, price } }),
  delistCreature: (listingId) => req(`/marketplace/list/${listingId}`, { method: 'DELETE' }),
};
