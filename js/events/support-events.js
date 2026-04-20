import { dom } from '../dom.js';
import { createTicket, persistTickets, saveTicketChanges } from '../api.js';
import {
  clearFieldValidation,
  validateTextField,
} from '../lib/form-validation.js';
import {
  canManageTicket,
  canReplyToTicket,
  canReopenTicket,
  getCurrentUser,
  getSelectedTicket,
} from '../state.js';

function clearFormFeedback() {
  dom.formStatus.textContent = '';
  dom.formError.textContent = '';
  clearFieldValidation(dom.titleInput, dom.titleError);
  clearFieldValidation(dom.descriptionInput, dom.descriptionError);
}

function clearForm() {
  dom.newTicketForm.reset();
  dom.priorityInput.value = 'medium';
  clearFormFeedback();
}

function replaceTicketInState(state, nextTicket, previousId = nextTicket.id) {
  state.tickets = state.tickets.map((ticket) =>
    ticket.id === previousId ? nextTicket : ticket
  );
  state.selectedId = nextTicket.id;
  persistTickets(state.tickets);
}

function createReplyMessage(body, currentUser) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    authorId: currentUser.id,
    authorRole: currentUser.role,
    body,
    createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    kind: 'reply',
  };
}

function createTicketMessage(body, currentUser) {
  return {
    ...createReplyMessage(body, currentUser),
    kind: 'ticket',
  };
}

function createStatusNote(body, currentUser) {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    authorId: currentUser.id,
    authorRole: currentUser.role,
    body,
    createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    kind: 'status-note',
  };
}

export function bindSupportEvents(state, render) {
  dom.ticketList.addEventListener('click', (event) => {
    const btn = event.target.closest('.ticket-item');
    if (!btn) return;

    const clickedId = btn.dataset.id;

    if (state.selectedId === clickedId) {
      state.selectedId = null;
    } else {
      state.selectedId = clickedId;
    }

    render();
  });

  dom.ticketSortSelect.addEventListener('change', () => {
    state.sortBy = dom.ticketSortSelect.value;
    render();
  });

  dom.newTicketBtn.addEventListener('click', () => {
    state.showNewTicketForm = true;
    render();
    dom.titleInput.focus();
  });

  dom.cancelTicketBtn.addEventListener('click', () => {
    state.showNewTicketForm = false;
    clearForm();
    render();
  });

  dom.newTicketForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearFormFeedback();

    const isValid = [
      validateTextField(dom.titleInput, dom.titleError, {
        label: 'Title',
        minLength: 4,
      }),
      validateTextField(dom.descriptionInput, dom.descriptionError, {
        label: 'Description',
        minLength: 10,
        minLengthMessage: 'Description must be at least 10 characters.',
      }),
    ].every(Boolean);

    if (!isValid) return;

    const currentUser = getCurrentUser();
    const requesterUserId = currentUser.role === 'admin'
      ? (dom.requesterInput.value || state.users.find((user) => user.role === 'staff')?.id || currentUser.id)
      : currentUser.id;

    const newTicket = {
      id: '',
      title: dom.titleInput.value.trim(),
      description: dom.descriptionInput.value.trim(),
      priority: dom.priorityInput.value,
      ticketStatus: 'Open',
      createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      createdByUserId: requesterUserId,
      assignedAgentId: null,
      closedAt: null,
      messages: [
        {
          ...createTicketMessage(dom.descriptionInput.value.trim(), currentUser),
          authorId: requesterUserId,
          authorRole: 'staff',
        },
      ],
    };

    const result = await createTicket(newTicket);
    const savedTicket = result.ticket;

    if (result.savedLocallyOnly) {
      dom.formStatus.textContent = 'Ticket saved locally. Firebase is unavailable.';
    } else {
      dom.formStatus.textContent = 'Ticket submitted successfully.';
    }

    state.tickets.unshift(savedTicket);
    state.selectedId = savedTicket.id;
    persistTickets(state.tickets);

    setTimeout(() => {
      state.showNewTicketForm = false;
      clearForm();
      render();
    }, 1500);
  });

  dom.ticketDetail.addEventListener('click', async (event) => {
    const reopenBtn = event.target.closest('#reopen-ticket-btn');
    if (!reopenBtn) {
      return;
    }

    const selectedTicket = getSelectedTicket();
    if (!selectedTicket || !canReopenTicket(selectedTicket)) {
      return;
    }

    const currentUser = getCurrentUser();
    const reopenedTicket = {
      ...selectedTicket,
      ticketStatus: 'Open',
      closedAt: null,
      updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      messages: [
        ...selectedTicket.messages,
        createStatusNote('Ticket reopened for follow-up.', currentUser),
      ],
    };

    const result = await saveTicketChanges(reopenedTicket);
    replaceTicketInState(state, result.ticket, selectedTicket.id);
    render();
  });

  dom.ticketDetail.addEventListener('submit', async (event) => {
    if (event.target.id === 'ticket-reply-form') {
      event.preventDefault();

      const selectedTicket = getSelectedTicket();
      if (!selectedTicket || !canReplyToTicket(selectedTicket)) {
        return;
      }

      const formData = new FormData(event.target);
      const replyBody = String(formData.get('replyBody') ?? '').trim();
      if (replyBody === '') {
        return;
      }

      const currentUser = getCurrentUser();
      const updatedTicket = {
        ...selectedTicket,
        updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        messages: [
          ...selectedTicket.messages,
          createReplyMessage(replyBody, currentUser),
        ],
      };

      const result = await saveTicketChanges(updatedTicket);
      replaceTicketInState(state, result.ticket, selectedTicket.id);
      render();
      return;
    }

    if (event.target.id === 'ticket-admin-form') {
      event.preventDefault();

      const selectedTicket = getSelectedTicket();
      if (!selectedTicket || !canManageTicket(selectedTicket)) {
        return;
      }

      const formData = new FormData(event.target);
      const nextStatus = String(formData.get('ticketStatus') ?? selectedTicket.ticketStatus);
      const nextAgentId = String(formData.get('assignedAgentId') ?? '').trim() || null;
      const currentUser = getCurrentUser();
      const notes = [];

      if (nextStatus !== selectedTicket.ticketStatus) {
        notes.push(
          createStatusNote(`Status changed from ${selectedTicket.ticketStatus} to ${nextStatus}.`, currentUser)
        );
      }

      if (nextAgentId !== selectedTicket.assignedAgentId) {
        notes.push(
          createStatusNote(
            nextAgentId
              ? 'Support agent assignment updated.'
              : 'Support agent removed from this ticket.',
            currentUser
          )
        );
      }

      if (notes.length === 0) {
        return;
      }

      const updatedTicket = {
        ...selectedTicket,
        ticketStatus: nextStatus,
        assignedAgentId: nextAgentId,
        closedAt: nextStatus === 'Closed'
          ? new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
          : null,
        updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        messages: [...selectedTicket.messages, ...notes],
      };

      const result = await saveTicketChanges(updatedTicket);
      replaceTicketInState(state, result.ticket, selectedTicket.id);
      render();
    }
  });
}
