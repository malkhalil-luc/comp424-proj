// Component: FilterChips
// Input: { chips, activeValue, onChange, ariaLabel }
// Output: DOM nodes mounted inside `container`
// Events: onChange(value)
// Dependencies: lib/dom-builder.js

import { el } from '../lib/dom-builder.js';

export function FilterChips(container, { chips, activeValue, onChange, ariaLabel }) {
  const buttons = chips.map((chip) => {
    const button = el('button', {
      type: 'button',
      className: chip.value === activeValue ? 'filter-chip is-active' : 'filter-chip',
      textContent: chip.label,
    });
    button.addEventListener('click', () => {
      onChange(chip.value);
    });
    return button;
  });

  const wrapper = el('div', {
    className: 'filter-chip-group',
    role: 'group',
    'aria-label': ariaLabel,
  }, buttons);

  container.replaceChildren(wrapper);
}
