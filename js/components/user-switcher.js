// Component: UserSwitcher
// Input: { users, currentUserId, onChange }
// Output: DOM nodes mounted inside `container`
// Events: onChange(userId)
// Dependencies: none

export function UserSwitcher(container, { users, currentUserId, onChange }) {
  const label = document.createElement('label');
  label.className = 'sr-only';
  label.setAttribute('for', 'user-switcher');
  label.textContent = 'Switch demo user';

  const select = document.createElement('select');
  select.id = 'user-switcher';
  select.className = 'user-switcher-select';
  select.value = currentUserId;
  select.addEventListener('change', (event) => {
    onChange(event.target.value);
  });

  users.forEach((user) => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.name} (${user.role})`;
    select.append(option);
  });

  const caption = document.createElement('span');
  caption.className = 'user-switcher-label';
  caption.textContent = 'View as';

  const wrapper = document.createElement('div');
  wrapper.className = 'user-switcher';
  wrapper.append(caption, label, select);

  container.replaceChildren(wrapper);
}
