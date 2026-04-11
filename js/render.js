import {
  emptyState,
  loadErrorBanner,
  loadErrorMessage,
  newTicketFormSection,
  retryLoadBtn,
  searchBarContainer,
  shell,
  staleDataBanner,
  ticketDetail,
  ticketList,
} from './dom.js'
import { SearchBar } from './components/search-bar.js';
import { renderTicketDetail, renderTicketList } from './render/support-render.js';

export function render(state, handlers) {
  SearchBar(searchBarContainer, {
    query: state.query,
    onInput: handlers.onSearchInput,
    onClear: handlers.onSearchClear,
  });

  loadErrorBanner.hidden = state.error === '';
  loadErrorMessage.textContent = state.error;
  retryLoadBtn.onclick = handlers.onRetryLoad;

  staleDataBanner.hidden = state.staleNotice === '';
  staleDataBanner.textContent = state.staleNotice;

  newTicketFormSection.hidden = state.isLoading || !state.showNewTicketForm;
  shell.classList.toggle('detail-view-active', Boolean(state.selectedId));


  if (state.isLoading) {
    loadErrorBanner.hidden = true;
    staleDataBanner.hidden = true;
    emptyState.hidden = true;

    ticketList.classList.add('is-loading');
    ticketList.textContent = '';

    const loadingItem = document.createElement('li');
    loadingItem.textContent = 'Loading tickets...';
    ticketList.append(loadingItem);

    ticketDetail.innerHTML = '';
    const loadingDetail = document.createElement('p');
    loadingDetail.className = 'detail-placeholder';
    loadingDetail.textContent = 'Loading details...';
    ticketDetail.append(loadingDetail);
    return;
  }

  ticketList.classList.remove('is-loading');

  if (state.error && state.tickets.length === 0) {
    emptyState.hidden = true;
    ticketList.textContent = '';

    ticketDetail.innerHTML = '';
    const placeholder = document.createElement('p');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Retry loading to continue.';
    ticketDetail.append(placeholder);
    return;
  }

  renderTicketList(state);
  renderTicketDetail(state, handlers.onBackFromDetail);
}
