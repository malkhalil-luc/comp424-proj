import {
  cancelTicketBtn,
  newTicketBtn,
  newTicketForm,
  ticketList,
  ticketSearchInput,
  titleInput,
  titleError,
  descriptionInput,
  descriptionError,
  formStatus,
  formError,
} from '../dom.js';
import { createTicket, persistTickets } from '../data/tickets-data.js';

function clearFormFeedback() {
  titleError.textContent = '';
  descriptionError.textContent = '';
  formStatus.textContent = '';
  formError.textContent = '';

  titleInput.classList.remove('invalid');
  descriptionInput.classList.remove('invalid');
  titleInput.setAttribute('aria-invalid', 'false');
  descriptionInput.setAttribute('aria-invalid', 'false');
}

function clearForm() {
  newTicketForm.reset();
  clearFormFeedback();
}

export function bindSupportEvents(state, render) {
  ticketList.addEventListener('click', (event) => {
    const btn = event.target.closest('.ticket-item');
    if (!btn) return;

    const clickedId = btn.dataset.id;

    if (state.selectedTicketId === clickedId) {
      state.selectedTicketId = null;
    } else {
      state.selectedTicketId = clickedId;
    }

    render();
  });

  ticketSearchInput.addEventListener('input', () => {
    state.ticketQuery = ticketSearchInput.value;
    render();
  });

  newTicketBtn.addEventListener('click', () => {
    state.showNewTicketForm = true;
    render();
    titleInput.focus();
  });

  cancelTicketBtn.addEventListener('click', () => {
    state.showNewTicketForm = false;
    clearForm();
    render();
  });

  newTicketForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormFeedback();

    let isValid = true;

    if (titleInput.value.trim() === '') {
      titleError.textContent = 'Title is required.';
      titleInput.classList.add('invalid');
      titleInput.setAttribute('aria-invalid', 'true');
      isValid = false;
    }

    if (descriptionInput.value.trim() === '') {
      descriptionError.textContent = 'Description is required.';
      descriptionInput.classList.add('invalid');
      descriptionInput.setAttribute('aria-invalid', 'true');
      isValid = false;
    }

    if (!isValid) return;

    const newTicket = {
      id: '',
      title: titleInput.value.trim(),
      description: descriptionInput.value.trim(),
      ticketStatus: 'Open',
      createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    };

    const result = await createTicket(newTicket);
    const savedTicket = result.ticket;

    if (result.savedLocallyOnly) {
      formStatus.textContent = 'Ticket saved locally. Firebase is unavailable.';
    } else {
      formStatus.textContent = 'Ticket submitted successfully.';
    }

    state.tickets.unshift(savedTicket);
    state.selectedTicketId = savedTicket.id;
    persistTickets(state.tickets);

    setTimeout(() => {
      state.showNewTicketForm = false;
      clearForm();
      render();
    }, 1500);
  });
}
