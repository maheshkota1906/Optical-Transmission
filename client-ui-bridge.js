(() => {
  'use strict';

  const EMBED_URL = 'hcia-transmission-vr-lab.html?embed=1&app=home';

  function boot() {
    let tries = 0;
    const waitForApp = () => {
      const app = window.app;
      if (!app || !app.camera || !app.renderer || !window.THREE) {
        if (++tries < 150) window.setTimeout(waitForApp, 100);
        else console.error('[HCIA UI] Walkthrough app was not ready; floating UI was not initialized.');
        return;
      }
      if (window.__hciaFloatingUI) return;

      // Use a native same-origin iframe panel. This keeps the client UI fully
      // interactive and avoids fragile canvas-texture/pointer-event forwarding.
      const panel = document.createElement('section');
      panel.id = 'hcia-floating-panel';
      panel.setAttribute('aria-label', 'HCIA Transmission interactive interface');
      panel.style.cssText = [
        'position:fixed', 'right:clamp(12px,2vw,30px)', 'top:50%',
        'transform:translateY(-50%)', 'width:min(1080px,88vw)',
        'height:min(720px,82vh)', 'min-width:min(320px,94vw)',
        'min-height:min(320px,70vh)', 'display:none', 'flex-direction:column',
        'overflow:hidden', 'z-index:120', 'border:1px solid rgba(75,190,235,.72)',
        'border-radius:14px', 'background:#06183a',
        'box-shadow:0 18px 60px rgba(0,0,0,.58)'
      ].join(';');

      const bar = document.createElement('div');
      bar.style.cssText = 'height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:space-between;padding:0 12px 0 16px;background:linear-gradient(90deg,#082b4b,#0b4164);color:#eafaff;font:700 12px Inter,Arial,sans-serif;letter-spacing:.04em';
      const heading = document.createElement('span');
      heading.textContent = 'HCIA TRANSMISSION · INTERACTIVE LAB';
      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = '✕  Close';
      close.setAttribute('aria-label', 'Close HCIA interface');
      close.style.cssText = 'border:1px solid rgba(190,230,255,.35);border-radius:7px;background:rgba(2,18,35,.72);color:#fff;padding:6px 10px;font:600 12px Inter,Arial,sans-serif;cursor:pointer';
      bar.append(heading, close);

      const iframe = document.createElement('iframe');
      iframe.title = 'HCIA Transmission interactive lab';
      iframe.src = EMBED_URL;
      iframe.allow = 'clipboard-read; clipboard-write';
      iframe.style.cssText = 'display:block;flex:1 1 auto;width:100%;height:calc(100% - 42px);min-height:0;border:0;background:#06183a';
      panel.append(bar, iframe);
      document.body.appendChild(panel);

      const toggle = document.createElement('button');
      toggle.id = 'hcia-floating-toggle';
      toggle.type = 'button';
      toggle.textContent = 'Show HCIA Lab UI';
      toggle.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.style.cssText = 'position:fixed;right:18px;top:82px;z-index:121;padding:10px 15px;border:1px solid rgba(92,205,245,.65);border-radius:10px;background:rgba(5,28,55,.96);color:#eafaff;font:700 12px Inter,Arial,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.32)';
      document.body.appendChild(toggle);

      let isOpen = false;
      function setOpen(open) {
        isOpen = !!open;
        panel.style.display = isOpen ? 'flex' : 'none';
        toggle.textContent = isOpen ? 'Hide HCIA Lab UI' : 'Show HCIA Lab UI';
        toggle.setAttribute('aria-expanded', String(isOpen));
        if (isOpen && app.pointerControls && app.pointerControls.isLocked) {
          app.pointerControls.unlock();
        }
      }

      toggle.addEventListener('click', () => setOpen(!isOpen));
      close.addEventListener('click', () => setOpen(false));

      const originalSetAppState = app.setAppState.bind(app);
      app.setAppState = function (nextState) {
        const result = originalSetAppState.apply(app, arguments);
        const exploring = nextState === 'explore';
        toggle.hidden = !exploring;
        if (!exploring) setOpen(false);
        return result;
      };

      // Do not let the walkthrough re-lock the mouse while the HCIA panel is open.
      if (app.pointerControls && typeof app.pointerControls.lock === 'function') {
        const originalLock = app.pointerControls.lock.bind(app.pointerControls);
        app.pointerControls.lock = function () {
          if (!isOpen) return originalLock();
        };
      }

      if (app.currentState === 'explore') toggle.hidden = false;

      window.__hciaFloatingUI = {
        get visible() { return isOpen; },
        get connected() { return iframe.contentDocument?.readyState === 'complete'; },
        show: () => { toggle.hidden = false; setOpen(true); },
        hide: () => setOpen(false),
        toggle: () => setOpen(!isOpen),
        iframe
      };

      iframe.addEventListener('load', () => {
        try {
          const style = iframe.contentDocument.createElement('style');
          style.textContent = '#returnAcademy{display:none!important}';
          iframe.contentDocument.head.appendChild(style);
        } catch (error) {
          console.warn('[HCIA UI] Could not apply embedded-page cleanup:', error);
        }
      });
      console.info('[HCIA UI] Native floating client panel initialized.');
    };

    waitForApp();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
