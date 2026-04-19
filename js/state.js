import { demoUsers } from './data/demo-users.js';

export const state = {
  tickets: [],
  users: demoUsers,
  currentUserId: null,
  selectedLoginUserId: 'staff-001',
  activeSection: 'dashboard',
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
  events: [],
  announcements: [],
  weather: null,
  weatherError: '',
};

const PRIORITY_RANK = {
  high: 3,
  medium: 2,
  low: 1,
};

export const ticketStatuses = ['Open', 'In Progress', 'Closed'];
export const ticketPriorities = ['low', 'medium', 'high'];

export function getCurrentUser() {
  if (!state.currentUserId) {
    return null;
  }

  return state.users.find(user => user.id === state.currentUserId) ?? null;
}

export function getUserById(userId) {
  return state.users.find(user => user.id === userId) ?? null;
}

export function getAdminUsers() {
  return state.users.filter(user => user.role === 'admin');
}

export function getPinnedAnnouncement() {
  return state.announcements.find((announcement) => announcement.isPinned) ?? state.announcements[0] ?? null;
}

export function getUpcomingEvents() {
  return [...state.events]
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .slice(0, 3);
}

export function getAccessibleTickets() {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return [];
  }

  if (currentUser.role === 'admin') {
    return state.tickets;
  }

  return state.tickets.filter(ticket => ticket.createdByUserId === currentUser.id);
}

export function getFilteredTickets() {
  const query = state.query.toLowerCase().trim();

  return getAccessibleTickets().filter(ticket => {
    const title = String(ticket.title ?? '').toLowerCase();
    const description = String(ticket.description ?? '').toLowerCase();
    const messages = Array.isArray(ticket.messages) ? ticket.messages : [];
    const matchesMessage = messages.some(message =>
      String(message.body ?? '').toLowerCase().includes(query)
    );
    const matchesQuery = title.includes(query) || description.includes(query) || matchesMessage;
    const matchesFilter = state.activeFilter === 'all'
      || ticket.ticketStatus === state.activeFilter;

    return matchesQuery && matchesFilter;
  });
}

export function getSortedTickets(tickets = getFilteredTickets()) {
  if (state.sortBy === 'priority') {
    return [...tickets].sort((a, b) => {
      const rankDiff = (PRIORITY_RANK[b.priority] ?? 0) - (PRIORITY_RANK[a.priority] ?? 0);
      if (rankDiff !== 0) {
        return rankDiff;
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

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

  return getAccessibleTickets().find(ticket => ticket.id === state.selectedId) ?? null;
}

export function getTicketStatusCounts(tickets = getAccessibleTickets()) {
  return ticketStatuses.reduce((counts, status) => {
    counts[status] = tickets.filter(ticket => ticket.ticketStatus === status).length;
    return counts;
  }, {});
}

export function getAssignedAgent(ticket) {
  return getUserById(ticket.assignedAgentId);
}

export function canManageTicket(ticket) {
  const currentUser = getCurrentUser();
  return Boolean(ticket && currentUser?.role === 'admin');
}

export function canReplyToTicket(ticket) {
  return Boolean(ticket) && ticket.ticketStatus !== 'Closed';
}

export function canReopenTicket(ticket) {
  return Boolean(ticket) && ticket.ticketStatus === 'Closed';
}

export function getDashboardStats() {
  const currentUser = getCurrentUser();
  const accessibleTickets = getAccessibleTickets();
  const openTickets = accessibleTickets.filter(ticket => ticket.ticketStatus === 'Open').length;
  const closedTickets = accessibleTickets.filter(ticket => ticket.ticketStatus === 'Closed').length;
  const highPriorityTickets = accessibleTickets.filter(ticket => ticket.priority === 'high').length;
  const unassignedTickets = state.tickets.filter(ticket => ticket.assignedAgentId == null).length;

  if (currentUser?.role === 'admin') {
    return [
      { label: 'Open Tickets', value: openTickets },
      { label: 'High Priority', value: highPriorityTickets },
      { label: 'Unassigned', value: unassignedTickets },
      { label: 'Closed Tickets', value: closedTickets },
    ];
  }

  return [
    { label: 'My Open Tickets', value: openTickets },
    { label: 'My Closed Tickets', value: closedTickets },
    { label: 'High Priority', value: highPriorityTickets },
    { label: 'Upcoming Events', value: getUpcomingEvents().length },
  ];
}
