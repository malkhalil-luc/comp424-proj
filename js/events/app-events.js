import {
  appShell,
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
}
