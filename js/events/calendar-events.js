import { dom } from '../dom.js';
import { getCurrentUser, getSelectedEvent } from '../state.js';
import { removeEvent, saveEvent } from '../api.js';
import {
  clearFieldValidation,
  validateTextField,
} from '../lib/form-validation.js';

function clearEventFeedback() {
  dom.eventFormStatus.textContent = '';
  dom.eventFormError.textContent = '';
  clearFieldValidation(dom.eventTitleInput, dom.eventTitleError);
  clearFieldValidation(dom.eventStartsAtInput, dom.eventStartsAtError);
  clearFieldValidation(dom.eventLocationInput, dom.eventLocationError);
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

    const hasValidTitle = validateTextField(dom.eventTitleInput, dom.eventTitleError, {
      label: 'Title',
      minLength: 4,
    });
    const hasValidLocation = validateTextField(dom.eventLocationInput, dom.eventLocationError, {
      label: 'Location',
      minLength: 2,
    });
    const hasStartsAt = startsAt !== '';

    if (!hasStartsAt) {
      dom.eventStartsAtError.textContent = 'Start date and time are required.';
      dom.eventStartsAtInput.classList.add('invalid');
      dom.eventStartsAtInput.setAttribute('aria-invalid', 'true');
    } else {
      clearFieldValidation(dom.eventStartsAtInput, dom.eventStartsAtError);
    }

    if (!hasValidTitle || !hasValidLocation || !hasStartsAt) {
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
