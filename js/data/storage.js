const STORAGE_KEY = 'portal-tickets-v1';
const STORAGE_SAVED_AT_KEY = 'portal-tickets-saved-at-v1';

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

export function loadTicketsSavedAt() {
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_AT_KEY);
    if (!raw) {
      return null;
    }

    const savedAt = new Date(raw);
    return Number.isNaN(savedAt.getTime()) ? null : savedAt;
  } catch (err) {
    console.warn('localStorage savedAt read failed:', err);
    return null;
  }
}

export function saveTicketsToStorage(tickets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
    localStorage.setItem(STORAGE_SAVED_AT_KEY, new Date().toISOString());
  } catch (err) {
    console.warn('localStorage write failed:', err);
  }
}
