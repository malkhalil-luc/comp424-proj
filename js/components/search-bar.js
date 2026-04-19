// Component: SearchBar
// Input: { query, onInput, onClear, inputId?, labelText?, placeholder? }
// Output: DOM nodes mounted inside `container`
// Events: onInput(value), onClear()
// Dependencies: none

export function SearchBar(container, {
  query,
  onInput,
  onClear,
  inputId = 'search-input',
  labelText = 'Search',
  placeholder = 'Type to filter...',
}) {
  const activeEl = document.activeElement;
  const hadFocus = activeEl?.id === inputId;
  const selectionStart = hadFocus ? activeEl.selectionStart ?? query.length : null;
  const selectionEnd = hadFocus ? activeEl.selectionEnd ?? query.length : null;

  const label = document.createElement('label');
  label.className = 'sr-only';
  label.setAttribute('for', inputId);
  label.textContent = labelText;

  const input = document.createElement('input');
  input.id = inputId;
  input.type = 'search';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  input.value = query;
  input.setAttribute('aria-label', labelText);
  input.addEventListener('input', (event) => {
    onInput(event.target.value);
  });

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'search-clear-btn';
  clearBtn.textContent = 'Clear';
  clearBtn.disabled = query.trim() === '';
  clearBtn.addEventListener('click', () => {
    onClear();
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'search-bar';
  wrapper.append(label, input, clearBtn);

  container.replaceChildren(wrapper);

  if (hadFocus) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  }
}
