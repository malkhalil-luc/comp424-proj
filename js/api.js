import { db, collection, getDocs, addDoc, orderBy, query } from './firebase.js';
import {
  loadTicketsFromStorage,
  loadTicketsSavedAt,
  saveTicketsToStorage,
} from './data/storage.js';

const DATA_URL = './data/tickets.json';
const LOAD_TIMEOUT_MS = 8000;

function makeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createLocalTicketId() {
  return `local-${Date.now()}`;
}

function isValidTicket(ticket) {
  return (
    ticket &&
    typeof ticket === 'object' &&
    typeof ticket.id === 'string' &&
    typeof ticket.title === 'string' &&
    typeof ticket.description === 'string' &&
    typeof ticket.ticketStatus === 'string' &&
    typeof ticket.createdAt === 'string' &&
    !Number.isNaN(new Date(ticket.createdAt).getTime())
  );
}

function assertValidTickets(tickets) {
  if (!Array.isArray(tickets)) {
    throw makeError('validation', 'Ticket data must be an array.');
  }

  if (!tickets.every(isValidTicket)) {
    throw makeError('validation', 'Ticket data is missing required fields.');
  }
}

function getLocalOnlyTickets(tickets) {
  return tickets.filter(ticket =>
    ticket.isLocalOnly === true || String(ticket.id).startsWith('local-')
  );
}

function sortTicketsByNewest(tickets) {
  return [...tickets].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function createAbortControllerWithTimeout(timeoutMs) {
  const controller = new AbortController();
  const timerId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timerId);
    },
  };
}

function waitWithTimeout(promise, timeoutMs) {
  let timerId;

  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(makeError('timeout', 'Loading tickets timed out.'));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
}

function getErrorCode(error) {
  if (error?.code) {
    return error.code;
  }

  if (error?.name === 'AbortError') {
    return 'timeout';
  }

  if (error instanceof SyntaxError) {
    return 'parse';
  }

  if (error instanceof TypeError) {
    return 'network';
  }

  return 'unknown';
}

function getErrorMessage(error) {
  switch (getErrorCode(error)) {
    case 'timeout':
      return 'Loading tickets took too long. Please try again.';
    case 'network':
      return 'Could not reach the ticket service. Please check your connection and try again.';
    case 'http':
      return 'The ticket service returned an error. Please try again.';
    case 'parse':
      return 'The ticket data could not be read.';
    case 'validation':
      return 'The ticket data was not in the expected format.';
    default:
      return 'Something went wrong while loading tickets.';
  }
}

function formatStaleMessage(savedAt, sourceLabel) {
  if (!savedAt) {
    return `Showing ${sourceLabel} while live data is unavailable.`;
  }

  const elapsedMs = Date.now() - savedAt.getTime();
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));

  return `Showing ${sourceLabel} (last refreshed ${elapsedMinutes} min ago).`;
}

async function fetchTicketsJson() {
  const { signal, cleanup } = createAbortControllerWithTimeout(LOAD_TIMEOUT_MS);

  try {
    const response = await fetch(DATA_URL, {
      signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw makeError('http', `HTTP ${response.status}`);
    }

    const data = await response.json();
    assertValidTickets(data);
    return data;
  } finally {
    cleanup();
  }
}

async function saveTicketToFirestore(ticket) {
  if (!navigator.onLine) {
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, 'tickets'), {
      title: ticket.title,
      description: ticket.description,
      ticketStatus: ticket.ticketStatus,
      createdAt: ticket.createdAt,
    });

    return docRef.id;
  } catch (error) {
    console.error('Firestore write failed:', error);
    return null;
  }
}

async function syncLocalOnlyTickets(localOnlyTickets, selectedId) {
  const syncedTickets = [];
  let nextSelectedId = selectedId;

  for (const ticket of localOnlyTickets) {
    const firestoreId = await saveTicketToFirestore(ticket);

    if (firestoreId) {
      const { isLocalOnly, ...syncedTicket } = ticket;

      if (nextSelectedId === ticket.id) {
        nextSelectedId = firestoreId;
      }

      syncedTickets.push({
        ...syncedTicket,
        id: firestoreId,
      });
    } else {
      syncedTickets.push(ticket);
    }
  }

  return {
    syncedTickets,
    selectedId: nextSelectedId,
  };
}

async function seedFromJson() {
  const tickets = await fetchTicketsJson();

  for (const ticket of tickets) {
    await addDoc(collection(db, 'tickets'), {
      title: ticket.title,
      description: ticket.description,
      ticketStatus: ticket.ticketStatus,
      createdAt: ticket.createdAt,
    });
  }
}

async function loadFallbackTickets(cachedTickets) {
  const results = await Promise.allSettled([
    Promise.resolve(cachedTickets),
    fetchTicketsJson(),
  ]);

  const [cachedResult, jsonResult] = results;

  if (cachedResult.status === 'fulfilled' && cachedResult.value.length > 0) {
    return {
      tickets: cachedResult.value,
      source: 'cache',
      lastLoadedAt: loadTicketsSavedAt(),
    };
  }

  if (jsonResult.status === 'fulfilled') {
    saveTicketsToStorage(jsonResult.value);

    return {
      tickets: jsonResult.value,
      source: 'json',
      lastLoadedAt: loadTicketsSavedAt(),
    };
  }

  throw jsonResult.reason;
}

export async function loadTicketsData({ selectedId }) {
  const cachedTickets = loadTicketsFromStorage().filter(isValidTicket);
  const cachedSavedAt = loadTicketsSavedAt();

  try {
    const ticketsQuery = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await waitWithTimeout(getDocs(ticketsQuery), LOAD_TIMEOUT_MS);
    const localOnlyTickets = getLocalOnlyTickets(cachedTickets);

    if (snapshot.empty) {
      await seedFromJson();
      return loadTicketsData({ selectedId });
    }

    const remoteTickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    assertValidTickets(remoteTickets);

    const syncedResult = localOnlyTickets.length > 0
      ? await syncLocalOnlyTickets(localOnlyTickets, selectedId)
      : { syncedTickets: [], selectedId };

    const tickets = sortTicketsByNewest([
      ...remoteTickets,
      ...syncedResult.syncedTickets,
    ]);

    saveTicketsToStorage(tickets);

    return {
      tickets,
      selectedId: syncedResult.selectedId,
      error: '',
      staleNotice: '',
      lastLoadedAt: loadTicketsSavedAt(),
    };
  } catch (error) {
    try {
      const fallback = await loadFallbackTickets(cachedTickets);
      const staleNotice = fallback.source === 'cache'
        ? formatStaleMessage(cachedSavedAt, 'cached tickets from local storage')
        : 'Showing fallback tickets from local JSON.';

      return {
        tickets: fallback.tickets,
        selectedId,
        error: getErrorMessage(error),
        staleNotice,
        lastLoadedAt: fallback.lastLoadedAt,
      };
    } catch (fallbackError) {
      return {
        tickets: [],
        selectedId,
        error: getErrorMessage(fallbackError.code === 'timeout' ? fallbackError : error),
        staleNotice: '',
        lastLoadedAt: null,
      };
    }
  }
}

export async function createTicket(newTicket) {
  const firestoreId = await saveTicketToFirestore(newTicket);

  if (firestoreId) {
    return {
      ticket: {
        ...newTicket,
        id: firestoreId,
      },
      savedLocallyOnly: false,
    };
  }

  return {
    ticket: {
      ...newTicket,
      id: createLocalTicketId(),
      isLocalOnly: true,
    },
    savedLocallyOnly: true,
  };
}

export function persistTickets(tickets) {
  saveTicketsToStorage(tickets);
}
