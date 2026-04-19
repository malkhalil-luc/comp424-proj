// Component: LoginPanel
// Input: { users, selectedUserId, onChange, onLogin }
// Output: DOM nodes mounted inside `container`
// Events: onChange(userId), onLogin()
// Dependencies: none

export function LoginPanel(container, { users, selectedUserId, onChange, onLogin }) {
  const title = document.createElement('h2');
  title.className = 'login-panel-title';
  title.textContent = 'Sign in to the portal';

  const subtitle = document.createElement('p');
  subtitle.className = 'login-panel-subtitle';
  subtitle.textContent = 'Choose a demo account to continue as Admin or Staff.';

  const label = document.createElement('label');
  label.className = 'field';

  const caption = document.createElement('span');
  caption.textContent = 'Demo account';

  const select = document.createElement('select');
  select.name = 'userId';
  select.value = selectedUserId ?? '';
  select.addEventListener('change', (event) => {
    onChange(event.target.value);
  });

  users.forEach((user) => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.name} (${user.role})`;
    select.append(option);
  });

  label.append(caption, select);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'ticket-action-btn ticket-action-btn--primary';
  button.textContent = 'Sign In';
  button.addEventListener('click', () => {
    onLogin();
  });

  const card = document.createElement('section');
  card.className = 'login-panel';
  card.append(title, subtitle, label, button);

  container.replaceChildren(card);
}
