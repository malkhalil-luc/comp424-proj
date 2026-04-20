import {
  getCurrentUser,
  getDashboardPersona,
  getDashboardStats,
  getPinnedAnnouncements,
  getUpcomingEvents,
} from '../state.js';

function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '(invalid date)';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDashboardTimestamp() {
  const now = new Date();

  return now.toLocaleString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function createSectionCard(titleText) {
  const section = document.createElement('section');
  section.className = 'dashboard-section';

  const title = document.createElement('h2');
  title.className = 'dashboard-section-title';
  title.textContent = titleText;

  section.append(title);
  return section;
}

function renderWelcomeBanner() {
  const persona = getDashboardPersona();
  const section = document.createElement('section');
  section.className = 'dashboard-hero';

  const topRow = document.createElement('div');
  topRow.className = 'dashboard-hero-top';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'dashboard-hero-eyebrow';
  eyebrow.textContent = persona.eyebrow;

  const title = document.createElement('h2');
  title.className = 'dashboard-hero-title';
  title.textContent = persona.title;

  const body = document.createElement('p');
  body.className = 'dashboard-hero-body';
  body.textContent = persona.body;

  const timestamp = document.createElement('p');
  timestamp.className = 'dashboard-hero-timestamp';
  timestamp.textContent = formatDashboardTimestamp();

  const highlights = document.createElement('div');
  highlights.className = 'dashboard-hero-highlights';

  persona.highlights.forEach((itemText) => {
    const item = document.createElement('p');
    item.className = 'dashboard-hero-highlight';
    item.textContent = itemText;
    highlights.append(item);
  });

  topRow.append(eyebrow, timestamp);
  section.append(topRow, title, body, highlights);
  return section;
}

function renderStatsGrid() {
  const wrapper = document.createElement('section');
  wrapper.className = 'dashboard-stats';

  getDashboardStats().forEach((stat) => {
    const card = document.createElement('article');
    card.className = 'stat-card';

    const value = document.createElement('p');
    value.className = 'stat-card-value';
    value.textContent = String(stat.value);

    const label = document.createElement('p');
    label.className = 'stat-card-label';
    label.textContent = stat.label;

    card.append(value, label);
    wrapper.append(card);
  });

  return wrapper;
}

function createLoadingMessage(text) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard-loading-inline';

  const spinner = document.createElement('span');
  spinner.className = 'data-status-spinner';
  spinner.setAttribute('aria-hidden', 'true');

  const body = document.createElement('p');
  body.className = 'dashboard-empty';
  body.textContent = text;

  wrapper.append(spinner, body);
  return wrapper;
}

function renderAnnouncementCard(state) {
  const section = createSectionCard('Pinned Announcements');

  const isAnnouncementsLoading = state.announcementsLoading
    || (
      state.announcements.length === 0
      && state.announcementsError === ''
      && state.announcementsStaleNotice === ''
    );

  if (isAnnouncementsLoading) {
    section.append(createLoadingMessage('Loading pinned announcements…'));
    return section;
  }

  if (state.announcementsError && state.announcements.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'dashboard-empty';
    empty.textContent = state.announcementsError;
    section.append(empty);
    return section;
  }

  const announcements = getPinnedAnnouncements();

  if (announcements.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'dashboard-empty';
    empty.textContent = 'No announcements are pinned right now.';
    section.append(empty);
    return section;
  }

  const list = document.createElement('div');
  list.className = 'dashboard-list';

  announcements.forEach((announcement) => {
    const item = document.createElement('article');
    item.className = 'dashboard-list-item dashboard-list-item--announcement';

    const header = document.createElement('div');
    header.className = 'dashboard-list-header';

    const title = document.createElement('p');
    title.className = 'dashboard-list-title';
    title.textContent = announcement.title;

    const badge = document.createElement('span');
    badge.className = 'dashboard-pill dashboard-pill--announcement';
    badge.textContent = 'Pinned';

    const meta = document.createElement('p');
    meta.className = 'dashboard-list-meta';
    meta.textContent = `Published ${formatDateTime(announcement.publishedAt)}`;

    header.append(title, badge);
    item.append(header, meta);
    list.append(item);
  });

  section.append(list);
  return section;
}

function renderEventsCard(state) {
  const section = createSectionCard('Upcoming Events');

  const isEventsLoading = state.eventsLoading
    || (
      state.events.length === 0
      && state.eventsError === ''
      && state.eventsStaleNotice === ''
    );

  if (isEventsLoading) {
    section.append(createLoadingMessage('Loading upcoming events…'));
    return section;
  }

  if (state.eventsError && state.events.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'dashboard-empty';
    empty.textContent = state.eventsError;
    section.append(empty);
    return section;
  }

  const events = getUpcomingEvents();

  if (events.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'dashboard-empty';
    empty.textContent = 'No events scheduled yet.';
    section.append(empty);
    return section;
  }

  const list = document.createElement('div');
  list.className = 'dashboard-list';

  events.forEach((event) => {
    const item = document.createElement('article');
    item.className = 'dashboard-list-item';

    const title = document.createElement('p');
    title.className = 'dashboard-list-title';
    title.textContent = event.title;

    const meta = document.createElement('p');
    meta.className = 'dashboard-list-meta';
    meta.textContent = `${event.eventType} · ${formatDateTime(event.startsAt)} · ${event.location}`;

    item.append(title, meta);
    list.append(item);
  });

  section.append(list);
  return section;
}

function renderWeatherCard(state) {
  const section = createSectionCard('Chicago Weather');
  const card = document.createElement('article');
  card.className = 'dashboard-card dashboard-card--weather';

  const isWeatherLoading = state.weatherLoading
    || (state.weather == null && state.weatherError === '');

  if (isWeatherLoading) {
    card.append(createLoadingMessage('Loading weather snapshot…'));
    section.append(card);
    return section;
  }

  if (!state.weather) {
    const empty = document.createElement('p');
    empty.className = 'dashboard-empty';
    empty.textContent = state.weatherError || 'Weather data is not available.';
    card.append(empty);
    section.append(card);
    return section;
  }

  const temp = document.createElement('p');
  temp.className = 'weather-temp';
  temp.textContent = `${state.weather.temperature}°F`;

  const summary = document.createElement('p');
  summary.className = 'dashboard-card-title';
  summary.textContent = state.weather.label;

  const wind = document.createElement('p');
  wind.className = 'dashboard-card-meta';
  wind.textContent = `Wind ${state.weather.windSpeed} mph`;

  card.append(temp, summary, wind);
  section.append(card);
  return section;
}

function renderQuickActions() {
  const section = createSectionCard('Quick Actions');
  const currentUser = getCurrentUser();

  const card = document.createElement('article');
  card.className = 'dashboard-card dashboard-card--action';

  const title = document.createElement('h3');
  title.className = 'dashboard-card-title';
  title.textContent = currentUser?.role === 'admin'
    ? 'Manage support queue'
    : 'Submit a new support request';

  const body = document.createElement('p');
  body.className = 'dashboard-card-body';
  body.textContent = currentUser?.role === 'admin'
    ? 'Review assignments, update ticket status, and respond to employees from the Support section.'
    : 'Use the Support section to submit a new ticket, track replies, and reopen a closed issue when needed.';

  card.append(title, body);
  section.append(card);
  return section;
}

export function renderDashboard(state) {
  const fragment = document.createDocumentFragment();

  fragment.append(
    renderWelcomeBanner(),
    renderStatsGrid(),
    renderAnnouncementCard(state),
    renderEventsCard(state),
    renderWeatherCard(state),
    renderQuickActions(),
  );
  return fragment;
}
