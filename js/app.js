import { db, collection, getDocs, addDoc, orderBy, query } from './firebase.js';

console.log('app.js loaded');


const state = {
  tickets: [],    // array of ticket objects loaded from storage/JSON
  selectedTicketId: null,  // string id of the selected ticket, or null
  ticketQuery: '',    // current search input value
  showNewTicketForm: false, // is the create ticket form visible?
  sidebarCollapsed: false, // is the sidebar collapsed to icons only?
  loadError: false, // did tickets fail to load?
};



const appShell = document.querySelector('.app-shell');
const sidebarToggle = document.querySelector('#sidebar-toggle');
const sidebarBackdrop = document.querySelector('#sidebar-backdrop');
const ticketList = document.querySelector('#ticket-list');
const ticketDetail = document.querySelector('#ticket-detail');
const shell = document.querySelector('.shell');
const emptyState = document.querySelector('#empty-state');
const loadErrorBanner = document.querySelector('#load-error-banner');
const loadErrorMessage = document.querySelector('#load-error-message');
const dismissLoadErrorBtn = document.querySelector('#dismiss-load-error-btn');
const ticketSearchInput = document.querySelector('#ticket-search');
const newTicketBtn = document.querySelector('#new-ticket-btn');
const newTicketFormSection = document.querySelector('#new-ticket-form-section');
const newTicketForm = document.querySelector('#new-ticket-form');
const cancelTicketBtn = document.querySelector('#cancel-ticket-btn');
const titleInput = document.querySelector('#ticket-title');
const descriptionInput = document.querySelector('#ticket-description');
const titleError = document.querySelector('#ticket-title-error');
const descriptionError = document.querySelector('#ticket-description-error');
const formStatus = document.querySelector('#form-status');
const formError = document.querySelector('#form-error');

// Guard — if any critical element is missing, stop and say why
if (!appShell || !sidebarToggle || !sidebarBackdrop) {
  throw new Error('app.js: Missing critical layout elements — check HTML');
}
if (!ticketList || !ticketDetail || !shell || !ticketSearchInput) {
  throw new Error('app.js: Missing critical content elements — check HTML');
}


sidebarToggle.addEventListener('click', () => {
  const isMobile = window.innerWidth < 600;

  if (isMobile) {
    // Mobile: slide sidebar in as overlay
    const isOpen = appShell.classList.toggle('sidebar-open');
    sidebarToggle.setAttribute('aria-expanded', String(isOpen));
  } else {
    // Tablet/Desktop: collapse sidebar to icons only
    state.sidebarCollapsed = !state.sidebarCollapsed;
    appShell.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
    sidebarToggle.setAttribute('aria-expanded', String(!state.sidebarCollapsed));
  }
});

// Clicking the backdrop closes the mobile sidebar
sidebarBackdrop.addEventListener('click', () => {
  appShell.classList.remove('sidebar-open');
  sidebarToggle.setAttribute('aria-expanded', 'false');
});


const STORAGE_KEY = 'portal-tickets-v1';

async function loadTickets() {
  // Always try localStorage first — instant, works offline
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.tickets = parsed;
        render(); // paint immediately from cache
      }
    }
  } catch (localErr) {
    console.warn('localStorage read failed:', localErr);
  }

  // Then try Firestore in the background to get fresh data
  try {
    const q = query(
      collection(db, 'tickets'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const localOnlyTickets = getLocalOnlyTickets();

    if (snapshot.empty) {
      const seeded = await seedFromJson();
      if (seeded) {
        return;
      }

      const syncedLocalTickets = localOnlyTickets.length > 0
        ? await syncLocalOnlyTickets(localOnlyTickets)
        : [];

      const cachedNonLocalTickets = state.tickets.filter(ticket =>
        ticket.isLocalOnly !== true && !String(ticket.id).startsWith('local-')
      );

      state.tickets = sortTicketsByNewest([
        ...cachedNonLocalTickets,
        ...syncedLocalTickets,
      ]);

      if (state.tickets.length === 0) {
        state.loadError = true;
      } else {
        state.loadError = false;
        saveToLocalStorage();
      }

      return;
    }



    const remoteTickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const syncedLocalTickets = localOnlyTickets.length > 0
      ? await syncLocalOnlyTickets(localOnlyTickets)
      : [];

    state.tickets = sortTicketsByNewest([
      ...remoteTickets,
      ...syncedLocalTickets,
    ]);

    state.loadError = false;
    saveToLocalStorage();

  } catch (err) {
    console.error('Firestore load failed:', err);

    if (state.tickets.length > 0) {
      return;
    }

    try {
      await loadTicketsFromJson();
    } catch (jsonErr) {
      console.error('JSON fallback load failed:', jsonErr);
      state.loadError = true;
    }
  }


}

// Saves a new ticket to Firestore
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
    return docRef.id; // return the Firestore-generated id
  } catch (err) {
    console.error('Firestore write failed:', err);
    return null;
  }
}

