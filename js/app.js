


/* =================
   1. LOADING CHECK
==================== */
console.log('app.js loaded');


/* ===========
   2. STATE 
============== */
const state = {
  tickets:           [],     // array of ticket objects loaded from storage/JSON
  selectedTicketId:  null,   // string id of the selected ticket, or null
  ticketQuery:       '',     // current search input value
  showNewTicketForm: false,  // is the create ticket form visible?
  sidebarCollapsed:  false,  // is the sidebar collapsed to icons only?
  loadError:         false,  // did tickets fail to load?
};


/* ==================
   3. DOM REFERENCES
===================== */
const appShell            = document.querySelector('.app-shell');
const sidebarToggle       = document.querySelector('#sidebar-toggle');
const sidebarBackdrop     = document.querySelector('#sidebar-backdrop');
const ticketList          = document.querySelector('#ticket-list');
const ticketDetail        = document.querySelector('#ticket-detail');
const emptyState          = document.querySelector('#empty-state');
const loadErrorBanner     = document.querySelector('#load-error-banner');
const loadErrorMessage    = document.querySelector('#load-error-message');
const dismissLoadErrorBtn = document.querySelector('#dismiss-load-error-btn');
const ticketSearchInput   = document.querySelector('#ticket-search');
const newTicketBtn        = document.querySelector('#new-ticket-btn');
const newTicketFormSection= document.querySelector('#new-ticket-form-section');
const newTicketForm       = document.querySelector('#new-ticket-form');
const cancelTicketBtn     = document.querySelector('#cancel-ticket-btn');
const titleInput          = document.querySelector('#ticket-title');
const descriptionInput    = document.querySelector('#ticket-description');
const titleError          = document.querySelector('#ticket-title-error');
const descriptionError    = document.querySelector('#ticket-description-error');
const formStatus          = document.querySelector('#form-status');
const formError           = document.querySelector('#form-error');

// Guard, if any critical element is missing, stop and show why
if (!appShell || !sidebarToggle || !sidebarBackdrop) {
  throw new Error('app.js: Missing critical layout elements — check HTML');
}
if (!ticketList || !ticketDetail || !ticketSearchInput) {
  throw new Error('app.js: Missing critical content elements — check HTML');
}


/* ==================
   4. SIDEBAR TOGGLE
=====================*/
sidebarToggle.addEventListener('click', () => {
  const isMobile = window.innerWidth < 600;

  if (isMobile) {
    // Mobile: toggle overlay
    const isOpen = appShell.classList.toggle('sidebar-open');
    sidebarToggle.setAttribute('aria-expanded', String(isOpen));
  } else {
    // Tablet/Desktop: toggle collapsed
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


/* =================
   5. LOAD TICKETS
==================== */
const STORAGE_KEY = 'portal-tickets-v1';

async function loadTickets() {
  // Step 1: try localStorage first
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Sanity check (Week 6) — make sure it's actually an array
      if (Array.isArray(parsed) && parsed.length > 0) {
        state.tickets = parsed;
        return; // loaded successfully, stop here
      }
    }
  } catch (err) {
    // localStorage read failed — log it and fall through to JSON
    console.warn('localStorage read failed:', err);
  }

  // Step 2: localStorage was empty or failed — fetch tickets.json
  try {
    const res = await fetch('./data/tickets.json');

    // Week 6: fetch() does NOT throw on 404/500 — we must check res.ok
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();

    // Sanity check (Week 6) — confirm the shape is what we expect
    if (!Array.isArray(data)) {
      throw new Error('tickets.json is not an array');
    }

    state.tickets = data;

    // Save to localStorage so next load is instant
    saveTickets();

  } catch (err) {
    // Both sources failed — show error banner
    console.error('Failed to load tickets:', err);
    state.loadError = true;
  }
}

// Save current tickets to localStorage after every change
function saveTickets() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tickets));
  } catch (err) {
    console.warn('localStorage write failed:', err);
  }
}


/* =======================
   6. RENDER TICKET LIST
========================== */
function renderTicketList() {
  // Filter tickets by search query (case-insensitive)
  const query = state.ticketQuery.toLowerCase().trim();
  const visible = state.tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(query) ||
    ticket.description.toLowerCase().includes(query)
  );

  // Clear the list before re-rendering
  ticketList.textContent = '';

  // Show empty state if no results
  emptyState.hidden = visible.length > 0;

  // Build each ticket row
  visible.forEach(ticket => {
    // <li>
    const li = document.createElement('li');

    // <button class="ticket-item"> — keyboard accessible and clickable
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ticket-item';
    btn.dataset.id = ticket.id; // Week 5: dataset pattern

    // Highlight selected ticket
    if (ticket.id === state.selectedTicketId) {
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.setAttribute('aria-pressed', 'false');
    }

    // Ticket title
    const title = document.createElement('p');
    title.className = 'ticket-item-title';
    title.textContent = ticket.title; // textContent instead of innerHTML

    // Ticket meta: status badge + date
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


/* ========================
   7. RENDER TICKET DETAIL
=========================== */
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

  // If ticket no longer exists (e.g. was filtered out), clear selection
  if (!ticket) {
    state.selectedTicketId = null;
    renderTicketDetail();
    return;
  }

  // Build the detail content
  ticketDetail.innerHTML = ''; // clear previous content

  const content = document.createElement('div');
  content.className = 'ticket-detail-content';

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

  content.append(header, desc);
  ticketDetail.append(content);
}


/* ==========================
   8. MAIN RENDER FUNCTION
=============================*/
function render() {
  // Show/hide load error banner
  loadErrorBanner.hidden = !state.loadError;
  if (state.loadError) {
    loadErrorMessage.textContent =
      'Could not load tickets. Showing default data if available.';
  }

  // Show/hide create ticket form
  newTicketFormSection.hidden = !state.showNewTicketForm;

  // Render the ticket list and detail panel
  renderTicketList();
  renderTicketDetail();
}


/* ===================
   HELPER FUNCTIONS
====================== */

// Maps ticketStatus string to a CSS class name
function getStatusClass(status) {
  switch (status) {
    case 'Open':        return 'status-badge--open';
    case 'In Progress': return 'status-badge--in-progress';
    case 'Closed':      return 'status-badge--closed';
    default:            return '';
  }
}

// Formats an ISO date string into a readable date
// e.g. "2026-03-01T09:15:00Z" → "Mar 1, 2026"
function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '(invalid date)';
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day:   'numeric',
    year:  'numeric',
  });
}


/* =====================
   9. INITIALISE APP
======================== */
async function init() {
  await loadTickets(); // wait for tickets before rendering
  render();            // paint the initial UI from state
}

init();