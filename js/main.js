import { state } from './state.js';
import { render } from './render.js';
import { bindAppEvents } from './events/app-events.js';
import { bindAnnouncementsEvents } from './events/announcements-events.js';
import { bindCalendarEvents } from './events/calendar-events.js';
import { bindDirectoryEvents } from './events/directory-events.js';
import { bindNewsEvents } from './events/news-events.js';
import { bindSupportEvents } from './events/support-events.js';
import {
  clearSessionUserId,
  loadSessionUserId,
  saveSessionUserId,
} from './data/storage.js';
import { dom } from './dom.js';
import {
  loadAnnouncementsData,
  loadDashboardData,
  loadDirectoryData,
  loadEventsData,
  loadNewsData,
  loadTicketsData,
} from './api.js';

const VALID_HASH_SECTIONS = [
  'dashboard',
  'support',
  'news',
  'announcements',
  'directory',
  'calendar',
];

/** e.g. /calendar → /#calendar (static server has no path router) */
function redirectPathnameToHash() {
  if (window.location.hash) {
    return;
  }
  const match = window.location.pathname.match(
    /^\/(dashboard|support|news|announcements|directory|calendar)\/?$/
  );
  if (match) {
    window.location.replace(`${window.location.origin}/#${match[1]}`);
  }
}

