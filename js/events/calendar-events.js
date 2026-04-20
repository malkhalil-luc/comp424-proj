import { dom } from '../dom.js';
import { getCurrentUser, getSelectedEvent } from '../state.js';
import { removeEvent, saveEvent } from '../api.js';

function clearEventFeedback() {
  dom.eventTitleError.textContent = '';
  dom.eventStartsAtError.textContent = '';
  dom.eventLocationError.textContent = '';
  dom.eventFormStatus.textContent = '';
  dom.eventFormError.textContent = '';
  dom.eventTitleInput.classList.remove('invalid');
  dom.eventStartsAtInput.classList.remove('invalid');
  dom.eventLocationInput.classList.remove('invalid');
  dom.eventTitleInput.setAttribute('aria-invalid', 'false');
  dom.eventStartsAtInput.setAttribute('aria-invalid', 'false');
  dom.eventLocationInput.setAttribute('aria-invalid', 'false');
}

function clearEventForm(state) {
  dom.eventForm.reset();
  state.showEventForm = false;
  state.editingEventId = null;
  clearEventFeedback();
}

function replaceEventInState(state, savedEvent, previousId = savedEvent.id) {
  const existingIndex = state.events.findIndex((event) => event.id === previousId);

  if (existingIndex >= 0) {
    state.events.splice(existingIndex, 1, savedEvent);
  } else {
    state.events.push(savedEvent);
  }

  state.selectedEventId = savedEvent.id;
}

export function bindCalendarEvents(state, render) {
  dom.calendarList.addEventListener('click', (event) => {
    const button = event.target.closest('.calendar-item');
    if (!button) {
      return;
    }

    state.selectedEventId = button.dataset.id;
    render();
  });

  dom.newEventBtn.addEventListener('click', () => {
    state.showEventForm = true;
    state.editingEventId = null;
    clearEventFeedback();
    dom.eventForm.reset();
    render();
    dom.eventTitleInput.focus();
  });

  dom.cancelEventBtn.addEventListener('click', () => {
    clearEventForm(state);
    render();
  });

  dom.eventForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearEventFeedback();

    const title = dom.eventTitleInput.value.trim();
    const startsAt = dom.eventStartsAtInput.value.trim();
    const location = dom.eventLocationInput.value.trim();

    let isValid = true;

    if (title === '') {
      dom.eventTitleError.textContent = 'Title is required.';
      dom.eventTitleInput.classList.add('invalid');
      dom.eventTitleInput.setAttribute('aria-invalid', 'true');
      isValid = false;
    }

    if (startsAt === '') {
      dom.eventStartsAtError.textContent = 'Start date and time are required.';
      dom.eventStartsAtInput.classList.add('invalid');
      dom.eventStartsAtInput.setAttribute('aria-invalid', 'true');
      isValid = false;
    }

    if (location === '') {
      dom.eventLocationError.textContent = 'Location is required.';
      dom.eventLocationInput.classList.add('invalid');
      dom.eventLocationInput.setAttribute('aria-invalid', 'true');
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const editingEvent = state.editingEventId
      ? state.events.find((currentEvent) => currentEvent.id === state.editingEventId) ?? null
      : null;
    const isEditing = Boolean(editingEvent);

    try {
      const savedEvent = await saveEvent({
        id: isEditing ? editingEvent.id : `evt-local-${Date.now()}`,
        title,
        eventType: dom.eventTypeInput.value,
        startsAt: new Date(startsAt).toISOString(),
        location,
        organizer: dom.eventOrganizerInput.value.trim() || 'Portal Staff',
        description: dom.eventDescriptionInput.value.trim() || 'No event details were provided.',
      });

      replaceEventInState(
        state,
        savedEvent,
        isEditing ? editingEvent.id : savedEvent.id
      );

      dom.eventFormStatus.textContent = isEditing
        ? 'Event updated.'
        : 'Event created.';

      setTimeout(() => {
        clearEventForm(state);
        render();
      }, 900);
    } catch (error) {
      dom.eventFormError.textContent = 'Event could not be saved. Please try again.';
    }
  });

  dom.calendarDetail.addEventListener('click', async (event) => {
    const currentUser = getCurrentUser();
    const selectedEvent = getSelectedEvent();

    if (!selectedEvent || currentUser?.role !== 'admin') {
      return;
    }

    if (event.target.closest('#edit-event-btn')) {
      state.showEventForm = true;
      state.editingEventId = selectedEvent.id;
      render();
      dom.eventTitleInput.focus();
      return;
    }

    if (event.target.closest('#delete-event-btn')) {
      try {
        await removeEvent(selectedEvent.id);
        state.events = state.events.filter((currentEvent) => currentEvent.id !== selectedEvent.id);
        state.selectedEventId = state.events[0]?.id ?? null;
        render();
      } catch (error) {
        dom.eventFormError.textContent = 'Event could not be deleted. Please try again.';
      }
    }
  });
}
