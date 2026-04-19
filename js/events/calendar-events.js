import { dom } from '../dom.js';

export function bindCalendarEvents(state, render) {
  dom.calendarList.addEventListener('click', (event) => {
    const button = event.target.closest('.calendar-item');
    if (!button) {
      return;
    }

    state.selectedEventId = button.dataset.id;
    render();
  });
}
