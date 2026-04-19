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
  get newsSearchContainer() {
    return document.querySelector('#news-search-container');
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
  get newsFilterContainer() {
    return document.querySelector('#news-filter-container');
  },
  get directoryFilterContainer() {
    return document.querySelector('#directory-filter-container');
  },
  get calendarFilterContainer() {
    return document.querySelector('#calendar-filter-container');
  },
  get newEventBtn() {
    return document.querySelector('#new-event-btn');
  },
  get eventFormSection() {
    return document.querySelector('#event-form-section');
  },
  get eventForm() {
    return document.querySelector('#event-form');
  },
  get cancelEventBtn() {
    return document.querySelector('#cancel-event-btn');
  },
  get eventTitleInput() {
    return document.querySelector('#event-title');
  },
  get eventTypeInput() {
    return document.querySelector('#event-type');
  },
  get eventStartsAtInput() {
    return document.querySelector('#event-starts-at');
  },
  get eventLocationInput() {
    return document.querySelector('#event-location');
  },
  get eventOrganizerInput() {
    return document.querySelector('#event-organizer');
  },
  get eventDescriptionInput() {
    return document.querySelector('#event-description');
  },
  get eventTitleError() {
    return document.querySelector('#event-title-error');
  },
  get eventStartsAtError() {
    return document.querySelector('#event-starts-at-error');
  },
  get eventLocationError() {
    return document.querySelector('#event-location-error');
  },
  get eventFormStatus() {
    return document.querySelector('#event-form-status');
  },
  get eventFormError() {
    return document.querySelector('#event-form-error');
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
  get requesterField() {
    return document.querySelector('#ticket-requester-field');
  },
  get requesterInput() {
    return document.querySelector('#ticket-requester');
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
  get newsList() {
    return document.querySelector('#news-list');
  },
  get announcementDetail() {
    return document.querySelector('#announcement-detail');
  },
  get newsDetail() {
    return document.querySelector('#news-detail');
  },
  get announcementEmptyState() {
    return document.querySelector('#announcement-empty-state');
  },
  get newsEmptyState() {
    return document.querySelector('#news-empty-state');
  },
  get newAnnouncementBtn() {
    return document.querySelector('#new-announcement-btn');
  },
  get newNewsBtn() {
    return document.querySelector('#new-news-btn');
  },
  get announcementFormSection() {
    return document.querySelector('#announcement-form-section');
  },
  get newsFormSection() {
    return document.querySelector('#news-form-section');
  },
  get announcementForm() {
    return document.querySelector('#announcement-form');
  },
  get newsForm() {
    return document.querySelector('#news-form');
  },
  get cancelAnnouncementBtn() {
    return document.querySelector('#cancel-announcement-btn');
  },
  get cancelNewsBtn() {
    return document.querySelector('#cancel-news-btn');
  },
  get announcementTitleInput() {
    return document.querySelector('#announcement-title');
  },
  get newsTitleInput() {
    return document.querySelector('#news-title');
  },
  get announcementBodyInput() {
    return document.querySelector('#announcement-body');
  },
  get newsCategoryInput() {
    return document.querySelector('#news-category');
  },
  get newsSummaryInput() {
    return document.querySelector('#news-summary');
  },
  get newsBodyInput() {
    return document.querySelector('#news-body');
  },
  get announcementPinnedInput() {
    return document.querySelector('#announcement-pinned');
  },
  get newsFeaturedInput() {
    return document.querySelector('#news-featured');
  },
  get announcementTitleError() {
    return document.querySelector('#announcement-title-error');
  },
  get newsTitleError() {
    return document.querySelector('#news-title-error');
  },
  get announcementBodyError() {
    return document.querySelector('#announcement-body-error');
  },
  get newsSummaryError() {
    return document.querySelector('#news-summary-error');
  },
  get newsBodyError() {
    return document.querySelector('#news-body-error');
  },
  get announcementFormStatus() {
    return document.querySelector('#announcement-form-status');
  },
  get newsFormStatus() {
    return document.querySelector('#news-form-status');
  },
  get announcementFormError() {
    return document.querySelector('#announcement-form-error');
  },
  get newsFormError() {
    return document.querySelector('#news-form-error');
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
  get newsView() {
    return document.querySelector('#news-view');
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
