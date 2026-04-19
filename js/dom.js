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
  get shell() {
    return document.querySelector('.shell');
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
  get ticketFilterContainer() {
    return document.querySelector('#ticket-filter-container');
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
  get pageTitle() {
    return document.querySelector('#page-title');
  },
};
