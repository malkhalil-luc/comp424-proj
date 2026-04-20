// Component: LoginPanel
// Input: { users, selectedUserId, onChange, onLogin }
// Output: DOM nodes mounted inside `container`
// Events: onChange(userId), onLogin()
// Dependencies: lib/dom-builder.js

import { el } from '../lib/dom-builder.js';

export function LoginPanel(container, { users, selectedUserId, onChange, onLogin }) {
  const options = users.map((user) =>
    el('option', {
      value: user.id,
      textContent: `${user.name} (${user.role})`,
    })
  );

  const select = el('select', { name: 'userId' }, options);
  select.addEventListener('change', (event) => {
    onChange(event.target.value);
  });
  select.value = selectedUserId ?? users[0]?.id ?? '';

  const label = el('label', { className: 'field' }, [
    el('span', { textContent: 'Demo account' }),
    select,
  ]);

  const signInBtn = el('button', {
    type: 'button',
    className: 'ticket-action-btn ticket-action-btn--primary',
    textContent: 'Sign In',
  });
  signInBtn.addEventListener('click', () => {
    onLogin();
  });

  const card = el('section', { className: 'login-panel' }, [
    el('h2', { className: 'login-panel-title', textContent: 'Sign in to the portal' }),
    el('p', {
      className: 'login-panel-subtitle',
      textContent: 'Choose a demo account to continue as Admin or Staff.',
    }),
    label,
    signInBtn,
  ]);

  container.replaceChildren(card);
}