function createLocalTicketId() {
  return `local-${Date.now()}`;
}

function getLocalOnlyTickets(tickets = state.tickets) {
  return tickets.filter(ticket =>
    ticket.isLocalOnly === true || String(ticket.id).startsWith('local-')
  );
}

function sortTicketsByNewest(tickets) {
  return [...tickets].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

async function syncLocalOnlyTickets(localOnlyTickets) {
  const syncedTickets = [];

  for (const ticket of localOnlyTickets) {
    const firestoreId = await saveTicketToFirestore(ticket);

    if (firestoreId) {
      const { isLocalOnly, ...syncedTicket } = ticket;

      if (state.selectedTicketId === ticket.id) {
        state.selectedTicketId = firestoreId;
      }

      syncedTickets.push({
        ...syncedTicket,
        id: firestoreId,
      });
    } else {
      syncedTickets.push(ticket);
    }
  }

  return syncedTickets;
}


// Saves current tickets array to localStorage as a cache
function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tickets));
  } catch (err) {
    console.warn('localStorage write failed:', err);
  }
}


async function loadTicketsFromJson() {
  const res = await fetch('./data/tickets.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Not an array');

  state.tickets = data;
  state.loadError = false;
  saveToLocalStorage();
}

// Seeds Firestore from tickets.json on first load
async function seedFromJson() {
  try {
    const res = await fetch('./data/tickets.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Not an array');

    for (const ticket of data) {
      await addDoc(collection(db, 'tickets'), {
        title: ticket.title,
        description: ticket.description,
        ticketStatus: ticket.ticketStatus,
        createdAt: ticket.createdAt,
      });
    }

    await loadTickets();
    return true;
  } catch (err) {
    console.error('Seeding failed:', err);
    state.loadError = true;
    return false;
  }
}


function renderTicketList() {
  // Filter tickets by search query (case-insensitive)
  const searchQuery = state.ticketQuery.toLowerCase().trim();
  const visible = state.tickets.filter(ticket => {
    const title = String(ticket.title ?? '').toLowerCase();
    const description = String(ticket.description ?? '').toLowerCase();

    return title.includes(searchQuery) || description.includes(searchQuery);
  });

  // Clear the list before re-rendering
  ticketList.textContent = '';

  // Show empty state if no results
  emptyState.hidden = visible.length > 0;

  // Build each ticket row
  visible.forEach(ticket => {
    const li = document.createElement('li');

    // <button> makes each row keyboard accessible and clickable
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ticket-item';
    btn.dataset.id = ticket.id; // used by event delegation in Commit 2

    // Highlight the selected ticket
    if (ticket.id === state.selectedTicketId) {
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.setAttribute('aria-pressed', 'false');
    }

    // Title
    const title = document.createElement('p');
    title.className = 'ticket-item-title';
    title.textContent = ticket.title; // textContent not innerHTML — safer

    // Meta row: status badge + date
    const meta = document.createElement('div');
    meta.className = 'ticket-item-meta';

    const badge = document.createElement('span');
    badge.className = `status-badge ${getStatusClass(ticket.ticketStatus)}`;
    badge.textContent = ticket.ticketStatus;

    const date = document.createElement('span');
    date.textContent = formatDate(ticket.createdAt);

    meta.append(badge, date);
    btn.append(title, meta);
    li.append(btn);
    ticketList.append(li);
  });
}


function renderTicketDetail() {
  // No ticket selected — show placeholder
  if (!state.selectedTicketId) {
    ticketDetail.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Select a ticket to view details.';
    ticketDetail.append(placeholder);
    return;
  }

  // Find the selected ticket in state
  const ticket = state.tickets.find(t => t.id === state.selectedTicketId);

  // Ticket not found — clear selection and show placeholder
  if (!ticket) {
    state.selectedTicketId = null;
    renderTicketDetail();
    return;
  }

  // Clear previous content
  ticketDetail.innerHTML = '';

  const content = document.createElement('div');
  content.className = 'ticket-detail-content';

  // Back button — useful on mobile where panels stack vertically
  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.id = 'back-btn';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', () => {
    state.selectedTicketId = null;
    render();
  });

  // Header: title + meta
  const header = document.createElement('div');
  header.className = 'ticket-detail-header';

  const titleEl = document.createElement('h3');
  titleEl.className = 'ticket-detail-title';
  titleEl.textContent = ticket.title;

  const meta = document.createElement('div');
  meta.className = 'ticket-detail-meta';

  const badge = document.createElement('span');
  badge.className = `status-badge ${getStatusClass(ticket.ticketStatus)}`;
  badge.textContent = ticket.ticketStatus;

  const date = document.createElement('span');
  date.textContent = formatDate(ticket.createdAt);

  meta.append(badge, date);
  header.append(titleEl, meta);

  // Description
  const desc = document.createElement('p');
  desc.className = 'ticket-detail-description';
  desc.textContent = ticket.description;

  content.append(backBtn, header, desc);
  ticketDetail.append(content);
}


