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
  announcementQuery: '',
  selectedAnnouncementId: null,
  showAnnouncementForm: false,
  editingAnnouncementId: null,
  newsArticles: [],
  newsQuery: '',
  activeNewsCategory: 'all',
  selectedNewsId: null,
  showNewsForm: false,
  editingNewsId: null,
  employees: [],
  directoryQuery: '',
  activeDepartment: 'all',
  selectedEmployeeId: null,
  calendarQuery: '',
  activeEventType: 'all',
  selectedEventId: null,
  showEventForm: false,
  editingEventId: null,
  weather: null,
  weatherLoading: false,
  weatherError: '',
  announcementsLoading: false,
  announcementsError: '',
  announcementsStaleNotice: '',
  newsLoading: false,
  newsError: '',
  newsStaleNotice: '',
  directoryLoading: false,
  directoryError: '',
  directoryStaleNotice: '',
  eventsLoading: false,
  eventsError: '',
  eventsStaleNotice: '',
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

export function getPinnedAnnouncements() {
  return [...state.announcements]
    .filter((announcement) => announcement.isPinned)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

export function getVisibleAnnouncements() {
  const query = state.announcementQuery.trim().toLowerCase();

  return [...state.announcements]
    .filter((announcement) => {
      if (query === '') {
        return true;
      }

      return announcement.title.toLowerCase().includes(query)
        || announcement.body.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }

      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
}

export function getSelectedAnnouncement() {
  if (!state.selectedAnnouncementId) {
    return null;
  }

  return state.announcements.find((announcement) => announcement.id === state.selectedAnnouncementId) ?? null;
}

export function getNewsCategoryCounts() {
  return state.newsArticles.reduce((counts, article) => {
    counts[article.category] = (counts[article.category] ?? 0) + 1;
    return counts;
  }, {});
}

export function getVisibleNews() {
  const query = state.newsQuery.trim().toLowerCase();

  return [...state.newsArticles]
    .filter((article) => {
      const matchesCategory = state.activeNewsCategory === 'all'
        || article.category === state.activeNewsCategory;
      if (!matchesCategory) {
        return false;
      }

      if (query === '') {
        return true;
      }

      return article.title.toLowerCase().includes(query)
        || article.summary.toLowerCase().includes(query)
        || article.body.toLowerCase().includes(query)
        || article.category.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      return new Date(b.publishedAt) - new Date(a.publishedAt);
    });
}

export function getSelectedNewsArticle() {
  if (!state.selectedNewsId) {
    return null;
  }

  return state.newsArticles.find((article) => article.id === state.selectedNewsId) ?? null;
}

export function getDepartmentCounts() {
  return state.employees.reduce((counts, employee) => {
    counts[employee.department] = (counts[employee.department] ?? 0) + 1;
    return counts;
  }, {});
}

export function getFilteredEmployees() {
  const query = state.directoryQuery.trim().toLowerCase();

  return state.employees.filter((employee) => {
    const matchesDepartment = state.activeDepartment === 'all'
      || employee.department === state.activeDepartment;
    if (!matchesDepartment) {
      return false;
    }

    if (query === '') {
      return true;
    }

    return employee.name.toLowerCase().includes(query)
      || employee.title.toLowerCase().includes(query)
      || employee.department.toLowerCase().includes(query)
      || employee.email.toLowerCase().includes(query);
  });
}

export function getVisibleEmployees() {
  return [...getFilteredEmployees()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getSelectedEmployee() {
  if (!state.selectedEmployeeId) {
    return null;
  }

  return state.employees.find((employee) => employee.id === state.selectedEmployeeId) ?? null;
}

export function getUpcomingEvents() {
  return [...state.events]
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
    .slice(0, 3);
}

export function getEventTypeCounts() {
  return state.events.reduce((counts, event) => {
    counts[event.eventType] = (counts[event.eventType] ?? 0) + 1;
    return counts;
  }, {});
}

export function getFilteredEvents() {
  const query = state.calendarQuery.trim().toLowerCase();

  return state.events.filter((event) => {
    const matchesType = state.activeEventType === 'all'
      || event.eventType === state.activeEventType;
    if (!matchesType) {
      return false;
    }

    if (query === '') {
      return true;
    }

    return event.title.toLowerCase().includes(query)
      || event.eventType.toLowerCase().includes(query)
      || event.location.toLowerCase().includes(query)
      || event.description.toLowerCase().includes(query)
      || event.organizer.toLowerCase().includes(query);
  });
}

export function getVisibleCalendarEvents() {
  return [...getFilteredEvents()].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

export function getSelectedEvent() {
  if (!state.selectedEventId) {
    return null;
  }

  return state.events.find((event) => event.id === state.selectedEventId) ?? null;
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

export function getDashboardPersona() {
  const currentUser = getCurrentUser();
  const accessibleTickets = getAccessibleTickets();
  const pinnedAnnouncements = getPinnedAnnouncements();
  const nextEvent = getUpcomingEvents()[0] ?? null;

  if (currentUser?.role === 'admin') {
    const unassignedCount = state.tickets.filter((ticket) => ticket.assignedAgentId == null).length;
    const inProgressCount = state.tickets.filter((ticket) => ticket.ticketStatus === 'In Progress').length;

    return {
      eyebrow: 'Admin Workspace',
      title: currentUser ? `Welcome back, ${currentUser.name}.` : 'Welcome back.',
      body: 'Keep the support queue moving, publish updates, and watch the portal activity that affects everyone.',
      highlights: [
        `${unassignedCount} ticket${unassignedCount === 1 ? '' : 's'} still need an agent.`,
        `${inProgressCount} ticket${inProgressCount === 1 ? ' is' : 's are'} actively being worked.`,
        `${pinnedAnnouncements.length} pinned announcement${pinnedAnnouncements.length === 1 ? '' : 's'} are visible on the dashboard.`,
      ],
    };
  }

  const openCount = accessibleTickets.filter((ticket) => ticket.ticketStatus === 'Open').length;
  const lastUpdatedTicket = [...accessibleTickets]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0] ?? null;

  return {
    eyebrow: 'Staff Workspace',
    title: currentUser ? `Welcome back, ${currentUser.name}.` : 'Welcome back.',
    body: 'Track your requests, catch important company updates, and keep an eye on the next event from one place.',
    highlights: [
      `${openCount} of your ticket${openCount === 1 ? '' : 's'} ${openCount === 1 ? 'is' : 'are'} currently open.`,
      lastUpdatedTicket
        ? `Your most recently updated ticket is "${lastUpdatedTicket.title}".`
        : 'You do not have any ticket activity yet.',
      nextEvent
        ? `Next event: ${nextEvent.title}.`
        : 'There are no upcoming events scheduled yet.',
    ],
  };
}
