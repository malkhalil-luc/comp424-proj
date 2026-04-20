import { dom } from '../dom.js';
import {
  getCurrentUser,
  getSelectedAnnouncement,
  getVisibleAnnouncements,
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

export function renderAnnouncementList(state) {
  const visibleAnnouncements = getVisibleAnnouncements();

  if (visibleAnnouncements.length === 0) {
    state.selectedAnnouncementId = null;
  } else if (!visibleAnnouncements.some((announcement) => announcement.id === state.selectedAnnouncementId)) {
    state.selectedAnnouncementId = visibleAnnouncements[0].id;
  }

  dom.announcementList.textContent = '';
  dom.announcementEmptyState.hidden = visibleAnnouncements.length > 0;
  dom.announcementEmptyState.textContent = state.announcementQuery.trim() === ''
    ? 'No announcements available.'
    : 'No announcements match your search.';

  visibleAnnouncements.forEach((announcement) => {
    const item = document.createElement('li');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'announcement-item';
    button.dataset.id = announcement.id;

    if (announcement.id === state.selectedAnnouncementId) {
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.setAttribute('aria-pressed', 'false');
    }

    const title = document.createElement('p');
    title.className = 'announcement-item-title';
    title.textContent = announcement.title;

    const meta = document.createElement('div');
    meta.className = 'announcement-item-meta';

    if (announcement.isPinned) {
      const pinned = document.createElement('span');
      pinned.className = 'announcement-badge';
      pinned.textContent = 'Pinned';
      meta.append(pinned);
    }

    const date = document.createElement('span');
    date.textContent = formatDateTime(announcement.publishedAt);
    meta.append(date);

    button.append(title, meta);
    item.append(button);
    dom.announcementList.append(item);
  });
}

export function renderAnnouncementDetail(state) {
  const announcement = getSelectedAnnouncement();
  const currentUser = getCurrentUser();

  dom.announcementDetail.innerHTML = '';

  if (!announcement) {
    const placeholder = document.createElement('p');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Select an announcement to view details.';
    dom.announcementDetail.append(placeholder);
    return;
  }

  const content = document.createElement('div');
  content.className = 'ticket-detail-content';

  const header = document.createElement('div');
  header.className = 'ticket-detail-header';

  const title = document.createElement('h3');
  title.className = 'ticket-detail-title';
  title.textContent = announcement.title;

  const meta = document.createElement('div');
  meta.className = 'ticket-detail-meta';

  if (announcement.isPinned) {
    const pinned = document.createElement('span');
    pinned.className = 'announcement-badge';
    pinned.textContent = 'Pinned';
    meta.append(pinned);
  }

  const published = document.createElement('span');
  published.textContent = `Published ${formatDateTime(announcement.publishedAt)}`;
  meta.append(published);

  header.append(title, meta);

  const body = document.createElement('p');
  body.className = 'ticket-detail-description';
  body.textContent = announcement.body;

  content.append(header, body);

  if (currentUser?.role === 'admin') {
    const actions = document.createElement('div');
    actions.className = 'announcement-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.id = 'edit-announcement-btn';
    editBtn.className = 'ticket-action-btn';
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.id = 'delete-announcement-btn';
    deleteBtn.className = 'ticket-action-btn';
    deleteBtn.textContent = 'Delete';

    actions.append(editBtn, deleteBtn);
    content.append(actions);
  }

  dom.announcementDetail.append(content);
}