function syncActiveSectionFromHash() {
  const raw = window.location.hash.replace(/^#/, '');
  if (VALID_HASH_SECTIONS.includes(raw)) {
    state.activeSection = raw;
  }
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch {}
}

if (!dom.appShell || !dom.sidebarToggle || !dom.sidebarBackdrop) {
  throw new Error('main.js: Missing critical layout elements — check HTML');
}

if (
  !dom.topBarWidgets
  || !dom.ticketStatusRoot
  || !dom.ticketList
  || !dom.ticketDetail
  || !dom.supportShell
  || !dom.searchBarContainer
  || !dom.ticketFilterContainer
  || !dom.ticketSortSelect
  || !dom.priorityInput
  || !dom.loginView
  || !dom.portalView
  || !dom.announcementsView
  || !dom.announcementsStatusRoot
  || !dom.announcementList
  || !dom.announcementDetail
  || !dom.newsView
  || !dom.newsStatusRoot
  || !dom.newsList
  || !dom.newsDetail
  || !dom.directoryView
  || !dom.directoryStatusRoot
  || !dom.directoryList
  || !dom.directoryDetail
  || !dom.calendarView
  || !dom.calendarStatusRoot
  || !dom.calendarList
  || !dom.calendarDetail
) {
  throw new Error('main.js: Missing critical content elements — check HTML');
}

function resetPortalUi() {
  state.activeSection = 'dashboard';
  state.query = '';
  state.activeFilter = 'all';
  state.sortBy = 'newest';
  state.selectedId = null;
  state.showNewTicketForm = false;
  state.announcementQuery = '';
  state.selectedAnnouncementId = null;
  state.showAnnouncementForm = false;
  state.editingAnnouncementId = null;
  state.newsQuery = '';
  state.activeNewsCategory = 'all';
  state.selectedNewsId = null;
  state.showNewsForm = false;
  state.editingNewsId = null;
  state.directoryQuery = '';
  state.activeDepartment = 'all';
  state.selectedEmployeeId = null;
  state.calendarQuery = '';
  state.activeEventType = 'all';
  state.selectedEventId = null;
  state.showEventForm = false;
  state.editingEventId = null;
}

function renderAppState() {
  render(state, {
    onBackFromDetail: () => {
      state.selectedId = null;
      renderAppState();
    },
    onRetryLoad: loadAndRenderTickets,
    onRetryAnnouncementsLoad: loadAnnouncementsState,
    onRetryNewsLoad: loadNewsState,
    onRetryDirectoryLoad: loadDirectoryState,
    onRetryEventsLoad: loadEventsState,
    onSearchInput: (value) => {
      state.query = value;
      renderAppState();
    },
    onSearchClear: () => {
      state.query = '';
      renderAppState();
    },
    onFilterChange: (value) => {
      state.activeFilter = value;
      renderAppState();
    },
    onAnnouncementSearchInput: (value) => {
      state.announcementQuery = value;
      renderAppState();
    },
    onAnnouncementSearchClear: () => {
      state.announcementQuery = '';
      renderAppState();
    },
    onNewsSearchInput: (value) => {
      state.newsQuery = value;
      renderAppState();
    },
    onNewsSearchClear: () => {
      state.newsQuery = '';
      renderAppState();
    },
    onNewsCategoryChange: (value) => {
      state.activeNewsCategory = value;
      renderAppState();
    },
    onDirectorySearchInput: (value) => {
      state.directoryQuery = value;
      renderAppState();
    },
    onDirectorySearchClear: () => {
      state.directoryQuery = '';
      renderAppState();
    },
    onDepartmentChange: (value) => {
      state.activeDepartment = value;
      renderAppState();
    },
    onCalendarSearchInput: (value) => {
      state.calendarQuery = value;
      renderAppState();
    },
    onCalendarSearchClear: () => {
      state.calendarQuery = '';
      renderAppState();
    },
    onEventTypeChange: (value) => {
      state.activeEventType = value;
      renderAppState();
    },
    onLoginUserChange: (userId) => {
      state.selectedLoginUserId = userId;
      renderAppState();
    },
    onLogin: () => {
      state.currentUserId = state.selectedLoginUserId;
      saveSessionUserId(state.currentUserId);
      resetPortalUi();
      syncActiveSectionFromHash();
      renderAppState();
    },
    onLogout: () => {
      clearSessionUserId();
      state.currentUserId = null;
      state.selectedLoginUserId = state.users[0]?.id ?? null;
      resetPortalUi();
      renderAppState();
    },
  });
}


async function loadAndRenderTickets() {
  state.isLoading = true;
  state.error = '';
  state.staleNotice = '';
  renderAppState();

  const result = await loadTicketsData({
    selectedId: state.selectedId,
  });

  state.tickets = result.tickets;
  state.selectedId = result.selectedId;
  state.error = result.error;
  state.staleNotice = result.staleNotice;
  state.lastLoadedAt = result.lastLoadedAt;
  state.isLoading = false;

  renderAppState();
}

async function loadDashboardState() {
  state.weatherLoading = true;
  renderAppState();

  try {
    const result = await loadDashboardData();
    state.weather = result.weather;
    state.weatherError = result.weatherError;
  } catch {
    state.weather = null;
    state.weatherError = 'Weather data is currently unavailable.';
  }

  state.weatherLoading = false;
  renderAppState();
}

async function loadEventsState() {
  state.eventsLoading = true;
  state.eventsError = '';
  state.eventsStaleNotice = '';
  renderAppState();

  const result = await loadEventsData();
  state.events = result.items;
  state.eventsError = result.error;
  state.eventsStaleNotice = result.staleNotice;
  state.selectedEventId = state.events[0]?.id ?? null;
  state.eventsLoading = false;
  renderAppState();
}

async function loadAnnouncementsState() {
  state.announcementsLoading = true;
  state.announcementsError = '';
  state.announcementsStaleNotice = '';
  renderAppState();

  const result = await loadAnnouncementsData();
  state.announcements = result.items;
  state.announcementsError = result.error;
  state.announcementsStaleNotice = result.staleNotice;
  state.selectedAnnouncementId = state.announcements[0]?.id ?? null;
  state.announcementsLoading = false;
  renderAppState();
}

async function loadNewsState() {
  state.newsLoading = true;
  state.newsError = '';
  state.newsStaleNotice = '';
  renderAppState();

  const result = await loadNewsData();
  state.newsArticles = result.items;
  state.newsError = result.error;
  state.newsStaleNotice = result.staleNotice;
  state.selectedNewsId = state.newsArticles[0]?.id ?? null;
  state.newsLoading = false;
  renderAppState();
}

async function loadDirectoryState() {
  state.directoryLoading = true;
  state.directoryError = '';
  state.directoryStaleNotice = '';
  renderAppState();

  const result = await loadDirectoryData();
  state.employees = result.items;
  state.directoryError = result.error;
  state.directoryStaleNotice = result.staleNotice;
  state.selectedEmployeeId = state.employees[0]?.id ?? null;
  state.directoryLoading = false;
  renderAppState();
}

async function init() {
  redirectPathnameToHash();
  registerServiceWorker();

  const savedUserId = loadSessionUserId();
  if (savedUserId && state.users.some((user) => user.id === savedUserId)) {
    state.currentUserId = savedUserId;
    state.selectedLoginUserId = savedUserId;
  }

  bindAppEvents(state, renderAppState);
  bindAnnouncementsEvents(state, renderAppState);
  bindCalendarEvents(state, renderAppState);
  bindDirectoryEvents(state, renderAppState);
  bindNewsEvents(state, renderAppState);
  bindSupportEvents(state, renderAppState);

  if (state.currentUserId) {
    syncActiveSectionFromHash();
  }

  window.addEventListener('hashchange', () => {
    if (!state.currentUserId) {
      return;
    }
    syncActiveSectionFromHash();
    renderAppState();
  });

  const startupLoads = [
    loadDashboardState(),
    loadEventsState(),
    loadAnnouncementsState(),
    loadNewsState(),
    loadDirectoryState(),
    loadAndRenderTickets(),
  ];

  renderAppState();
  await Promise.all(startupLoads);
  renderAppState();
}

init();