function render() {
  // Show/hide load error banner
  loadErrorBanner.hidden = !state.loadError;
  if (state.loadError) {
    loadErrorMessage.textContent =
      'Could not load tickets. Showing default data if available.';
  }

  // Show/hide create ticket form
  newTicketFormSection.hidden = !state.showNewTicketForm;

  shell.classList.toggle('detail-view-active', Boolean(state.selectedTicketId));

  // Re-render list and detail
  renderTicketList();
  renderTicketDetail();
}



// Maps ticketStatus to a CSS class name
function getStatusClass(status) {
  switch (status) {
    case 'Open': return 'status-badge--open';
    case 'In Progress': return 'status-badge--in-progress';
    case 'Closed': return 'status-badge--closed';
    default: return '';
  }
}

// Formats ISO date string to readable date
// "2026-03-01T09:15:00Z" → "Mar 1, 2026"
function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '(invalid date)';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}


// Ticket selection — event delegation on the list (Week 5)
// One listener on the parent survives re-renders
ticketList.addEventListener('click', (event) => {
  // closest() finds the .ticket-item button even if user
  // clicked on the title text or badge inside it
  const btn = event.target.closest('.ticket-item');
  if (!btn) return;

  const clickedId = btn.dataset.id;

  // Clicking the already-selected ticket deselects it
  if (state.selectedTicketId === clickedId) {
    state.selectedTicketId = null;
  } else {
    state.selectedTicketId = clickedId;
  }

  render();
});

// Dismiss load error banner
dismissLoadErrorBtn.addEventListener('click', () => {
  state.loadError = false;
  render();
});


async function init() {
  await loadTickets(); // wait for tickets before first render
  render();            // paint the initial UI from state
}


ticketSearchInput.addEventListener('input', () => {
  state.ticketQuery = ticketSearchInput.value;
  render();
});


newTicketBtn.addEventListener('click', () => {
  state.showNewTicketForm = true;
  render();
  // Move focus into the form for accessibility (Week 2)
  titleInput.focus();
});

cancelTicketBtn.addEventListener('click', () => {
  state.showNewTicketForm = false;
  clearForm();
  render();
});

newTicketForm.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop browser default submit

  // Clear previous feedback
  clearFormFeedback();

  // Validate — both fields are required
  let isValid = true;

  if (titleInput.value.trim() === '') {
    titleError.textContent = 'Title is required.';
    titleInput.classList.add('invalid');
    titleInput.setAttribute('aria-invalid', 'true');
    isValid = false;
  }

  if (descriptionInput.value.trim() === '') {
    descriptionError.textContent = 'Description is required.';
    descriptionInput.classList.add('invalid');
    descriptionInput.setAttribute('aria-invalid', 'true');
    isValid = false;
  }

  if (!isValid) return; // stop here if validation failed

  // Build new ticket object
  const newTicket = {
    id: '',
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    ticketStatus: 'Open',
    createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
  };

  // Save to Firestore and get the real id back
  const firestoreId = await saveTicketToFirestore(newTicket);

  if (firestoreId) {
    newTicket.id = firestoreId;
    formStatus.textContent = 'Ticket submitted successfully.';
  } else {
    newTicket.id = createLocalTicketId();
    newTicket.isLocalOnly = true;
    formStatus.textContent = 'Ticket saved locally. Firebase is unavailable.';
  }

  state.tickets.unshift(newTicket);
  state.selectedTicketId = newTicket.id;
  saveToLocalStorage();

  setTimeout(() => {
    state.showNewTicketForm = false;
    clearForm();
    render();
  }, 1500);
});

// Clears all form inputs and feedback
function clearForm() {
  newTicketForm.reset();
  clearFormFeedback();
}

// Clears only the feedback messages and invalid states
function clearFormFeedback() {
  titleError.textContent = '';
  descriptionError.textContent = '';
  formStatus.textContent = '';
  formError.textContent = '';

  titleInput.classList.remove('invalid');
  descriptionInput.classList.remove('invalid');
  titleInput.setAttribute('aria-invalid', 'false');
  descriptionInput.setAttribute('aria-invalid', 'false');
}

init();