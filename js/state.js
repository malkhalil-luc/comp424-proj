export const state = {
  tickets: [],
  query: '',
  activeFilter: 'all',
  selectedId: null,
  sortBy: 'newest',
  showNewTicketForm: false,
  sidebarCollapsed: false,
  isLoading: false,
  error: '',
  staleNotice: '',
  lastLoadedAt: null,
};

export function getFilteredTickets() {
  const query = state.query.toLowerCase().trim();

  return state.tickets.filter(ticket => {
    const title = String(ticket.title ?? '').toLowerCase();
    const description = String(ticket.description ?? '').toLowerCase();
    const matchesQuery = title.includes(query) || description.includes(query);
    const matchesFilter = state.activeFilter === 'all'
      || ticket.ticketStatus === state.activeFilter;

    return matchesQuery && matchesFilter;
  });
}

export function getSortedTickets(tickets = getFilteredTickets()) {
  if (state.sortBy === 'oldest') {
    return [...tickets].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );
  }

  return [...tickets].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export function getVisibleTickets() {
  return getSortedTickets();
}

export function getSelectedTicket() {
  if (!state.selectedId) {
    return null;
  }

  return state.tickets.find(ticket => ticket.id === state.selectedId) ?? null;
}
