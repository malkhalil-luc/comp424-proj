import { state } from './state.js';
import { render } from './render.js';
import { bindAppEvents } from './events/app-events.js';
import { bindSupportEvents } from './events/support-events.js';
import {
  appShell,
  sidebarToggle,
  sidebarBackdrop,
  ticketDetail,
  shell,
  ticketList,
  searchBarContainer,
} from './dom.js';
import { loadTicketsData } from './api.js';

if (!appShell || !sidebarToggle || !sidebarBackdrop) {
  throw new Error('main.js: Missing critical layout elements — check HTML');
}

if (!ticketList || !ticketDetail || !shell || !searchBarContainer) {
  throw new Error('main.js: Missing critical content elements — check HTML');
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

async function init() {
  bindAppEvents(state, renderAppState);
  bindSupportEvents(state, renderAppState);
  await loadAndRenderTickets();
}

init();
