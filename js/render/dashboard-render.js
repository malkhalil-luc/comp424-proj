import {
  getCurrentUser,
  getDashboardStats,
  getPinnedAnnouncement,
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

function createSectionCard(titleText) {
  const section = document.createElement('section');
  section.className = 'dashboard-section';

  const title = document.createElement('h2');
  title.className = 'dashboard-section-title';
  title.textContent = titleText;

  section.append(title);
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

function renderAnnouncementCard() {
  const section = createSectionCard('Pinned Announcement');
  const announcement = getPinnedAnnouncement();

  if (!announcement) {
    const empty = document.createElement('p');
    empty.className = 'dashboard-empty';
    empty.textContent = 'No announcement is pinned right now.';
    section.append(empty);
    return section;
  }

  const card = document.createElement('article');
  card.className = 'dashboard-card dashboard-card--announcement';

  const title = document.createElement('h3');
  title.className = 'dashboard-card-title';
  title.textContent = announcement.title;

  const meta = document.createElement('p');
  meta.className = 'dashboard-card-meta';
  meta.textContent = `Published ${formatDateTime(announcement.publishedAt)}`;

  const body = document.createElement('p');
  body.className = 'dashboard-card-body';
  body.textContent = announcement.body;

  card.append(title, meta, body);
  section.append(card);
  return section;
}

function renderEventsCard() {
  const section = createSectionCard('Upcoming Events');
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
    renderStatsGrid(),
    renderAnnouncementCard(),
    renderEventsCard(),
    renderWeatherCard(state),
    renderQuickActions(),
  );
  return fragment;
}
