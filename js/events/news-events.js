import { dom } from '../dom.js';
import { getCurrentUser, getSelectedNewsArticle } from '../state.js';
import { removeNewsArticle, saveNewsArticle } from '../api.js';

function clearNewsFeedback() {
  dom.newsTitleError.textContent = '';
  dom.newsSummaryError.textContent = '';
  dom.newsBodyError.textContent = '';
  dom.newsFormStatus.textContent = '';
  dom.newsFormError.textContent = '';
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

    state.selectedNewsId = button.dataset.id;
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

    if (title === '') {
      dom.newsTitleError.textContent = 'Title is required.';
      return;
    }

    if (summary === '') {
      dom.newsSummaryError.textContent = 'Summary is required.';
      return;
    }

    if (body === '') {
      dom.newsBodyError.textContent = 'Body is required.';
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
