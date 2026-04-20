// Component: SearchBar
// Input: { query, onInput, onClear, inputId?, labelText?, placeholder?, summaryText? }
// Output: DOM nodes mounted inside `container`
// Events: onInput(value), onClear()
// Dependencies: lib/dom-builder.js

import { el } from '../lib/dom-builder.js';

export function SearchBar(container, {
  query,
  onInput,
  onClear,
  inputId = 'search-input',
  labelText = 'Search',
  placeholder = 'Type to filter...',
  summaryText = '',
}) {
  const activeEl = document.activeElement;
  const hadFocus = activeEl?.id === inputId;
  const selectionStart = hadFocus ? activeEl.selectionStart ?? query.length : null;
  const selectionEnd = hadFocus ? activeEl.selectionEnd ?? query.length : null;

  const label = el('label', {
    className: 'sr-only',
    htmlFor: inputId,
    textContent: labelText,
  });

  const input = el('input', {
    id: inputId,
    type: 'search',
    placeholder,
    autocomplete: 'off',
    value: query,
    'aria-label': labelText,
  });
  input.addEventListener('input', (event) => {
    onInput(event.target.value);
  });

  const clearBtn = el('button', {
    type: 'button',
    className: 'search-clear-btn',
    textContent: 'Clear',
    disabled: query.trim() === '',
  });
  clearBtn.addEventListener('click', () => {
    onClear();
  });

  const children = [label, input, clearBtn];
  if (summaryText) {
    children.push(
      el('p', {
        className: 'search-summary',
        role: 'status',
        textContent: summaryText,
      })
    );
  }

  const wrapper = el('div', { className: 'search-bar' }, children);
  container.replaceChildren(wrapper);

  if (hadFocus) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  }
}
