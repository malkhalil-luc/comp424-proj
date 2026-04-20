import {
  db,
  doc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
} from './firebase.js';
import {
  loadTicketsFromStorage,
  loadTicketsSavedAt,
  saveTicketsToStorage,
} from './data/storage.js';

const DATA_URL = './data/tickets.json';
const EVENTS_URL = './data/events.json';
const ANNOUNCEMENTS_URL = './data/announcements.json';
const NEWS_URL = './data/news.json';
const EMPLOYEES_URL = './data/employees.json';
const USERS_URL = './data/users.json';
const LOAD_TIMEOUT_MS = 8000;
const DEFAULT_CREATOR_ID = 'staff-001';
const CHICAGO_WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=41.8781&longitude=-87.6298&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago';

function makeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function createLocalTicketId() {
  return `local-${Date.now()}`;
}

function createMessageId() {
  return `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function isValidDateString(value) {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

function isValidMessage(message) {
  return (
    message &&
    typeof message === 'object' &&
    typeof message.id === 'string' &&
    typeof message.authorId === 'string' &&
    typeof message.authorRole === 'string' &&
    typeof message.body === 'string' &&
    isValidDateString(message.createdAt) &&
    typeof message.kind === 'string'
  );
}

function normalizeMessages(ticket) {
  if (Array.isArray(ticket.messages) && ticket.messages.every(isValidMessage)) {
    return ticket.messages.map(message => ({
      ...message,
      kind: message.kind || 'reply',
    }));
  }

  return [
    {
      id: createMessageId(),
      authorId: typeof ticket.createdByUserId === 'string'
        ? ticket.createdByUserId
        : DEFAULT_CREATOR_ID,
      authorRole: 'staff',
      body: typeof ticket.description === 'string' ? ticket.description : '',
      createdAt: ticket.createdAt,
      kind: 'ticket',
    },
  ];
}

function normalizeTicket(ticket) {
  if (
    !ticket ||
    typeof ticket !== 'object' ||
    typeof ticket.id !== 'string' ||
    typeof ticket.title !== 'string' ||
    typeof ticket.description !== 'string' ||
    typeof ticket.ticketStatus !== 'string' ||
    !isValidDateString(ticket.createdAt)
  ) {
    throw makeError('validation', 'Ticket data is missing required fields.');
  }

  const priority = ['low', 'medium', 'high'].includes(ticket.priority)
    ? ticket.priority
    : 'medium';
  const assignedAgentId = typeof ticket.assignedAgentId === 'string' && ticket.assignedAgentId !== ''
    ? ticket.assignedAgentId
    : null;
  const createdByUserId = typeof ticket.createdByUserId === 'string'
    ? ticket.createdByUserId
    : DEFAULT_CREATOR_ID;
  const updatedAt = isValidDateString(ticket.updatedAt) ? ticket.updatedAt : ticket.createdAt;
  const closedAt = isValidDateString(ticket.closedAt) ? ticket.closedAt : null;

  return {
    ...ticket,
    priority,
    assignedAgentId,
    createdByUserId,
    updatedAt,
    closedAt,
    messages: normalizeMessages({
      ...ticket,
      createdByUserId,
    }),
  };
}

function normalizeTickets(tickets) {
  if (!Array.isArray(tickets)) {
    throw makeError('validation', 'Ticket data must be an array.');
  }

  return tickets.map(normalizeTicket);
}

function normalizeEvents(events) {
  if (!Array.isArray(events)) {
    throw makeError('validation', 'Events data must be an array.');
  }

  return events
    .filter((event) =>
      event
      && typeof event.id === 'string'
      && typeof event.title === 'string'
      && typeof event.eventType === 'string'
      && isValidDateString(event.startsAt)
      && typeof event.location === 'string'
    )
    .map((event) => ({
      ...event,
      description: typeof event.description === 'string'
        ? event.description
        : 'No event details were provided.',
      organizer: typeof event.organizer === 'string'
        ? event.organizer
        : 'Portal Staff',
    }));
}

function normalizeAnnouncements(announcements) {
  if (!Array.isArray(announcements)) {
    throw makeError('validation', 'Announcements data must be an array.');
  }

  return announcements
    .filter((announcement) =>
      announcement
      && typeof announcement.id === 'string'
      && typeof announcement.title === 'string'
      && typeof announcement.body === 'string'
      && typeof announcement.isPinned === 'boolean'
      && isValidDateString(announcement.publishedAt)
    )
    .map((announcement) => ({
      ...announcement,
      updatedAt: isValidDateString(announcement.updatedAt)
        ? announcement.updatedAt
        : announcement.publishedAt,
    }));
}

function normalizeNewsArticles(newsArticles) {
  if (!Array.isArray(newsArticles)) {
    throw makeError('validation', 'News data must be an array.');
  }

  return newsArticles
    .filter((article) =>
      article
      && typeof article.id === 'string'
      && typeof article.title === 'string'
      && typeof article.category === 'string'
      && typeof article.summary === 'string'
      && typeof article.body === 'string'
      && typeof article.isFeatured === 'boolean'
      && isValidDateString(article.publishedAt)
    )
    .map((article) => ({
      ...article,
      updatedAt: isValidDateString(article.updatedAt)
        ? article.updatedAt
        : article.publishedAt,
    }));
}

function normalizeEmployees(employees) {
  if (!Array.isArray(employees)) {
    throw makeError('validation', 'Employees data must be an array.');
  }

  return employees.filter((employee) =>
    employee
    && typeof employee.id === 'string'
    && typeof employee.name === 'string'
    && typeof employee.title === 'string'
    && typeof employee.department === 'string'
    && typeof employee.email === 'string'
    && typeof employee.phone === 'string'
    && typeof employee.office === 'string'
    && typeof employee.bio === 'string'
  );
}

function normalizeUsers(users) {
  if (!Array.isArray(users)) {
    throw makeError('validation', 'Users data must be an array.');
  }

  return users.filter((user) =>
    user
    && typeof user.id === 'string'
    && typeof user.name === 'string'
    && typeof user.role === 'string'
    && typeof user.email === 'string'
    && typeof user.department === 'string'
  );
}

function getLocalOnlyTickets(tickets) {
  return tickets.filter(ticket =>
    ticket.isLocalOnly === true || String(ticket.id).startsWith('local-')
  );
}

function withoutLocalOnly(ticket) {
  const { isLocalOnly, ...rest } = ticket;
  return rest;
}

function serializeTicket(ticket) {
  return {
    title: ticket.title,
    description: ticket.description,
    ticketStatus: ticket.ticketStatus,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    priority: ticket.priority,
    assignedAgentId: ticket.assignedAgentId,
    createdByUserId: ticket.createdByUserId,
    closedAt: ticket.closedAt,
    messages: ticket.messages,
  };
}

function serializeAnnouncement(announcement) {
  return {
    title: announcement.title,
    body: announcement.body,
    isPinned: announcement.isPinned,
    publishedAt: announcement.publishedAt,
    updatedAt: announcement.updatedAt,
  };
}

function serializeEvent(event) {
  return {
    title: event.title,
    eventType: event.eventType,
    startsAt: event.startsAt,
    location: event.location,
    description: event.description,
    organizer: event.organizer,
  };
}

function serializeNewsArticle(article) {
  return {
    title: article.title,
    category: article.category,
    summary: article.summary,
    body: article.body,
    isFeatured: article.isFeatured,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
  };
}

function sortTicketsByNewest(tickets) {
  return [...tickets].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

function withTimeout(promise, timeoutMs) {
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

function getGenericLoadMessage(error) {
  switch (getErrorCode(error)) {
    case 'timeout':
      return 'Loading took too long. Please try again.';
    case 'network':
      return 'Could not reach the server. Please check your connection and try again.';
    case 'http':
      return 'The server returned an error. Please try again.';
    case 'parse':
      return 'The data could not be read.';
    case 'validation':
      return 'The data was not in the expected format.';
    default:
      return 'Something went wrong while loading data.';
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
  const controller = new AbortController();
  const timerId = setTimeout(() => {
    controller.abort();
  }, LOAD_TIMEOUT_MS);

  try {
    const response = await fetch(DATA_URL, {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw makeError('http', `HTTP ${response.status}`);
    }

    return normalizeTickets(await response.json());
  } finally {
    clearTimeout(timerId);
  }
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timerId = setTimeout(() => {
    controller.abort();
  }, LOAD_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw makeError('http', `HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timerId);
  }
}

