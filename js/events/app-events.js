import {
  appShell,
  dismissLoadErrorBtn,
  navLinks,
  sidebarBackdrop,
  sidebarToggle,
} from '../dom.js';

export function bindAppEvents(state, render) {
  sidebarToggle.addEventListener('click', () => {
    const isMobile = window.innerWidth < 600;

    if (isMobile) {
      const isOpen = appShell.classList.toggle('sidebar-open');
      sidebarToggle.setAttribute('aria-expanded', String(isOpen));
    } else {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      appShell.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
      sidebarToggle.setAttribute('aria-expanded', String(!state.sidebarCollapsed));
    }
  });

  sidebarBackdrop.addEventListener('click', () => {
    appShell.classList.remove('sidebar-open');
    sidebarToggle.setAttribute('aria-expanded', 'false');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      state.route = link.dataset.route;
      render();
    });
  });

  dismissLoadErrorBtn.addEventListener('click', () => {
    state.loadError = false;
    render();
  });
}
