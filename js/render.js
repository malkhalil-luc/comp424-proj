import { dom } from './dom.js';
import { FilterChips } from './components/filter-chips.js';
import { LoginPanel } from './components/login-panel.js';
import { SearchBar } from './components/search-bar.js';
import {
  getDepartmentCounts,
  getAccessibleTickets,
  getCurrentUser,
  getSelectedTicket,
  getTicketStatusCounts,
  getSelectedAnnouncement,
} from './state.js';
import { renderDashboard } from './render/dashboard-render.js';
import {
  renderDirectoryDetail,
  renderDirectoryList,
} from './render/directory-render.js';
import {
  renderAnnouncementDetail,
  renderAnnouncementList,
} from './render/announcements-render.js';
import { renderTicketDetail, renderTicketList } from './render/support-render.js';

function renderSessionBar(currentUser, onLogout) {
  const role = document.createElement('span');
  role.className = `session-role session-role--${currentUser.role}`;
  role.textContent = currentUser.role;

  const name = document.createElement('span');
  name.className = 'session-name';
  name.textContent = currentUser.name;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ticket-action-btn';
  button.textContent = 'Log Out';
  button.addEventListener('click', onLogout);

  const wrapper = document.createElement('div');
  wrapper.className = 'session-summary';
  wrapper.append(role, name, button);

  dom.topBarWidgets.replaceChildren(wrapper);
}

function renderAnnouncementForm(state) {
  const currentUser = getCurrentUser();
  if (currentUser?.role !== 'admin') {
    dom.newAnnouncementBtn.hidden = true;
    dom.announcementFormSection.hidden = true;
    return;
  }

  dom.newAnnouncementBtn.hidden = false;
  dom.announcementFormSection.hidden = !state.showAnnouncementForm;

  if (!state.showAnnouncementForm) {
    return;
  }

  const editingAnnouncement = state.editingAnnouncementId
    ? state.announcements.find((announcement) => announcement.id === state.editingAnnouncementId) ?? null
    : null;
  if (state.editingAnnouncementId && editingAnnouncement) {
    dom.announcementTitleInput.value = editingAnnouncement.title;
    dom.announcementBodyInput.value = editingAnnouncement.body;
    dom.announcementPinnedInput.checked = editingAnnouncement.isPinned;
  } else {
    dom.announcementForm.reset();
    dom.announcementPinnedInput.checked = false;
  }
}

