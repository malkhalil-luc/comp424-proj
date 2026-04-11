import {
  emptyState,
  ticketDetail,
  ticketList,
} from '../dom.js';
import {
  getSelectedTicket,
  getVisibleTickets,
} from '../selectors/tickets-selectors.js';

function getStatusClass(status) {
  switch (status) {
    case 'Open':
      return 'status-badge--open';
    case 'In Progress':
      return 'status-badge--in-progress';
    case 'Closed':
      return 'status-badge--closed';
    default:
      return '';
  }
}

function formatDate(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '(invalid date)';

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function renderTicketList(state) {
  const visible = getVisibleTickets(state);

  ticketList.textContent = '';
  emptyState.hidden = visible.length > 0;

  visible.forEach(ticket => {
    const li = document.createElement('li');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ticket-item';
    btn.dataset.id = ticket.id;

    if (ticket.id === state.selectedTicketId) {
      btn.classList.add('is-selected');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.setAttribute('aria-pressed', 'false');
    }

    const title = document.createElement('p');
    title.className = 'ticket-item-title';
    title.textContent = ticket.title;

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

export function renderTicketDetail(state, onBack) {
  const ticket = getSelectedTicket(state);

  if (!ticket) {
    ticketDetail.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Select a ticket to view details.';
    ticketDetail.append(placeholder);
    return;
  }

  ticketDetail.innerHTML = '';

  const content = document.createElement('div');
  content.className = 'ticket-detail-content';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.id = 'back-btn';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', onBack);

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

  const desc = document.createElement('p');
  desc.className = 'ticket-detail-description';
  desc.textContent = ticket.description;

  content.append(backBtn, header, desc);
  ticketDetail.append(content);
}