function getWeatherSummary(current) {
  if (!current) {
    return null;
  }

  const code = current.weather_code;
  let label = 'Windy conditions';
  if (code <= 2) {
    label = 'Clear to partly cloudy';
  } else if (code <= 49) {
    label = 'Cloudy';
  } else if (code <= 69) {
    label = 'Rain';
  }

  return {
    temperature: Math.round(current.temperature_2m),
    windSpeed: Math.round(current.wind_speed_10m),
    label,
  };
}

async function saveNewTicketToFirestore(ticket) {
  if (!navigator.onLine) {
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, 'tickets'), serializeTicket(ticket));

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
    const firestoreId = await saveNewTicketToFirestore(ticket);

    if (firestoreId) {
      if (nextSelectedId === ticket.id) {
        nextSelectedId = firestoreId;
      }

      syncedTickets.push({
        ...withoutLocalOnly(ticket),
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
    await addDoc(collection(db, 'tickets'), serializeTicket(ticket));
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
  let cachedTickets = [];
  try {
    cachedTickets = normalizeTickets(loadTicketsFromStorage());
  } catch (error) {
    cachedTickets = [];
  }
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
      return loadTicketsData({ selectedId });
    }

    const remoteTickets = normalizeTickets(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })));

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

export async function loadDashboardData() {
  try {
    const json = await fetchJson(CHICAGO_WEATHER_URL);
    return {
      weather: getWeatherSummary(json.current),
      weatherError: '',
    };
  } catch {
    return {
      weather: null,
      weatherError: 'Weather data is currently unavailable.',
    };
  }
}