export function render(state, handlers) {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    dom.sidebar.hidden = true;
    dom.sidebarBackdrop.hidden = true;
    dom.sidebarToggle.hidden = true;
    dom.portalView.hidden = true;
    dom.loginView.hidden = false;
    dom.topBarWidgets.replaceChildren();

    LoginPanel(dom.loginView, {
      users: state.users,
      selectedUserId: state.selectedLoginUserId,
      onChange: handlers.onLoginUserChange,
      onLogin: handlers.onLogin,
    });
    return;
  }

  dom.sidebar.hidden = false;
  dom.sidebarBackdrop.hidden = false;
  dom.sidebarToggle.hidden = false;
  dom.portalView.hidden = true;
  dom.loginView.hidden = true;

  renderSessionBar(currentUser, handlers.onLogout);

  dom.navLinks.forEach((link) => {
    const isActive = link.dataset.section === state.activeSection;
    link.classList.toggle('nav-link--active', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  if (state.activeSection === 'dashboard') {
    dom.pageTitle.textContent = 'Dashboard';
    dom.dashboardView.hidden = false;
    dom.supportView.hidden = true;
    dom.announcementsView.hidden = true;
    dom.directoryView.hidden = true;
    dom.dashboardView.replaceChildren(renderDashboard(state));
    dom.portalView.hidden = false;
    return;
  }

  if (state.activeSection === 'announcements') {
    dom.pageTitle.textContent = 'Announcements';
    dom.dashboardView.hidden = true;
    dom.supportView.hidden = true;
    dom.announcementsView.hidden = false;
    dom.directoryView.hidden = true;

    SearchBar(dom.announcementSearchContainer, {
      query: state.announcementQuery,
      onInput: handlers.onAnnouncementSearchInput,
      onClear: handlers.onAnnouncementSearchClear,
      inputId: 'announcement-search',
      labelText: 'Search announcements',
      placeholder: 'Search announcements...',
    });

    renderAnnouncementForm(state);
    renderAnnouncementList(state);
    renderAnnouncementDetail(state);
    dom.portalView.hidden = false;
    return;
  }

  if (state.activeSection === 'directory') {
    dom.pageTitle.textContent = 'Directory';
    dom.dashboardView.hidden = true;
    dom.supportView.hidden = true;
    dom.announcementsView.hidden = true;
    dom.directoryView.hidden = false;

    SearchBar(dom.directorySearchContainer, {
      query: state.directoryQuery,
      onInput: handlers.onDirectorySearchInput,
      onClear: handlers.onDirectorySearchClear,
      inputId: 'directory-search',
      labelText: 'Search directory',
      placeholder: 'Search employees...',
    });

    const departmentCounts = getDepartmentCounts();
    FilterChips(dom.directoryFilterContainer, {
      chips: [
        { value: 'all', label: `All (${state.employees.length})` },
        ...Object.entries(departmentCounts).map(([department, count]) => ({
          value: department,
          label: `${department} (${count})`,
        })),
      ],
      activeValue: state.activeDepartment,
      onChange: handlers.onDepartmentChange,
      ariaLabel: 'Filter employees by department',
    });

    renderDirectoryList(state);
    renderDirectoryDetail();
    dom.portalView.hidden = false;
    return;
  }

  dom.pageTitle.textContent = 'Support Tickets';
  dom.dashboardView.hidden = true;
  dom.supportView.hidden = false;
  dom.announcementsView.hidden = true;
  dom.directoryView.hidden = true;

  SearchBar(dom.searchBarContainer, {
    query: state.query,
    onInput: handlers.onSearchInput,
    onClear: handlers.onSearchClear,
    inputId: 'ticket-search',
    labelText: 'Search tickets',
    placeholder: 'Search tickets...',
  });

  const accessibleTickets = getAccessibleTickets();
  const counts = getTicketStatusCounts(accessibleTickets);
  const allCount = accessibleTickets.length;
  FilterChips(dom.ticketFilterContainer, {
    chips: [
      { value: 'all', label: `All (${allCount})` },
      { value: 'Open', label: `Open (${counts.Open ?? 0})` },
      { value: 'In Progress', label: `In Progress (${counts['In Progress'] ?? 0})` },
      { value: 'Closed', label: `Closed (${counts.Closed ?? 0})` },
    ],
    activeValue: state.activeFilter,
    onChange: handlers.onFilterChange,
    ariaLabel: 'Filter tickets by status',
  });

  dom.ticketSortSelect.value = state.sortBy;

  dom.loadErrorBanner.hidden = state.error === '';
  dom.loadErrorMessage.textContent = state.error;
  dom.retryLoadBtn.onclick = handlers.onRetryLoad;

  dom.staleDataBanner.hidden = state.staleNotice === '';
  dom.staleDataBanner.textContent = state.staleNotice;

  dom.newTicketFormSection.hidden = state.isLoading || !state.showNewTicketForm;
  dom.supportShell.classList.toggle('detail-view-active', Boolean(getSelectedTicket()));


  if (state.isLoading) {
    dom.loadErrorBanner.hidden = true;
    dom.staleDataBanner.hidden = true;
    dom.emptyState.hidden = true;

    dom.ticketList.classList.add('is-loading');
    dom.ticketList.textContent = '';

    const loadingItem = document.createElement('li');
    loadingItem.textContent = 'Loading tickets...';
    dom.ticketList.append(loadingItem);

    dom.ticketDetail.innerHTML = '';
    const loadingDetail = document.createElement('p');
    loadingDetail.className = 'detail-placeholder';
    loadingDetail.textContent = 'Loading details...';
    dom.ticketDetail.append(loadingDetail);
    dom.portalView.hidden = false;
    return;
  }

  dom.ticketList.classList.remove('is-loading');

  if (state.error && state.tickets.length === 0) {
    dom.emptyState.hidden = true;
    dom.ticketList.textContent = '';

    dom.ticketDetail.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Retry loading to continue.';
    dom.ticketDetail.append(placeholder);
    dom.portalView.hidden = false;
    return;
  }

  renderTicketList(state);
  renderTicketDetail(state, handlers.onBackFromDetail, currentUser);
  dom.portalView.hidden = false;
}
