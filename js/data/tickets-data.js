import { db, collection, getDocs, addDoc, orderBy, query } from '../firebase.js';
import { loadTicketsFromStorage, saveTicketsToStorage } from './storage.js';

function createLocalTicketId() {
  return `local-${Date.now()}`;
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

async function fetchTicketsJson() {
  const res = await fetch('./data/tickets.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Not an array');

  return data;
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

async function syncLocalOnlyTickets(localOnlyTickets, selectedTicketId) {
  const syncedTickets = [];
  let nextSelectedTicketId = selectedTicketId;

  for (const ticket of localOnlyTickets) {
    const firestoreId = await saveTicketToFirestore(ticket);

    if (firestoreId) {
      const { isLocalOnly, ...syncedTicket } = ticket;

      if (nextSelectedTicketId === ticket.id) {
        nextSelectedTicketId = firestoreId;
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
    selectedTicketId: nextSelectedTicketId,
  };
}

async function loadTicketsFromJson() {
  return await fetchTicketsJson();
}

async function seedFromJson() {
  try {
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
  } catch (err) {
    console.error('Seeding failed:', err);
    return false;
  }
}

export async function loadTicketsData({ selectedTicketId }) {
  const cachedTickets = loadTicketsFromStorage();

  try {
    const q = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const localOnlyTickets = getLocalOnlyTickets(cachedTickets);

    if (snapshot.empty) {
      const seeded = await seedFromJson();
      if (seeded) {
        return await loadTicketsData({ selectedTicketId });
      }

      const {
        syncedTickets,
        selectedTicketId: nextSelectedTicketId,
      } = localOnlyTickets.length > 0
        ? await syncLocalOnlyTickets(localOnlyTickets, selectedTicketId)
        : { syncedTickets: [], selectedTicketId };

      const cachedNonLocalTickets = cachedTickets.filter(ticket =>
        ticket.isLocalOnly !== true && !String(ticket.id).startsWith('local-')
      );

      const tickets = sortTicketsByNewest([
        ...cachedNonLocalTickets,
        ...syncedTickets,
      ]);

      if (tickets.length > 0) {
        saveTicketsToStorage(tickets);
      }

      return {
        tickets,
        selectedTicketId: nextSelectedTicketId,
        loadError: tickets.length === 0,
      };
    }

    const remoteTickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const {
      syncedTickets,
      selectedTicketId: nextSelectedTicketId,
    } = localOnlyTickets.length > 0
      ? await syncLocalOnlyTickets(localOnlyTickets, selectedTicketId)
      : { syncedTickets: [], selectedTicketId };

    const tickets = sortTicketsByNewest([
      ...remoteTickets,
      ...syncedTickets,
    ]);

    saveTicketsToStorage(tickets);

    return {
      tickets,
      selectedTicketId: nextSelectedTicketId,
      loadError: false,
    };
  } catch (err) {
    console.error('Firestore load failed:', err);

    if (cachedTickets.length > 0) {
      return {
        tickets: cachedTickets,
        selectedTicketId,
        loadError: false,
      };
    }

    try {
      const tickets = await loadTicketsFromJson();
      saveTicketsToStorage(tickets);

      return {
        tickets,
        selectedTicketId,
        loadError: false,
      };
    } catch (jsonErr) {
      console.error('JSON fallback load failed:', jsonErr);

      return {
        tickets: [],
        selectedTicketId,
        loadError: true,
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
