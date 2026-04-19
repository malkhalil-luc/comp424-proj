import { dom } from '../dom.js';
import { removeAnnouncement, saveAnnouncement } from '../api.js';
import { getCurrentUser, getSelectedAnnouncement } from '../state.js';

function clearAnnouncementFeedback() {
  dom.announcementTitleError.textContent = '';
  dom.announcementBodyError.textContent = '';
  dom.announcementFormStatus.textContent = '';
  dom.announcementFormError.textContent = '';
}

function clearAnnouncementForm(state) {
  dom.announcementForm.reset();
  dom.announcementPinnedInput.checked = false;
  state.showAnnouncementForm = false;
  state.editingAnnouncementId = null;
  clearAnnouncementFeedback();
}

function replaceAnnouncementInState(state, savedAnnouncement, previousId = savedAnnouncement.id) {
  const existingIndex = state.announcements.findIndex((announcement) => announcement.id === previousId);

  if (existingIndex >= 0) {
    state.announcements.splice(existingIndex, 1, savedAnnouncement);
  } else {
    state.announcements.unshift(savedAnnouncement);
  }

  if (savedAnnouncement.isPinned) {
    state.announcements = state.announcements.map((announcement) =>
      announcement.id === savedAnnouncement.id
        ? savedAnnouncement
        : { ...announcement, isPinned: false }
    );
  }

  state.selectedAnnouncementId = savedAnnouncement.id;
}

export function bindAnnouncementsEvents(state, render) {
  dom.announcementList.addEventListener('click', (event) => {
    const button = event.target.closest('.announcement-item');
    if (!button) {
      return;
    }

    state.selectedAnnouncementId = button.dataset.id;
    render();
  });

  dom.newAnnouncementBtn.addEventListener('click', () => {
    state.showAnnouncementForm = true;
    state.editingAnnouncementId = null;
    clearAnnouncementFeedback();
    dom.announcementForm.reset();
    dom.announcementPinnedInput.checked = false;
    render();
    dom.announcementTitleInput.focus();
  });

  dom.cancelAnnouncementBtn.addEventListener('click', () => {
    clearAnnouncementForm(state);
    render();
  });

  dom.announcementForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAnnouncementFeedback();

    const title = dom.announcementTitleInput.value.trim();
    const body = dom.announcementBodyInput.value.trim();

    if (title === '') {
      dom.announcementTitleError.textContent = 'Title is required.';
      return;
    }

    if (body === '') {
      dom.announcementBodyError.textContent = 'Message is required.';
      return;
    }

    const editingAnnouncement = state.editingAnnouncementId
      ? state.announcements.find((announcement) => announcement.id === state.editingAnnouncementId) ?? null
      : null;
    const isEditing = Boolean(editingAnnouncement);
    try {
      const savedAnnouncement = await saveAnnouncement({
        id: isEditing ? editingAnnouncement.id : `ann-local-${Date.now()}`,
        title,
        body,
        isPinned: dom.announcementPinnedInput.checked,
        publishedAt: isEditing ? editingAnnouncement.publishedAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      replaceAnnouncementInState(
        state,
        savedAnnouncement,
        isEditing ? editingAnnouncement.id : savedAnnouncement.id
      );

      dom.announcementFormStatus.textContent = isEditing
        ? 'Announcement updated.'
        : 'Announcement published.';

      setTimeout(() => {
        clearAnnouncementForm(state);
        render();
      }, 900);
    } catch (error) {
      dom.announcementFormError.textContent = 'Announcement could not be saved. Please try again.';
    }
  });

  dom.announcementDetail.addEventListener('click', async (event) => {
    const selectedAnnouncement = getSelectedAnnouncement();
    const currentUser = getCurrentUser();

    if (!selectedAnnouncement || currentUser?.role !== 'admin') {
      return;
    }

    if (event.target.closest('#edit-announcement-btn')) {
      state.showAnnouncementForm = true;
      state.editingAnnouncementId = selectedAnnouncement.id;
      dom.announcementTitleInput.value = selectedAnnouncement.title;
      dom.announcementBodyInput.value = selectedAnnouncement.body;
      dom.announcementPinnedInput.checked = selectedAnnouncement.isPinned;
      render();
      dom.announcementTitleInput.focus();
      return;
    }

    if (event.target.closest('#delete-announcement-btn')) {
      try {
        await removeAnnouncement(selectedAnnouncement.id);
        state.announcements = state.announcements.filter(
          (announcement) => announcement.id !== selectedAnnouncement.id
        );
        state.selectedAnnouncementId = state.announcements[0]?.id ?? null;
        render();
      } catch (error) {
        dom.announcementFormError.textContent = 'Announcement could not be deleted. Please try again.';
      }
    }
  });
}
