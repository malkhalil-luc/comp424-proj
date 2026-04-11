import {
  loadErrorBanner,
  loadErrorMessage,
  navLinks,
  newTicketFormSection,
  shell,
  ticketDetail,
  ticketList,
  emptyState,
} from '../dom.js';
import { renderTicketDetail, renderTicketList } from './support-render.js';

function renderPlaceholderSection(title, description) {
  ticketList.innerHTML = '';
  ticketDetail.innerHTML = '';

  newTicketFormSection.hidden = true;
  loadErrorBanner.hidden = true;
  emptyState.hidden = true;

  ticketList.innerHTML = `
    <li>
      <div class="ticket-item">
        <p class="ticket-item-title">${title}</p>
        <p>${description}</p>
      </div>
    </li>
  `;

  ticketDetail.innerHTML = `
    <div class="ticket-detail-content">
      <div class="ticket-detail-header">
        <h3 class="ticket-detail-title">${title}</h3>
      </div>
      <p class="ticket-detail-description">${description}</p>
    </div>
  `;
}

export function renderApp(state, handlers) {
  navLinks.forEach(link => {
    const isActive = link.dataset.route === state.route;
    link.classList.toggle('nav-link--active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  if (state.route !== 'support') {
    shell.classList.remove('detail-view-active');

    switch (state.route) {
      case 'dashboard':
        renderPlaceholderSection(
          'Dashboard',
          'Overview widgets, weather, and quick actions will live here.'
        );
        return;
      case 'news':
        renderPlaceholderSection(
          'News',
          'Company and department news will appear here.'
        );
        return;
      case 'announcements':
        renderPlaceholderSection(
          'Announcements',
          'Important internal announcements will appear here.'
        );
        return;
      case 'directory':
        renderPlaceholderSection(
          'Directory',
          'Employee and department directory content will appear here.'
        );
        return;
      case 'calendar':
        renderPlaceholderSection(
          'Calendar',
          'Upcoming events, meetings, and deadlines will appear here.'
        );
        return;
      default:
        renderPlaceholderSection(
          'Section',
          'This section will be implemented soon.'
        );
        return;
    }
  }

  loadErrorBanner.hidden = !state.loadError;
  if (state.loadError) {
    loadErrorMessage.textContent =
      'Could not load tickets. Showing default data if available.';
  }

  newTicketFormSection.hidden = !state.showNewTicketForm;
  shell.classList.toggle('detail-view-active', Boolean(state.selectedTicketId));

  renderTicketList(state);
  renderTicketDetail(state, handlers.onBackFromDetail);
}
