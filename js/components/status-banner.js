// Component: StatusBanner
// Input: { isLoading, error, staleMessage, loadingMessage? }
// Output: DOM nodes mounted inside `container` (may be empty)
// Events: onRetry() when error block is shown
// Dependencies: lib/dom-builder.js

import { el } from '../lib/dom-builder.js';

export function StatusBanner(container, {
  isLoading,
  error,
  staleMessage,
  loadingMessage = 'Loading…',
}, { onRetry }) {
  container.replaceChildren();

  if (isLoading) {
    container.append(
      el('div', { className: 'data-status data-status--loading', role: 'status' }, [
        el('span', {
          className: 'data-status-spinner',
          'aria-hidden': 'true',
        }),
        el('p', { textContent: loadingMessage }),
      ])
    );
    return;
  }

  if (error) {
    const retryBtn = el('button', {
      type: 'button',
      className: 'data-status-retry',
      textContent: 'Try Again',
    });
    retryBtn.addEventListener('click', () => {
      onRetry();
    });
    container.append(
      el('div', { className: 'data-status data-status--error', role: 'alert' }, [
        el('p', { textContent: error }),
        retryBtn,
      ])
    );
  }

  if (staleMessage) {
    container.append(
      el('div', { className: 'data-status data-status--stale', role: 'status' }, [
        el('p', { textContent: staleMessage }),
      ])
    );
  }
}
