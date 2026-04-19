// Component: FilterChips
// Input: { chips, activeValue, onChange, ariaLabel }
// Output: DOM nodes mounted inside `container`
// Events: onChange(value)
// Dependencies: none

export function FilterChips(container, { chips, activeValue, onChange, ariaLabel }) {
  const buttons = chips.map((chip) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = chip.value === activeValue ? 'filter-chip is-active' : 'filter-chip';
    button.textContent = chip.label;
    button.addEventListener('click', () => {
      onChange(chip.value);
    });
    return button;
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'filter-chip-group';
  wrapper.setAttribute('role', 'group');
  wrapper.setAttribute('aria-label', ariaLabel);
  wrapper.append(...buttons);

  container.replaceChildren(wrapper);
}
