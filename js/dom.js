export const dom = {
  get appShell() {
    return document.querySelector('.app-shell');
  },
  get sidebarToggle() {
    return document.querySelector('#sidebar-toggle');
  },
  get sidebarBackdrop() {
    return document.querySelector('#sidebar-backdrop');
  },
  get sidebar() {
    return document.querySelector('.sidebar');
  },
  get navLinks() {
    return document.querySelectorAll('.nav-link[data-section]');
  },
  get ticketList() {
    return document.querySelector('#ticket-list');
  },
  get ticketDetail() {
    return document.querySelector('#ticket-detail');
  },
  get supportShell() {
    return document.querySelector('#support-view');
  },
  get emptyState() {
    return document.querySelector('#empty-state');
  },
  get loadErrorBanner() {
    return document.querySelector('#load-error-banner');
  },
  get loadErrorMessage() {
    return document.querySelector('#load-error-message');
  },
  get retryLoadBtn() {
    return document.querySelector('#retry-load-btn');
  },
  get staleDataBanner() {
    return document.querySelector('#stale-data-banner');
  },
  get searchBarContainer() {
    return document.querySelector('#search-bar-container');
  },
  get announcementSearchContainer() {
    return document.querySelector('#announcement-search-container');
  },
  get directorySearchContainer() {
    return document.querySelector('#directory-search-container');
  },
  get calendarSearchContainer() {
    return document.querySelector('#calendar-search-container');
  },
  get ticketFilterContainer() {
    return document.querySelector('#ticket-filter-container');
  },
  get directoryFilterContainer() {
    return document.querySelector('#directory-filter-container');
  },
  get calendarFilterContainer() {
    return document.querySelector('#calendar-filter-container');
  },
  get ticketSortSelect() {
    return document.querySelector('#ticket-sort');
  },
  get newTicketBtn() {
    return document.querySelector('#new-ticket-btn');
  },
  get newTicketFormSection() {
    return document.querySelector('#new-ticket-form-section');
  },
  get newTicketForm() {
    return document.querySelector('#new-ticket-form');
  },
  get cancelTicketBtn() {
    return document.querySelector('#cancel-ticket-btn');
  },
  get titleInput() {
    return document.querySelector('#ticket-title');
  },
  get descriptionInput() {
    return document.querySelector('#ticket-description');
  },
  get priorityInput() {
    return document.querySelector('#ticket-priority');
  },
  get titleError() {
    return document.querySelector('#ticket-title-error');
  },
  get descriptionError() {
    return document.querySelector('#ticket-description-error');
  },
  get formStatus() {
    return document.querySelector('#form-status');
  },
  get formError() {
    return document.querySelector('#form-error');
  },
  get topBarWidgets() {
    return document.querySelector('.top-bar-widgets');
  },
  get announcementList() {
    return document.querySelector('#announcement-list');
  },
  get announcementDetail() {
    return document.querySelector('#announcement-detail');
  },
  get announcementEmptyState() {
    return document.querySelector('#announcement-empty-state');
  },
  get newAnnouncementBtn() {
    return document.querySelector('#new-announcement-btn');
  },
  get announcementFormSection() {
    return document.querySelector('#announcement-form-section');
  },
  get announcementForm() {
    return document.querySelector('#announcement-form');
  },
  get cancelAnnouncementBtn() {
    return document.querySelector('#cancel-announcement-btn');
  },
  get announcementTitleInput() {
    return document.querySelector('#announcement-title');
  },
  get announcementBodyInput() {
    return document.querySelector('#announcement-body');
  },
  get announcementPinnedInput() {
    return document.querySelector('#announcement-pinned');
  },
  get announcementTitleError() {
    return document.querySelector('#announcement-title-error');
  },
  get announcementBodyError() {
    return document.querySelector('#announcement-body-error');
  },
  get announcementFormStatus() {
    return document.querySelector('#announcement-form-status');
  },
  get announcementFormError() {
    return document.querySelector('#announcement-form-error');
  },
  get directoryList() {
    return document.querySelector('#directory-list');
  },
  get calendarList() {
    return document.querySelector('#calendar-list');
  },
  get directoryDetail() {
    return document.querySelector('#directory-detail');
  },
  get calendarDetail() {
    return document.querySelector('#calendar-detail');
  },
  get directoryEmptyState() {
    return document.querySelector('#directory-empty-state');
  },
  get calendarEmptyState() {
    return document.querySelector('#calendar-empty-state');
  },
  get loginView() {
    return document.querySelector('#login-view');
  },
  get portalView() {
    return document.querySelector('#portal-view');
  },
  get dashboardView() {
    return document.querySelector('#dashboard-view');
  },
  get supportView() {
    return document.querySelector('#support-view');
  },
  get announcementsView() {
    return document.querySelector('#announcements-view');
  },
  get directoryView() {
    return document.querySelector('#directory-view');
  },
  get calendarView() {
    return document.querySelector('#calendar-view');
  },
  get pageTitle() {
    return document.querySelector('#page-title');
  },
};
