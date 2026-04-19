import { state } from './state.js';
import { render } from './render.js';
import { bindAppEvents } from './events/app-events.js';
import { bindAnnouncementsEvents } from './events/announcements-events.js';
import { bindDirectoryEvents } from './events/directory-events.js';
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
  loadTicketsData,
} from './api.js';

if (!dom.appShell || !dom.sidebarToggle || !dom.sidebarBackdrop) {
  throw new Error('main.js: Missing critical layout elements — check HTML');
}

if (
  !dom.topBarWidgets
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
  || !dom.announcementList
  || !dom.announcementDetail
  || !dom.directoryView
  || !dom.directoryList
  || !dom.directoryDetail
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
  state.directoryQuery = '';
  state.activeDepartment = 'all';
  state.selectedEmployeeId = null;
}

function renderAppState() {
  render(state, {
    onBackFromDetail: () => {
      state.selectedId = null;
      renderAppState();
    },
    onRetryLoad: loadAndRenderTickets,
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
    onLoginUserChange: (userId) => {
      state.selectedLoginUserId = userId;
      renderAppState();
    },
    onLogin: () => {
      state.currentUserId = state.selectedLoginUserId;
      saveSessionUserId(state.currentUserId);
      resetPortalUi();
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
  try {
    const result = await loadDashboardData();
    state.events = result.events;
    state.weather = result.weather;
    state.weatherError = result.weatherError;
  } catch {
    state.events = [];
    state.weather = null;
    state.weatherError = 'Weather data is currently unavailable.';
  }
}

async function loadAnnouncementsState() {
  try {
    state.announcements = await loadAnnouncementsData();
    state.selectedAnnouncementId = state.announcements[0]?.id ?? null;
  } catch {
    state.announcements = [];
    state.selectedAnnouncementId = null;
  }
}

async function loadDirectoryState() {
  try {
    state.employees = await loadDirectoryData();
    state.selectedEmployeeId = state.employees[0]?.id ?? null;
  } catch {
    state.employees = [];
    state.selectedEmployeeId = null;
  }
}

async function init() {
  const savedUserId = loadSessionUserId();
  if (savedUserId && state.users.some((user) => user.id === savedUserId)) {
    state.currentUserId = savedUserId;
    state.selectedLoginUserId = savedUserId;
  }

  bindAppEvents(state, renderAppState);
  bindAnnouncementsEvents(state, renderAppState);
  bindDirectoryEvents(state, renderAppState);
  bindSupportEvents(state, renderAppState);
  renderAppState();
  await loadDashboardState();
  renderAppState();
  await loadAnnouncementsState();
  renderAppState();
  await loadDirectoryState();
  renderAppState();
  await loadAndRenderTickets();
}

init();
