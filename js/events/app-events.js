import { dom } from '../dom.js';

export function bindAppEvents(state, render) {
  dom.navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const section = event.currentTarget.dataset.section;
      if (!section) {
        return;
      }

      event.preventDefault();
      state.activeSection = section;

      if (window.innerWidth < 600) {
        dom.appShell.classList.remove('sidebar-open');
        dom.sidebarToggle.setAttribute('aria-expanded', 'false');
      }

      render();
    });
  });

  dom.sidebarToggle.addEventListener('click', () => {
    const isMobile = window.innerWidth < 600;

    if (isMobile) {
      const isOpen = dom.appShell.classList.toggle('sidebar-open');
      dom.sidebarToggle.setAttribute('aria-expanded', String(isOpen));
    } else {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      dom.appShell.classList.toggle('sidebar-collapsed', state.sidebarCollapsed);
      dom.sidebarToggle.setAttribute('aria-expanded', String(!state.sidebarCollapsed));
    }
  });

  dom.sidebarBackdrop.addEventListener('click', () => {
    dom.appShell.classList.remove('sidebar-open');
    dom.sidebarToggle.setAttribute('aria-expanded', 'false');
  });
}
