import { dom } from '../dom.js';
import {
  getCurrentUser,
  getSelectedNewsArticle,
  getVisibleNews,
} from '../state.js';

function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return '(invalid date)';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function renderNewsList(state) {
  const visibleNews = getVisibleNews();

  if (visibleNews.length === 0) {
    state.selectedNewsId = null;
  } else if (!visibleNews.some((article) => article.id === state.selectedNewsId)) {
    state.selectedNewsId = visibleNews[0].id;
  }

  dom.newsList.textContent = '';
  dom.newsEmptyState.hidden = visibleNews.length > 0;
  dom.newsEmptyState.textContent = state.newsQuery.trim() === ''
    ? 'No news articles available.'
    : 'No news articles match your search.';

  visibleNews.forEach((article) => {
    const item = document.createElement('li');

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'news-item';
    button.dataset.id = article.id;

    if (article.id === state.selectedNewsId) {
      button.classList.add('is-selected');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.setAttribute('aria-pressed', 'false');
    }

    const title = document.createElement('p');
    title.className = 'news-item-title';
    title.textContent = article.title;

    const meta = document.createElement('div');
    meta.className = 'news-item-meta';

    const category = document.createElement('span');
    category.className = 'news-category-badge';
    category.textContent = article.category;

    meta.append(category);

    if (article.isFeatured) {
      const featured = document.createElement('span');
      featured.className = 'announcement-badge';
      featured.textContent = 'Featured';
      meta.append(featured);
    }

    const date = document.createElement('span');
    date.textContent = formatDateTime(article.publishedAt);
    meta.append(date);

    const summary = document.createElement('p');
    summary.className = 'dashboard-card-body';
    summary.textContent = article.summary;

    button.append(title, meta, summary);
    item.append(button);
    dom.newsList.append(item);
  });
}

export function renderNewsDetail(onBack) {
  const article = getSelectedNewsArticle();
  const currentUser = getCurrentUser();

  dom.newsDetail.innerHTML = '';

  if (!article) {
    const placeholder = document.createElement('p');
    placeholder.className = 'detail-placeholder';
    placeholder.textContent = 'Select a news article to view details.';
    dom.newsDetail.append(placeholder);
    return;
  }

  const content = document.createElement('div');
  content.className = 'ticket-detail-content';

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.id = 'news-back-btn';
  backBtn.textContent = '← Back';
  backBtn.addEventListener('click', onBack);

  const header = document.createElement('div');
  header.className = 'ticket-detail-header';

  const title = document.createElement('h3');
  title.className = 'ticket-detail-title';
  title.textContent = article.title;

  const meta = document.createElement('div');
  meta.className = 'ticket-detail-meta';

  const category = document.createElement('span');
  category.className = 'news-category-badge';
  category.textContent = article.category;
  meta.append(category);

  if (article.isFeatured) {
    const featured = document.createElement('span');
    featured.className = 'announcement-badge';
    featured.textContent = 'Featured';
    meta.append(featured);
  }

  const published = document.createElement('span');
  published.textContent = `Published ${formatDateTime(article.publishedAt)}`;
  meta.append(published);

  header.append(title, meta);

  const summary = document.createElement('p');
  summary.className = 'ticket-note';
  summary.textContent = article.summary;

  const body = document.createElement('p');
  body.className = 'ticket-detail-description';
  body.textContent = article.body;

  content.append(backBtn, header, summary, body);

  if (currentUser?.role === 'admin') {
    const actions = document.createElement('div');
    actions.className = 'announcement-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.id = 'edit-news-btn';
    editBtn.className = 'ticket-action-btn';
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.id = 'delete-news-btn';
    deleteBtn.className = 'ticket-action-btn';
    deleteBtn.textContent = 'Delete';

    actions.append(editBtn, deleteBtn);
    content.append(actions);
  }

  dom.newsDetail.append(content);
}
