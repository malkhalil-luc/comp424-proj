import { state } from './state.js';
import { render } from './render.js';
import { bindAppEvents } from './events/app-events.js';
import { bindSupportEvents } from './events/support-events.js';
import {
  clearSessionUserId,
  loadSessionUserId,
  saveSessionUserId,
} from './data/storage.js';
import { dom } from './dom.js';
import { loadDashboardData, loadTicketsData } from './api.js';

if (!dom.appShell || !dom.sidebarToggle || !dom.sidebarBackdrop) {
  throw new Error('main.js: Missing critical layout elements — check HTML');
}

if (
  !dom.topBarWidgets
  || !dom.ticketList
  || !dom.ticketDetail
  || !dom.shell
  || !dom.searchBarContainer
  || !dom.ticketFilterContainer
  || !dom.ticketSortSelect
  || !dom.priorityInput
  || !dom.loginView
  || !dom.portalView
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
  const result = await loadDashboardData();
  state.events = result.events;
  state.announcements = result.announcements;
  state.weather = result.weather;
  state.weatherError = result.weatherError;
}

async function init() {
  const savedUserId = loadSessionUserId();
  if (savedUserId && state.users.some((user) => user.id === savedUserId)) {
    state.currentUserId = savedUserId;
    state.selectedLoginUserId = savedUserId;
  }

  bindAppEvents(state, renderAppState);
  bindSupportEvents(state, renderAppState);
  await loadDashboardState();
  await loadAndRenderTickets();
}

init();
