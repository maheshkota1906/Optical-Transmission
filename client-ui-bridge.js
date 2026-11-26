(() => {
  'use strict';
  const EMBED_URL = 'hcia-transmission-vr-lab.html?embed=1&app=home';
  const TW = 1280, TH = 800, UPDATE_MS = 66;

  window.addEventListener('DOMContentLoaded', function () {
    const app = window.app;
    if (!app || !app.camera || !app.renderer || !window.THREE) return;
    const T = window.THREE;

    const iframe = document.createElement('iframe');
    iframe.title = 'HCIA Transmission client interface';
    iframe.tabIndex = -1;
    Object.assign(iframe.style, {
      position: 'fixed', left: '0', top: '0', width: '1600px', height: '1000px',
      border: '0', opacity: '0', pointerEvents: 'none', zIndex: '-1'
    });
    iframe.src = EMBED_URL;
    document.body.appendChild(iframe);

    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = TW; textureCanvas.height = TH;
    const textureContext = textureCanvas.getContext('2d', { alpha: false });
    const texture = new T.CanvasTexture(textureCanvas);
    texture.encoding = T.sRGBEncoding;
    texture.minFilter = T.LinearFilter;
    texture.magFilter = T.LinearFilter;
    texture.generateMipmaps = false;

    const frame = new T.Mesh(
      new T.PlaneGeometry(1.43, 0.895),
      new T.MeshBasicMaterial({ color: 0x06183a, toneMapped: false, side: T.DoubleSide, depthTest: false, depthWrite: false })
    );
    frame.position.z = -0.012; frame.renderOrder = 9998;
    const screen = new T.Mesh(
      new T.PlaneGeometry(1.38, 0.8625),
      new T.MeshBasicMaterial({ map: texture, toneMapped: false, side: T.DoubleSide, depthTest: false, depthWrite: false })
    );
    screen.position.z = 0.008; screen.renderOrder = 9999;
    const root = new T.Group();
    root.name = 'HCIA_Client_Floating_UI';
    root.position.set(0, -0.025, -1.52);
    root.add(frame, screen);
    root.visible = false;
    app.camera.add(root);

    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.textContent = 'Open HCIA Lab UI'; toggle.hidden = true;
    toggle.style.cssText = 'position:fixed;right:18px;top:82px;z-index:65;padding:10px 15px;border:1px solid rgba(92,205,245,.55);border-radius:10px;background:rgba(5,28,55,.94);color:#eafaff;font:700 12px Inter,Arial,sans-serif;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.28)';
    document.body.appendChild(toggle);

    let sourceCanvas = null, connected = false, panelEnabled = true;
    let lastFrame = 0, attempts = 0, panelDown = false, suppressClick = false, pointerInside = false;

    function setVisible(on) {
      panelEnabled = !!on;
      root.visible = panelEnabled && app.currentState === 'explore';
      toggle.textContent = root.visible ? 'Hide HCIA Lab UI' : 'Open HCIA Lab UI';
      toggle.setAttribute('aria-pressed', String(root.visible));
      if (root.visible && app.pointerControls && app.pointerControls.isLocked) app.pointerControls.unlock();
    }
    toggle.addEventListener('click', function () { setVisible(!root.visible); });

    if (app.pointerControls && app.pointerControls.lock) {
      const oldLock = app.pointerControls.lock.bind(app.pointerControls);
      app.pointerControls.lock = function () { if (!root.visible) oldLock(); };
    }

    const oldState = app.setAppState.bind(app);
    app.setAppState = function (nextState) {
      const result = oldState.apply(app, arguments);
      const exploring = nextState === 'explore';
      toggle.hidden = !exploring;
      if (exploring) setVisible(panelEnabled);
      else { root.visible = false; toggle.textContent = 'Open HCIA Lab UI'; }
      return result;
    };

    function connect() {
      if (connected) return;
      try {
        const doc = iframe.contentDocument;
        const sim = iframe.contentWindow && iframe.contentWindow.__sim;
        const c = doc && doc.querySelector('#ws2d canvas');
        if (!sim || !c || c.width < 2 || c.height < 2) {
          if (++attempts < 300) setTimeout(connect, 100);
          return;
        }
        c.toDataURL('image/png');
        sourceCanvas = c; connected = true;
        console.info('[HCIA UI] Client canvas connected to the floating room panel.');
        if (app.currentState === 'explore') { toggle.hidden = false; setVisible(panelEnabled); }
      } catch (err) {
        console.error('[HCIA UI] Client canvas access failed; both pages must share the same origin.', err);
      }
    }
    iframe.addEventListener('load', function () { setTimeout(connect, 100); });
    setTimeout(connect, 250);

    function hitPanel(event) {
      if (!root.visible || !connected) return null;
      const bounds = app.renderer.domElement.getBoundingClientRect();
      const locked = app.pointerControls && app.pointerControls.isLocked;
      const x = locked ? 0 : ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      const y = locked ? 0 : -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      const ray = new T.Raycaster();
      app.camera.updateMatrixWorld(true);
      ray.setFromCamera(new T.Vector2(x, y), app.camera);
      return ray.intersectObject(screen, false)[0] || null;
    }

    function send(type, hit) {
      if (!sourceCanvas || !hit || !hit.uv) return;
      const w = iframe.contentWindow, r = sourceCanvas.getBoundingClientRect();
      const x = r.left + hit.uv.x * r.width, y = r.top + (1 - hit.uv.y) * r.height;
      const base = { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 };
      if (type === 'move') {
        sourceCanvas.dispatchEvent(new w.PointerEvent('pointermove', Object.assign({}, base, { pointerId: 1, pointerType: 'mouse', isPrimary: true, buttons: 0 })));
      } else if (type === 'click') {
        sourceCanvas.dispatchEvent(new w.MouseEvent('click', base));
        try { w.focus(); } catch (_) {}
      } else if (type === 'leave') {
        sourceCanvas.dispatchEvent(new w.PointerEvent('pointerleave', Object.assign({}, base, { pointerId: 1, pointerType: 'mouse', isPrimary: true })));
      }
    }

    const canvas = app.renderer.domElement;
    window.addEventListener('pointermove', function (e) {
      if (!root.visible || e.target !== canvas) return;
      const h = hitPanel(e);
      if (h) {
        pointerInside = true; send('move', h); canvas.style.cursor = 'pointer';
        if (e.buttons === 0) e.stopImmediatePropagation();
      } else if (pointerInside) {
        pointerInside = false; send('leave'); canvas.style.cursor = '';
      }
    }, true);

    window.addEventListener('pointerdown', function (e) {
      if (!root.visible || e.target !== canvas || e.button !== 0) return;
      const h = hitPanel(e); if (!h) return;
      panelDown = true; send('move', h);
      e.preventDefault(); e.stopImmediatePropagation();
    }, true);

    window.addEventListener('pointerup', function (e) {
      if (!panelDown) return;
      const h = hitPanel(e);
      if (h) { send('move', h); send('click', h); } else send('leave');
      panelDown = false; suppressClick = true;
      e.preventDefault(); e.stopImmediatePropagation();
    }, true);

    canvas.addEventListener('click', function (e) {
      if (!suppressClick) return;
      suppressClick = false; e.preventDefault(); e.stopImmediatePropagation();
    }, true);

    function animateTexture(now) {
      if (root.visible && connected && sourceCanvas && now - lastFrame >= UPDATE_MS) {
        try {
          textureContext.drawImage(sourceCanvas, 0, 0, TW, TH);
          texture.needsUpdate = true; lastFrame = now;
        } catch (err) { console.warn('[HCIA UI] Texture refresh failed:', err); }
      }
      requestAnimationFrame(animateTexture);
    }
    requestAnimationFrame(animateTexture);

    window.__hciaFloatingUI = {
      get visible() { return root.visible; },
      get connected() { return connected; },
      show: function () { setVisible(true); },
      hide: function () { setVisible(false); }
    };
  });
})();