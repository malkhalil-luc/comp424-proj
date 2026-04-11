const STORAGE_KEY = 'portal-tickets-v1';

export function loadTicketsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('localStorage read failed:', err);
    return [];
  }
}

export function saveTicketsToStorage(tickets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.warn('localStorage write failed:', err);
  }
}
