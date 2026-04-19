import { dom } from '../dom.js';

export function bindDirectoryEvents(state, render) {
  dom.directoryList.addEventListener('click', (event) => {
    const button = event.target.closest('.directory-item');
    if (!button) {
      return;
    }

    state.selectedEmployeeId = button.dataset.id;
    render();
  });
}
