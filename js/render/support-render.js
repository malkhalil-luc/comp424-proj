import { dom } from '../dom.js';
import {
  canManageTicket,
  canReplyToTicket,
  canReopenTicket,
  getAdminUsers,
  getAssignedAgent,
  getSelectedTicket,
  getUserById,
  getVisibleTickets,
} from '../state.js';

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

function formatDateTime(isoString) {
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '(invalid date)';

  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getPriorityClass(priority) {
  switch (priority) {
    case 'high':
      return 'priority-badge--high';
    case 'medium':
      return 'priority-badge--medium';
    case 'low':
      return 'priority-badge--low';
    default:
      return '';
  }
}

function formatPriority(priority) {
  return `${priority.charAt(0).toUpperCase()}${priority.slice(1)} Priority`;
}

export function renderTicketList(state) {
  const visible = getVisibleTickets();

  if (visible.length === 0) {
    state.selectedId = null;
  } else if (!visible.some((ticket) => ticket.id === state.selectedId)) {
    state.selectedId = null;
  }

  dom.ticketList.textContent = '';
  dom.emptyState.hidden = visible.length > 0;
  dom.emptyState.textContent = state.query.trim() === ''
    ? 'No tickets available.'
    : 'No results found.';

  visible.forEach(ticket => {

    const li = document.createElement('li');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ticket-item';
    btn.dataset.id = ticket.id;

    if (ticket.id === state.selectedId) {
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

    const priority = document.createElement('span');
    priority.className = `priority-badge ${getPriorityClass(ticket.priority)}`;
    priority.textContent = formatPriority(ticket.priority);

    const badge = document.createElement('span');
    badge.className = `status-badge ${getStatusClass(ticket.ticketStatus)}`;
    badge.textContent = ticket.ticketStatus;

    const agent = getAssignedAgent(ticket);
    const agentText = document.createElement('span');
    agentText.textContent = agent ? `Assigned to ${agent.name}` : 'Unassigned';

    const date = document.createElement('span');
    date.textContent = formatDate(ticket.createdAt);

    meta.append(priority, badge, agentText, date);
    btn.append(title, meta);
    li.append(btn);
    dom.ticketList.append(li);
  });
}

function createMetaRow(labelText, valueText) {
  const row = document.createElement('div');
  row.className = 'ticket-meta-row';

  const label = document.createElement('span');
  label.className = 'ticket-meta-label';
  label.textContent = labelText;

  const value = document.createElement('span');
  value.className = 'ticket-meta-value';
  value.textContent = valueText;

  row.append(label, value);
  return row;
}

function renderMessages(ticket) {
  const thread = document.createElement('div');
  thread.className = 'ticket-thread';

  const heading = document.createElement('h4');
  heading.className = 'ticket-section-title';
  heading.textContent = 'Conversation';

  const list = document.createElement('div');
  list.className = 'message-list';

  ticket.messages.forEach((message) => {
    const item = document.createElement('article');
    item.className = `message-item message-item--${message.authorRole}`;
    item.classList.add(`message-item--${message.kind}`);
    if (message.kind === 'status-note') {
      item.classList.add('message-item--note');
    }

    const author = getUserById(message.authorId);

    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const name = document.createElement('span');
    name.className = 'message-author';
    name.textContent = author?.name ?? (message.authorRole === 'admin' ? 'Support Team' : 'Employee');

    const timestamp = document.createElement('span');
    timestamp.className = 'message-time';
    timestamp.textContent = formatDateTime(message.createdAt);

    meta.append(name, timestamp);

    const body = document.createElement('p');
    body.className = 'message-body';
    body.textContent = message.body;

    item.append(meta, body);
    list.append(item);
  });

  thread.append(heading, list);
  return thread;
}

function renderAdminPanel(ticket) {
  if (!canManageTicket(ticket)) {
    return null;
  }

  const section = document.createElement('section');
  section.className = 'ticket-admin-panel';

  const heading = document.createElement('h4');
  heading.className = 'ticket-section-title';
  heading.textContent = 'Admin Controls';

  const form = document.createElement('form');
  form.id = 'ticket-admin-form';
  form.className = 'ticket-admin-form';

  const statusField = document.createElement('label');
  statusField.className = 'field';
  statusField.innerHTML = `
    <span>Status</span>
    <select name="ticketStatus">
      <option value="Open">Open</option>
      <option value="In Progress">In Progress</option>
      <option value="Closed">Closed</option>
    </select>
  `;
  statusField.querySelector('select').value = ticket.ticketStatus;

  const agentField = document.createElement('label');
  agentField.className = 'field';
  agentField.innerHTML = `
    <span>Assigned Agent</span>
    <select name="assignedAgentId">
      <option value="">Unassigned</option>
    </select>
  `;
  const agentSelect = agentField.querySelector('select');
  getAdminUsers().forEach((agent) => {
    const option = document.createElement('option');
    option.value = agent.id;
    option.textContent = agent.name;
    agentSelect.append(option);
  });
  agentSelect.value = ticket.assignedAgentId ?? '';

  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'ticket-action-btn ticket-action-btn--primary';
  submit.textContent = 'Save Ticket Updates';

  form.append(statusField, agentField, submit);
  section.append(heading, form);
  return section;
}

function renderReplySection(ticket, currentUser) {
  const section = document.createElement('section');
  section.className = 'ticket-reply-panel';

  const heading = document.createElement('h4');
  heading.className = 'ticket-section-title';
  heading.textContent = 'Reply';

  section.append(heading);

  if (canReplyToTicket(ticket)) {
    const form = document.createElement('form');
    form.id = 'ticket-reply-form';
    form.className = 'ticket-reply-form';

    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = `
      <span>Add a reply</span>
      <textarea name="replyBody" placeholder="Write your reply here..." required></textarea>
    `;

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.className = 'ticket-action-btn ticket-action-btn--primary';
    submit.textContent = currentUser?.role === 'admin' ? 'Reply as Support' : 'Send Reply';

    form.append(label, submit);
    section.append(form);
    return section;
  }

  const note = document.createElement('p');
  note.className = 'ticket-note';
  note.textContent = 'This ticket is closed. Reopen it to send a new reply.';
  section.append(note);

  if (canReopenTicket(ticket)) {
    const reopenBtn = document.createElement('button');
    reopenBtn.type = 'button';
    reopenBtn.id = 'reopen-ticket-btn';
    reopenBtn.className = 'ticket-action-btn';
    reopenBtn.textContent = currentUser?.role === 'admin'
      ? 'Reopen Ticket'
      : 'Reopen and Reply';
    section.append(reopenBtn);
  }

  return section;
}

export function renderTicketDetail(state, onBack, currentUser) {
  const ticket = getSelectedTicket();

  if (!ticket) {
    dom.ticketDetail.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Select a ticket to view details.';
    dom.ticketDetail.append(placeholder);
    return;
  }

  dom.ticketDetail.innerHTML = '';

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

  const priority = document.createElement('span');
  priority.className = `priority-badge ${getPriorityClass(ticket.priority)}`;
  priority.textContent = formatPriority(ticket.priority);

  const badge = document.createElement('span');
  badge.className = `status-badge ${getStatusClass(ticket.ticketStatus)}`;
  badge.textContent = ticket.ticketStatus;

  const date = document.createElement('span');
  date.textContent = formatDate(ticket.createdAt);

  meta.append(priority, badge, date);
  header.append(titleEl, meta);

  const desc = document.createElement('p');
  desc.className = 'ticket-detail-description';
  desc.textContent = ticket.description;

  const details = document.createElement('div');
  details.className = 'ticket-meta-grid';
  details.append(
    createMetaRow('Submitted', formatDateTime(ticket.createdAt)),
    createMetaRow('Last Updated', formatDateTime(ticket.updatedAt)),
    createMetaRow('Priority', formatPriority(ticket.priority)),
    createMetaRow('Assigned Agent', getAssignedAgent(ticket)?.name ?? 'Unassigned'),
    createMetaRow('Requested By', getUserById(ticket.createdByUserId)?.name ?? 'Employee'),
  );

  if (ticket.closedAt) {
    details.append(createMetaRow('Closed At', formatDateTime(ticket.closedAt)));
  }

  const adminPanel = renderAdminPanel(ticket);
  const replyPanel = renderReplySection(ticket, currentUser);

  content.append(backBtn, header, desc, details, renderMessages(ticket));
  if (adminPanel) {
    content.append(adminPanel);
  }
  content.append(replyPanel);
  dom.ticketDetail.append(content);
}
