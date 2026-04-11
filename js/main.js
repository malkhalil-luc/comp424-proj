import { state } from './state.js';
import { renderApp } from './render/app-render.js';
import { bindAppEvents } from './events/app-events.js';
import { bindSupportEvents } from './events/support-events.js';
import {
  appShell,
  sidebarToggle,
  sidebarBackdrop,
  ticketDetail,
  shell,
  ticketList,
  ticketSearchInput,
} from './dom.js';
import { loadTicketsData } from './data/tickets-data.js';

if (!appShell || !sidebarToggle || !sidebarBackdrop) {
  throw new Error('main.js: Missing critical layout elements — check HTML');
}

if (!ticketList || !ticketDetail || !shell || !ticketSearchInput) {
  throw new Error('main.js: Missing critical content elements — check HTML');
}

function render() {
  renderApp(state, {
    onBackFromDetail: () => {
      state.selectedTicketId = null;
      render();
    },
  });
}

async function init() {
  bindAppEvents(state, render);
  bindSupportEvents(state, render);

  const result = await loadTicketsData({
    selectedTicketId: state.selectedTicketId,
  });

  state.tickets = result.tickets;
  state.selectedTicketId = result.selectedTicketId;
  state.loadError = result.loadError;

  render();
}

init();