export async function loadDirectoryData() {
  try {
    const items = normalizeEmployees(await fetchJson(EMPLOYEES_URL));
    return { items, error: '', staleNotice: '' };
  } catch (error) {
    return {
      items: [],
      error: getGenericLoadMessage(error),
      staleNotice: '',
    };
  }
}

export async function loadUsersData() {
  try {
    const items = normalizeUsers(await fetchJson(USERS_URL));
    return { items, error: '' };
  } catch (error) {
    return {
      items: [],
      error: getGenericLoadMessage(error),
    };
  }
}

async function fetchEventsJson() {
  return normalizeEvents(await fetchJson(EVENTS_URL));
}

async function seedEventsFromJson() {
  const events = await fetchEventsJson();

  for (const event of events) {
    await addDoc(collection(db, 'events'), serializeEvent(event));
  }
}

export async function loadEventsData() {
  try {
    const eventsQuery = query(
      collection(db, 'events'),
      orderBy('startsAt', 'asc')
    );

    const snapshot = await withTimeout(getDocs(eventsQuery), LOAD_TIMEOUT_MS);

    if (snapshot.empty) {
      await seedEventsFromJson();
      return loadEventsData();
    }

    const items = normalizeEvents(snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })));
    return { items, error: '', staleNotice: '' };
  } catch (firestoreError) {
    try {
      const items = await fetchEventsJson();
      return {
        items,
        error: '',
        staleNotice: 'Showing local event data while the live calendar could not be reached.',
      };
    } catch {
      return {
        items: [],
        error: getGenericLoadMessage(firestoreError),
        staleNotice: '',
      };
    }
  }
}

async function fetchAnnouncementsJson() {
  return normalizeAnnouncements(await fetchJson(ANNOUNCEMENTS_URL));
}

async function fetchNewsJson() {
  return normalizeNewsArticles(await fetchJson(NEWS_URL));
}

async function seedAnnouncementsFromJson() {
  const announcements = await fetchAnnouncementsJson();

  for (const announcement of announcements) {
    await addDoc(collection(db, 'announcements'), serializeAnnouncement(announcement));
  }
}

async function seedNewsFromJson() {
  const newsArticles = await fetchNewsJson();

  for (const article of newsArticles) {
    await addDoc(collection(db, 'news'), serializeNewsArticle(article));
  }
}

async function unfeatureOtherNewsArticles(selectedArticleId) {
  const snapshot = await getDocs(collection(db, 'news'));

  for (const articleDoc of snapshot.docs) {
    if (articleDoc.id === selectedArticleId) {
      continue;
    }

    if (articleDoc.data().isFeatured === true) {
      await updateDoc(doc(db, 'news', articleDoc.id), {
        isFeatured: false,
      });
    }
  }
}

export async function loadAnnouncementsData() {
  try {
    const announcementsQuery = query(
      collection(db, 'announcements'),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await withTimeout(getDocs(announcementsQuery), LOAD_TIMEOUT_MS);

    if (snapshot.empty) {
      await seedAnnouncementsFromJson();
      return loadAnnouncementsData();
    }

    const items = normalizeAnnouncements(snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })));
    return { items, error: '', staleNotice: '' };
  } catch (firestoreError) {
    try {
      const items = await fetchAnnouncementsJson();
      return {
        items,
        error: '',
        staleNotice: 'Showing local announcements while the server could not be reached.',
      };
    } catch {
      return {
        items: [],
        error: getGenericLoadMessage(firestoreError),
        staleNotice: '',
      };
    }
  }
}

export async function loadNewsData() {
  try {
    const newsQuery = query(
      collection(db, 'news'),
      orderBy('publishedAt', 'desc')
    );

    const snapshot = await withTimeout(getDocs(newsQuery), LOAD_TIMEOUT_MS);

    if (snapshot.empty) {
      await seedNewsFromJson();
      return loadNewsData();
    }

    const items = normalizeNewsArticles(snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      ...docSnapshot.data(),
    })));
    return { items, error: '', staleNotice: '' };
  } catch (firestoreError) {
    try {
      const items = await fetchNewsJson();
      return {
        items,
        error: '',
        staleNotice: 'Showing local news articles while the server could not be reached.',
      };
    } catch {
      return {
        items: [],
        error: getGenericLoadMessage(firestoreError),
        staleNotice: '',
      };
    }
  }
}

