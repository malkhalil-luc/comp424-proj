import { dom } from '../dom.js';
import { getCurrentUser, getSelectedNewsArticle } from '../state.js';
import { removeNewsArticle, saveNewsArticle } from '../api.js';
import {
  clearFieldValidation,
  validateTextField,
} from '../lib/form-validation.js';

function clearNewsFeedback() {
  dom.newsFormStatus.textContent = '';
  dom.newsFormError.textContent = '';
  clearFieldValidation(dom.newsTitleInput, dom.newsTitleError);
  clearFieldValidation(dom.newsSummaryInput, dom.newsSummaryError);
  clearFieldValidation(dom.newsBodyInput, dom.newsBodyError);
}

function clearNewsForm(state) {
  dom.newsForm.reset();
  dom.newsFeaturedInput.checked = false;
  state.showNewsForm = false;
  state.editingNewsId = null;
  clearNewsFeedback();
}

function replaceNewsInState(state, savedArticle, previousId = savedArticle.id) {
  const existingIndex = state.newsArticles.findIndex((article) => article.id === previousId);

  if (existingIndex >= 0) {
    state.newsArticles.splice(existingIndex, 1, savedArticle);
  } else {
    state.newsArticles.unshift(savedArticle);
  }

  if (savedArticle.isFeatured) {
    state.newsArticles = state.newsArticles.map((article) =>
      article.id === savedArticle.id
        ? savedArticle
        : { ...article, isFeatured: false }
    );
  }

  state.selectedNewsId = savedArticle.id;
}

export function bindNewsEvents(state, render) {
  dom.newsList.addEventListener('click', (event) => {
    const button = event.target.closest('.news-item');
    if (!button) {
      return;
    }

    state.selectedNewsId = state.selectedNewsId === button.dataset.id
      ? null
      : button.dataset.id;
    render();
  });

  dom.newNewsBtn.addEventListener('click', () => {
    state.showNewsForm = true;
    state.editingNewsId = null;
    clearNewsFeedback();
    dom.newsForm.reset();
    dom.newsFeaturedInput.checked = false;
    render();
    dom.newsTitleInput.focus();
  });

  dom.cancelNewsBtn.addEventListener('click', () => {
    clearNewsForm(state);
    render();
  });

  dom.newsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNewsFeedback();

    const title = dom.newsTitleInput.value.trim();
    const summary = dom.newsSummaryInput.value.trim();
    const body = dom.newsBodyInput.value.trim();

    const isValid = [
      validateTextField(dom.newsTitleInput, dom.newsTitleError, {
        label: 'Title',
        minLength: 4,
      }),
      validateTextField(dom.newsSummaryInput, dom.newsSummaryError, {
        label: 'Summary',
        minLength: 10,
      }),
      validateTextField(dom.newsBodyInput, dom.newsBodyError, {
        label: 'Body',
        minLength: 20,
        minLengthMessage: 'Body must be at least 20 characters.',
      }),
    ].every(Boolean);

    if (!isValid) {
      return;
    }

    const editingArticle = state.editingNewsId
      ? state.newsArticles.find((article) => article.id === state.editingNewsId) ?? null
      : null;
    const isEditing = Boolean(editingArticle);

    try {
      const savedArticle = await saveNewsArticle({
        id: isEditing ? editingArticle.id : `news-local-${Date.now()}`,
        title,
        category: dom.newsCategoryInput.value,
        summary,
        body,
        isFeatured: dom.newsFeaturedInput.checked,
        publishedAt: isEditing ? editingArticle.publishedAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      replaceNewsInState(
        state,
        savedArticle,
        isEditing ? editingArticle.id : savedArticle.id
      );

      dom.newsFormStatus.textContent = isEditing
        ? 'News article updated.'
        : 'News article published.';

      setTimeout(() => {
        clearNewsForm(state);
        render();
      }, 900);
    } catch (error) {
      dom.newsFormError.textContent = 'News article could not be saved. Please try again.';
    }
  });

  dom.newsDetail.addEventListener('click', async (event) => {
    const selectedArticle = getSelectedNewsArticle();
    const currentUser = getCurrentUser();

    if (!selectedArticle || currentUser?.role !== 'admin') {
      return;
    }

    if (event.target.closest('#edit-news-btn')) {
      state.showNewsForm = true;
      state.editingNewsId = selectedArticle.id;
      render();
      dom.newsTitleInput.focus();
      return;
    }

    if (event.target.closest('#delete-news-btn')) {
      try {
        await removeNewsArticle(selectedArticle.id);
        state.newsArticles = state.newsArticles.filter((article) => article.id !== selectedArticle.id);
        state.selectedNewsId = state.newsArticles[0]?.id ?? null;
        render();
      } catch (error) {
        dom.newsFormError.textContent = 'News article could not be deleted. Please try again.';
      }
    }
  });
}
