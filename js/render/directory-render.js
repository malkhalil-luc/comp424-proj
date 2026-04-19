import { dom } from '../dom.js';
import {
  getSelectedEmployee,
  getVisibleEmployees,
} from '../state.js';

export function renderDirectoryList(state) {
  const visibleEmployees = getVisibleEmployees();

  if (visibleEmployees.length === 0) {
    state.selectedEmployeeId = null;
  } else if (!visibleEmployees.some((employee) => employee.id === state.selectedEmployeeId)) {
    state.selectedEmployeeId = visibleEmployees[0].id;
  }

  dom.directoryList.textContent = '';
  dom.directoryEmptyState.hidden = visibleEmployees.length > 0;
  dom.directoryEmptyState.textContent = state.directoryQuery.trim() === ''
    ? 'No employees available.'
    : 'No employees match your search.';

  visibleEmployees.forEach((employee) => {
    const item = document.createElement('li');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'directory-item';
    button.dataset.id = employee.id;

    if (employee.id === state.selectedEmployeeId) {
      button.classList.add('is-selected');
    }

    const name = document.createElement('p');
    name.className = 'directory-item-title';
    name.textContent = employee.name;

    const meta = document.createElement('div');
    meta.className = 'directory-item-meta';

    const title = document.createElement('span');
    title.textContent = employee.title;

    const department = document.createElement('span');
    department.textContent = employee.department;

    meta.append(title, department);
    button.append(name, meta);
    item.append(button);
    dom.directoryList.append(item);
  });
}

function createMetaRow(labelText, valueText) {
  const row = document.createElement('div');
  row.className = 'ticket-meta-row';

  const label = document.createElement('span');
  label.className = 'ticket-meta-label';
  label.textContent = labelText;

  const value = document.createElement('span');
  value.className = 'ticket-meta-value';
  value.textContent = valueText;

  row.append(label, value);
  return row;
}

export function renderDirectoryDetail() {
  const employee = getSelectedEmployee();
  dom.directoryDetail.innerHTML = '';

  if (!employee) {
    const placeholder = document.createElement('p');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Select an employee to view details.';
    dom.directoryDetail.append(placeholder);
    return;
  }

  const content = document.createElement('div');
  content.className = 'ticket-detail-content';

  const header = document.createElement('div');
  header.className = 'ticket-detail-header';

  const name = document.createElement('h3');
  name.className = 'ticket-detail-title';
  name.textContent = employee.name;

  const meta = document.createElement('div');
  meta.className = 'ticket-detail-meta';
  meta.textContent = `${employee.title} · ${employee.department}`;

  header.append(name, meta);

  const details = document.createElement('div');
  details.className = 'ticket-meta-grid';
  details.append(
    createMetaRow('Email', employee.email),
    createMetaRow('Phone', employee.phone),
    createMetaRow('Office', employee.office),
    createMetaRow('Department', employee.department),
  );

  const bio = document.createElement('p');
  bio.className = 'ticket-detail-description';
  bio.textContent = employee.bio;

  content.append(header, details, bio);
  dom.directoryDetail.append(content);
}