export async function saveAnnouncement(announcement) {
  const normalizedAnnouncement = normalizeAnnouncements([announcement])[0];

  if (!navigator.onLine) {
    return normalizedAnnouncement;
  }

  if (!normalizedAnnouncement.id || normalizedAnnouncement.id.startsWith('ann-')) {
    const docRef = await addDoc(collection(db, 'announcements'), serializeAnnouncement(normalizedAnnouncement));

    return {
      ...normalizedAnnouncement,
      id: docRef.id,
    };
  }

  await updateDoc(doc(db, 'announcements', normalizedAnnouncement.id), serializeAnnouncement(normalizedAnnouncement));

  return normalizedAnnouncement;
}

export async function removeAnnouncement(announcementId) {
  if (!navigator.onLine) {
    return;
  }

  await deleteDoc(doc(db, 'announcements', announcementId));
}

export async function saveNewsArticle(article) {
  const normalizedArticle = normalizeNewsArticles([article])[0];

  if (!navigator.onLine) {
    return normalizedArticle;
  }

  if (!normalizedArticle.id || normalizedArticle.id.startsWith('news-')) {
    const docRef = await addDoc(collection(db, 'news'), serializeNewsArticle(normalizedArticle));

    if (normalizedArticle.isFeatured) {
      await unfeatureOtherNewsArticles(docRef.id);
    }

    return {
      ...normalizedArticle,
      id: docRef.id,
    };
  }

  await updateDoc(doc(db, 'news', normalizedArticle.id), serializeNewsArticle(normalizedArticle));

  if (normalizedArticle.isFeatured) {
    await unfeatureOtherNewsArticles(normalizedArticle.id);
  }

  return normalizedArticle;
}

export async function removeNewsArticle(articleId) {
  if (!navigator.onLine) {
    return;
  }

  await deleteDoc(doc(db, 'news', articleId));
}

export async function saveEvent(event) {
  const normalizedEvent = normalizeEvents([event])[0];

  if (!navigator.onLine) {
    return normalizedEvent;
  }

  if (!normalizedEvent.id || normalizedEvent.id.startsWith('evt-')) {
    const docRef = await addDoc(collection(db, 'events'), serializeEvent(normalizedEvent));
    return {
      ...normalizedEvent,
      id: docRef.id,
    };
  }

  await updateDoc(doc(db, 'events', normalizedEvent.id), serializeEvent(normalizedEvent));
  return normalizedEvent;
}

export async function removeEvent(eventId) {
  if (!navigator.onLine) {
    return;
  }

  await deleteDoc(doc(db, 'events', eventId));
}

export async function createTicket(newTicket) {
  const normalizedTicket = normalizeTicket(newTicket);
  const firestoreId = await saveNewTicketToFirestore(normalizedTicket);

  if (firestoreId) {
    return {
      ticket: {
        ...normalizedTicket,
        id: firestoreId,
      },
      savedLocallyOnly: false,
    };
  }

  return {
    ticket: {
      ...normalizedTicket,
      id: createLocalTicketId(),
      isLocalOnly: true,
    },
    savedLocallyOnly: true,
  };
}

export async function saveTicketChanges(ticket) {
  const normalizedTicket = normalizeTicket(ticket);

  if (!navigator.onLine) {
    if (normalizedTicket.isLocalOnly === true || String(normalizedTicket.id).startsWith('local-')) {
      return {
        ticket: {
          ...normalizedTicket,
          isLocalOnly: true,
        },
        savedLocallyOnly: true,
      };
    }

    return {
      ticket: normalizedTicket,
      savedLocallyOnly: true,
    };
  }

  if (normalizedTicket.isLocalOnly === true || String(normalizedTicket.id).startsWith('local-')) {
    const firestoreId = await saveNewTicketToFirestore(normalizedTicket);

    if (firestoreId) {
      return {
        ticket: {
          ...withoutLocalOnly(normalizedTicket),
          id: firestoreId,
        },
        savedLocallyOnly: false,
      };
    }

    return {
      ticket: {
        ...normalizedTicket,
        isLocalOnly: true,
      },
      savedLocallyOnly: true,
    };
  }

  try {
    await updateDoc(doc(db, 'tickets', normalizedTicket.id), serializeTicket(normalizedTicket));

    return {
      ticket: withoutLocalOnly(normalizedTicket),
      savedLocallyOnly: false,
    };
  } catch (error) {
    if (normalizedTicket.isLocalOnly === true || String(normalizedTicket.id).startsWith('local-')) {
      return {
        ticket: {
          ...normalizedTicket,
          isLocalOnly: true,
        },
        savedLocallyOnly: true,
      };
    }

    return {
      ticket: normalizedTicket,
      savedLocallyOnly: true,
    };
  }
}

export function persistTickets(tickets) {
  saveTicketsToStorage(tickets);
}
