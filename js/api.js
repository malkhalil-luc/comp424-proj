import { db, collection, getDocs, addDoc, orderBy, query } from './firebase.js';
import {
  loadTicketsFromStorage,
  loadTicketsSavedAt,
  saveTicketsToStorage,
} from './data/storage.js';

const DATA_URL = './data/tickets.json';
const LOAD_TIMEOUT_MS = 8000;

class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
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
    throw new ApiError('validation', 'Ticket data must be an array.');
  }

  if (!tickets.every(isValidTicket)) {
    throw new ApiError('validation', 'Ticket data is missing required fields.');
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

function withTimeout(promise, timeoutMs) {
  let timerId;

  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => {
      reject(new ApiError('timeout', 'Loading tickets timed out.'));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timerId);
  });
}

function toStructuredError(err) {
  if (err instanceof ApiError) {
    return err;
  }

  if (err?.name === 'AbortError') {
    return new ApiError('timeout', 'Loading tickets timed out.');
  }

  if (err instanceof SyntaxError) {
    return new ApiError('parse', 'Ticket data could not be parsed.');
  }

  if (err instanceof TypeError) {
    return new ApiError('network', 'A network error occurred while loading tickets.');
  }

  return new ApiError('unknown', 'Something went wrong while loading tickets.');
}

function toUserMessage(error) {
  switch (error.code) {
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
      throw new ApiError('http', `HTTP ${response.status}`);
    }

    const data = await response.json();
    assertValidTickets(data);
    return data;
  } catch (err) {
    throw toStructuredError(err);
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
  } catch (err) {
    console.error('Firestore write failed:', err);
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
  const data = await fetchTicketsJson();

  for (const ticket of data) {
    await addDoc(collection(db, 'tickets'), {
      title: ticket.title,
      description: ticket.description,
      ticketStatus: ticket.ticketStatus,
      createdAt: ticket.createdAt,
    });
  }

  return true;
}

async function loadFallbackTickets({ cachedTickets }) {
  const fallbackResults = await Promise.allSettled([
    Promise.resolve(cachedTickets),
    fetchTicketsJson(),
  ]);

  const [cachedResult, jsonResult] = fallbackResults;

  if (cachedResult.status === 'fulfilled' && cachedResult.value.length > 0) {
    return {
      tickets: cachedResult.value,
      staleNotice: 'Showing cached tickets from local storage.',
      lastLoadedAt: loadTicketsSavedAt(),
    };
  }

  if (jsonResult.status === 'fulfilled') {
    saveTicketsToStorage(jsonResult.value);

    return {
      tickets: jsonResult.value,
      staleNotice: 'Showing fallback tickets from local JSON.',
      lastLoadedAt: loadTicketsSavedAt(),
    };
  }

  throw toStructuredError(jsonResult.reason);
}

export async function loadTicketsData({ selectedId }) {
  const cachedTickets = loadTicketsFromStorage().filter(isValidTicket);
  const cachedSavedAt = loadTicketsSavedAt();

  try {
    const ticketsQuery = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await withTimeout(getDocs(ticketsQuery), LOAD_TIMEOUT_MS);
    const localOnlyTickets = getLocalOnlyTickets(cachedTickets);

    if (snapshot.empty) {
      await seedFromJson();
      return await loadTicketsData({ selectedId });
    }

    const remoteTickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    assertValidTickets(remoteTickets);

    const {
      syncedTickets,
      selectedId: nextSelectedId,
    } = localOnlyTickets.length > 0
      ? await syncLocalOnlyTickets(localOnlyTickets, selectedId)
      : { syncedTickets: [], selectedId };

    const tickets = sortTicketsByNewest([
      ...remoteTickets,
      ...syncedTickets,
    ]);

    saveTicketsToStorage(tickets);

    return {
      tickets,
      selectedId: nextSelectedId,
      error: '',
      staleNotice: '',
      lastLoadedAt: loadTicketsSavedAt(),
    };
  } catch (err) {
    const structuredError = toStructuredError(err);
    const userMessage = toUserMessage(structuredError);

    try {
      const fallback = await loadFallbackTickets({ cachedTickets });

      return {
        tickets: fallback.tickets,
        selectedId,
        error: userMessage,
        staleNotice: fallback.tickets === cachedTickets && cachedTickets.length > 0
          ? formatStaleMessage(cachedSavedAt, 'cached tickets from local storage')
          : fallback.staleNotice,
        lastLoadedAt: fallback.lastLoadedAt,
      };
    } catch (jsonErr) {
      const fallbackError = toStructuredError(jsonErr);

      return {
        tickets: [],
        selectedId,
        error: toUserMessage(fallbackError.code === 'timeout' ? fallbackError : structuredError),
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
