import { dom } from '../dom.js';
import {
  getCurrentUser,
  getSelectedEvent,
  getVisibleCalendarEvents,
} from '../state.js';

function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '(invalid date)';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function renderCalendarList(state) {
  const visibleEvents = getVisibleCalendarEvents();

  if (visibleEvents.length === 0) {
    state.selectedEventId = null;
  } else if (
    state.selectedEventId
    && !visibleEvents.some((event) => event.id === state.selectedEventId)
  ) {
    state.selectedEventId = visibleEvents[0].id;
  }

  dom.calendarList.textContent = '';
  dom.calendarEmptyState.hidden = visibleEvents.length > 0;
  dom.calendarEmptyState.textContent = state.calendarQuery.trim() === ''
    ? 'No events available.'
    : 'No events match your search.';

  visibleEvents.forEach((event) => {
    const item = document.createElement('li');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calendar-item';
    button.dataset.id = event.id;

    if (event.id === state.selectedEventId) {
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.setAttribute('aria-pressed', 'false');
    }

    const title = document.createElement('p');
    title.className = 'calendar-item-title';
    title.textContent = event.title;

    const meta = document.createElement('div');
    meta.className = 'calendar-item-meta';

    const type = document.createElement('span');
    type.className = 'calendar-type-badge';
    type.textContent = event.eventType;

    const time = document.createElement('span');
    time.textContent = formatDateTime(event.startsAt);

    meta.append(type, time);
    button.append(title, meta);
    item.append(button);
    dom.calendarList.append(item);
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

export function renderCalendarDetail(onBack) {
  const event = getSelectedEvent();
  const currentUser = getCurrentUser();
  dom.calendarDetail.innerHTML = '';

  if (!event) {
    const placeholder = document.createElement('p');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Select an event to view details.';
    dom.calendarDetail.append(placeholder);
    return;
  }

  const content = document.createElement('div');
  content.className = 'ticket-detail-content';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.id = 'calendar-back-btn';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', onBack);

  const header = document.createElement('div');
  header.className = 'ticket-detail-header';

  const title = document.createElement('h3');
  title.className = 'ticket-detail-title';
  title.textContent = event.title;

  const meta = document.createElement('div');
  meta.className = 'ticket-detail-meta';

  const type = document.createElement('span');
  type.className = 'calendar-type-badge';
  type.textContent = event.eventType;

  const time = document.createElement('span');
  time.textContent = formatDateTime(event.startsAt);

  meta.append(type, time);
  header.append(title, meta);

  const details = document.createElement('div');
  details.className = 'ticket-meta-grid';
  details.append(
    createMetaRow('Starts', formatDateTime(event.startsAt)),
    createMetaRow('Location', event.location),
    createMetaRow('Organizer', event.organizer),
    createMetaRow('Type', event.eventType),
  );

  const description = document.createElement('p');
  description.className = 'ticket-detail-description';
  description.textContent = event.description;

  content.append(backBtn, header, details, description);

  if (currentUser?.role === 'admin') {
    const actions = document.createElement('div');
    actions.className = 'announcement-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.id = 'edit-event-btn';
    editBtn.className = 'ticket-action-btn';
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.id = 'delete-event-btn';
    deleteBtn.className = 'ticket-action-btn';
    deleteBtn.textContent = 'Delete';

    actions.append(editBtn, deleteBtn);
    content.append(actions);
  }

  dom.calendarDetail.append(content);
}
