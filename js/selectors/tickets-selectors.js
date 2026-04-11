export function getVisibleTickets(state) {
  const searchQuery = state.ticketQuery.toLowerCase().trim();

  return state.tickets.filter(ticket => {
    const title = String(ticket.title ?? '').toLowerCase();
    const description = String(ticket.description ?? '').toLowerCase();

    return title.includes(searchQuery) || description.includes(searchQuery);
  });
}

export function getSelectedTicket(state) {
  if (!state.selectedTicketId) {
    return null;
  }

  return state.tickets.find(ticket => ticket.id === state.selectedTicketId) ?? null;
}
