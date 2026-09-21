import { encodeInput, decodeInput, cleanWeirdJSON } from '../services/encoder.service.js';
import { imageBufferToBase64, base64ToImageBuffer, resizeImageBuffer, convertImageBuffer } from '../services/image.service.js';
import { convertFileBuffer } from '../services/file.service.js';
import { convertMediaBuffer } from '../services/media.service.js';

export async function handleEncoder(req, res) {
  try {
    const { input = '', type = 'base64', action = 'encode' } = req.body;
    let result = '';

    if (action === 'encode') {
      result = encodeInput(input, type);
    } else if (action === 'decode') {
      result = decodeInput(input, type);
    } else if (action === 'format') {
      result = cleanWeirdJSON(input);
    } else {
      return res.status(400).json({ success: false, message: 'Acción no soportada' });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
}

export async function handleImageBase64(req, res) {
  try {
    if (req.file) {
      const mimeType = req.file.mimetype || 'image/png';
      const base64 = imageBufferToBase64(req.file.buffer, mimeType);
      return res.json({ success: true, base64 });
    }

    const { base64 } = req.body;
    if (base64) {
      const { buffer, mimeType } = base64ToImageBuffer(base64);
      const dataUrl = imageBufferToBase64(buffer, mimeType);
      return res.json({ success: true, base64: dataUrl });
    }

    res.status(400).json({ success: false, message: 'No se envió ninguna imagen o Base64' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleImageResize(req, res) {
  try {
    let inputBuffer;
    let originalMime = 'image/png';

    if (req.file) {
      inputBuffer = req.file.buffer;
      originalMime = req.file.mimetype;
    } else if (req.body.base64) {
      const parsed = base64ToImageBuffer(req.body.base64);
      inputBuffer = parsed.buffer;
      originalMime = parsed.mimeType;
    } else {
      return res.status(400).json({ success: false, message: 'Se requiere una imagen para redimensionar' });
    }

    const { width, height, format = 'png', quality = 0.9, lockRatio = true } = req.body;

    const result = await resizeImageBuffer(inputBuffer, {
      width,
      height,
      format,
      quality,
      lockRatio: lockRatio === 'true' || lockRatio === true,
    });

    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="resized.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleFileConvert(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Archivo no proporcionado' });
    }

    const { targetFormat } = req.body;
    if (!targetFormat) {
      return res.status(400).json({ success: false, message: 'Formato destino no especificado' });
    }

    const result = await convertFileBuffer(req.file.buffer, req.file.originalname, targetFormat);

    const baseName = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || 'converted';
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_converted.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleImageConvert(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Imagen no proporcionada' });
    }

    const { targetFormat = 'png', quality = 0.9 } = req.body;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    const result = await convertImageBuffer(req.file.buffer, ext, {
      targetFormat,
      quality: parseFloat(quality),
    });

    const baseName = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || 'converted';
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_converted.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleVideoConvert(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Video no proporcionado' });
    }

    const { targetFormat = 'mp4', speed = 1.0 } = req.body;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    const result = await convertMediaBuffer(req.file.buffer, ext, targetFormat, { speed });

    const baseName = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || 'converted';
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_converted.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function handleAudioConvert(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio no proporcionado' });
    }

    const { targetFormat = 'mp3' } = req.body;
    const ext = req.file.originalname.split('.').pop().toLowerCase();

    const result = await convertMediaBuffer(req.file.buffer, ext, targetFormat);

    const baseName = req.file.originalname.substring(0, req.file.originalname.lastIndexOf('.')) || 'converted';
    res.setHeader('Content-Type', result.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_converted.${result.ext}"`);
    res.send(result.buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * Proxy controller to allow responsive iframe previews of external URLs,
 * stripping X-Frame-Options and Content-Security-Policy headers, enabling touch/drag emulation,
 * and proxying sub-resources.
 */
/**
 * Helper to process proxied HTML: strips framing blocks, injects custom theme,
 * bulletproof scrollbar suppression, navigation link proxying, and touch/drag emulation.
 */
export function processProxiedHtml({ html, cleanUrl, effectiveOrigin, colorScheme = 'light', scrollbar = 'hidden' }) {
  // 1. Remove meta CSP or XFO tags that could block iframes
  let processed = html.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
  processed = processed.replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '');

  // 2. Generate theme CSS
  const themeCss = colorScheme === 'dark'
    ? ':root, html { color-scheme: dark !important; }'
    : ':root, html { color-scheme: light !important; }';

  // 3. Scrollbar style generation (hidden by default like real mobile devices, thin 4px, or default)
  let scrollbarCss = '';
  if (scrollbar === 'hidden') {
    scrollbarCss = `
      /* Invisible native mobile scrollbar with 100% true mobile viewport proportions */
      html, body, * {
        scrollbar-width: none !important;
        -ms-overflow-style: none !important;
      }
      html::-webkit-scrollbar,
      body::-webkit-scrollbar,
      ::-webkit-scrollbar,
      *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        max-width: 0 !important;
        max-height: 0 !important;
        background: transparent !important;
        opacity: 0 !important;
        visibility: hidden !important;
        border: none !important;
        outline: none !important;
      }
      ::-webkit-scrollbar-track,
      *::-webkit-scrollbar-track,
      ::-webkit-scrollbar-track-piece,
      *::-webkit-scrollbar-track-piece,
      ::-webkit-scrollbar-thumb,
      *::-webkit-scrollbar-thumb,
      ::-webkit-scrollbar-corner,
      *::-webkit-scrollbar-corner,
      ::-webkit-scrollbar-button,
      *::-webkit-scrollbar-button {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
        background: transparent !important;
        opacity: 0 !important;
        visibility: hidden !important;
        border: none !important;
        outline: none !important;
      }
    `;
  } else if (scrollbar === 'thin') {
    scrollbarCss = `
      /* Ultra-thin 4px mobile scrollbar */
      ::-webkit-scrollbar,
      *::-webkit-scrollbar {
        width: 4px !important;
        height: 4px !important;
      }
      ::-webkit-scrollbar-track,
      *::-webkit-scrollbar-track {
        background: transparent !important;
      }
      ::-webkit-scrollbar-thumb,
      *::-webkit-scrollbar-thumb {
        background: rgba(148, 163, 184, 0.5) !important;
        border-radius: 9999px !important;
      }
      ::-webkit-scrollbar-thumb:hover,
      *::-webkit-scrollbar-thumb:hover {
        background: rgba(100, 116, 139, 0.8) !important;
      }
      html, body, * {
        scrollbar-width: thin !important;
        scrollbar-color: rgba(148, 163, 184, 0.5) transparent !important;
      }
    `;
  }

  const interceptorScript = `
    <meta name="color-scheme" content="${colorScheme}">
    <style id="qa-proxy-theme">
      ${themeCss}
      ${scrollbarCss}
      /* Touch screen emulation: disable blue text selection when swiping/dragging */
      html.qa-touch-active,
      html.qa-touch-active * {
        -webkit-touch-callout: none !important;
        -webkit-user-select: none !important;
        user-select: none !important;
        cursor: grabbing !important;
      }
      /* Keep text selection enabled inside editable inputs */
      html.qa-touch-active input,
      html.qa-touch-active textarea {
        -webkit-user-select: text !important;
        user-select: text !important;
        cursor: text !important;
      }
    </style>
    <script>
      (function() {
        window.__qaTargetOrigin = "${effectiveOrigin}";
        window.__qaCurrentUrl = "${cleanUrl}";
        window.__qaScrollbarMode = "${scrollbar}";
        window.__qaColorScheme = "${colorScheme}";

        // 1. Dynamic style application helper
        function updateScrollbarStyles(mode) {
          window.__qaScrollbarMode = mode;
          var styleEl = document.getElementById('qa-proxy-theme');
          if (!styleEl) return;

          var hiddenRules = 'html, body, * { scrollbar-width: none !important; -ms-overflow-style: none !important; }' +
            'html::-webkit-scrollbar, body::-webkit-scrollbar, ::-webkit-scrollbar, *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; max-width: 0 !important; max-height: 0 !important; background: transparent !important; opacity: 0 !important; visibility: hidden !important; border: none !important; }' +
            '::-webkit-scrollbar-track, *::-webkit-scrollbar-track, ::-webkit-scrollbar-track-piece, *::-webkit-scrollbar-track-piece, ::-webkit-scrollbar-thumb, *::-webkit-scrollbar-thumb, ::-webkit-scrollbar-corner, *::-webkit-scrollbar-corner, ::-webkit-scrollbar-button, *::-webkit-scrollbar-button { display: none !important; width: 0 !important; height: 0 !important; background: transparent !important; opacity: 0 !important; visibility: hidden !important; border: none !important; }';

          var thinRules = '::-webkit-scrollbar, *::-webkit-scrollbar { width: 4px !important; height: 4px !important; }' +
            '::-webkit-scrollbar-track, *::-webkit-scrollbar-track { background: transparent !important; }' +
            '::-webkit-scrollbar-thumb, *::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.5) !important; border-radius: 9999px !important; }' +
            '::-webkit-scrollbar-thumb:hover, *::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.8) !important; }' +
            'html, body, * { scrollbar-width: thin !important; scrollbar-color: rgba(148, 163, 184, 0.5) transparent !important; }';

          var themeCss = window.__qaColorScheme === 'dark'
            ? ':root, html { color-scheme: dark !important; }'
            : ':root, html { color-scheme: light !important; }';

          var activeScroll = mode === 'hidden' ? hiddenRules : mode === 'thin' ? thinRules : '';
          styleEl.textContent = themeCss + '\\n' + activeScroll;
        }

        // 2. Theme configuration
        function applyTheme(theme) {
          window.__qaColorScheme = theme;
          try {
            if (theme === 'dark') {
              document.documentElement.classList.add('dark');
              document.documentElement.setAttribute('data-theme', 'dark');
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.setAttribute('data-theme', 'light');
            }
          } catch(e) {}
          updateScrollbarStyles(window.__qaScrollbarMode);
        }
        applyTheme(window.__qaColorScheme);

        // 3. Ensure style tag stays at the end of <head> against dynamic SPA styling
        try {
          var styleEl = document.getElementById('qa-proxy-theme');
          if (styleEl && document.head) {
            var observer = new MutationObserver(function() {
              if (document.head.lastElementChild !== styleEl) {
                document.head.appendChild(styleEl);
              }
            });
            observer.observe(document.head, { childList: true });
          }
        } catch(e) {}

        // 4. Enable Mobile Touch Capability detection without overriding native events
        try {
          if (!('ontouchstart' in window)) {
            window.ontouchstart = null;
            document.ontouchstart = null;
          }
          if (!navigator.maxTouchPoints || navigator.maxTouchPoints === 0) {
            Object.defineProperty(navigator, 'maxTouchPoints', { get: function() { return 5; }, configurable: true });
          }
        } catch(e) {}

        // 5. Notify parent simulator of navigation (initial, history, or hash changes)
        function notifyNavigated(targetUrl) {
          try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({
                type: 'QA_NAVIGATED',
                url: targetUrl || window.location.href,
                targetOrigin: window.__qaTargetOrigin,
              }, '*');
            }
          } catch(e) {}
        }

        // Notify parent on page load
        notifyNavigated(window.__qaCurrentUrl || window.location.href);

        // Intercept client-side routing (SPAs)
        try {
          var origPushState = history.pushState;
          history.pushState = function() {
            var res = origPushState.apply(this, arguments);
            var stateUrl = arguments[2];
            if (stateUrl) {
              try {
                var full = new URL(stateUrl, window.location.href).href;
                notifyNavigated(full);
              } catch(err) {
                notifyNavigated(stateUrl);
              }
            }
            return res;
          };

          var origReplaceState = history.replaceState;
          history.replaceState = function() {
            var res = origReplaceState.apply(this, arguments);
            var stateUrl = arguments[2];
            if (stateUrl) {
              try {
                var full = new URL(stateUrl, window.location.href).href;
                notifyNavigated(full);
              } catch(err) {
                notifyNavigated(stateUrl);
              }
            }
            return res;
          };

          window.addEventListener('popstate', function() {
            notifyNavigated(window.location.href);
          });
          window.addEventListener('hashchange', function() {
            notifyNavigated(window.location.href);
          });
        } catch(e) {}

        // 6. Real-time postMessage listener from parent simulator
        window.addEventListener('message', function(event) {
          if (!event.data || typeof event.data !== 'object') return;
          if (event.data.type === 'QA_UPDATE_SETTINGS') {
            if (event.data.scrollbarMode) {
              updateScrollbarStyles(event.data.scrollbarMode);
            }
            if (event.data.simulatedTheme) {
              applyTheme(event.data.simulatedTheme);
            }
          }
        });

        // 7. INTERCEPT NAVIGATION LINKS & REDIRECT THROUGH PROXY
        document.addEventListener('click', function(e) {
          var a = e.target && e.target.closest ? e.target.closest('a') : null;
          if (!a) return;

          var rawHref = a.getAttribute('href');
          if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
            return;
          }

          if (a.target === '_top' || a.target === '_parent' || a.target === '_blank') {
            a.target = '_self';
          }

          try {
            var targetOrigin = window.__qaTargetOrigin;
            var proxyOrigin = window.location.origin;
            var resolved = new URL(a.href, window.location.href);

            // If navigating within the target origin or current origin
            if (resolved.origin === targetOrigin || resolved.origin === proxyOrigin) {
              if (resolved.pathname.startsWith('/api/tools/proxy-frame')) {
                return; // Already a proxy url
              }

              e.preventDefault();
              e.stopPropagation();

              var finalRemoteUrl = resolved.href;
              if (resolved.origin === proxyOrigin && targetOrigin) {
                finalRemoteUrl = targetOrigin + resolved.pathname + resolved.search + resolved.hash;
              }

              var proxyUrl = '/api/tools/proxy-frame?url=' + encodeURIComponent(finalRemoteUrl) +
                '&colorScheme=' + encodeURIComponent(window.__qaColorScheme || 'light') +
                '&scrollbar=' + encodeURIComponent(window.__qaScrollbarMode || 'hidden');

              window.location.href = proxyUrl;
            }
          } catch(err) {}
        }, true);

        // 8. Intercept window.open
        try {
          var origOpen = window.open;
          window.open = function(url, target, features) {
            if (url && typeof url === 'string') {
              try {
                var resolved = new URL(url, window.location.href);
                if (resolved.origin === window.__qaTargetOrigin || resolved.origin === window.location.origin) {
                  var finalUrl = resolved.origin === window.location.origin && window.__qaTargetOrigin
                    ? window.__qaTargetOrigin + resolved.pathname + resolved.search + resolved.hash
                    : resolved.href;
                  var proxyUrl = '/api/tools/proxy-frame?url=' + encodeURIComponent(finalUrl) +
                    '&colorScheme=' + encodeURIComponent(window.__qaColorScheme || 'light') +
                    '&scrollbar=' + encodeURIComponent(window.__qaScrollbarMode || 'hidden');
                  window.location.href = proxyUrl;
                  return window;
                }
              } catch(e) {}
            }
            return origOpen.apply(this, arguments);
          };
        } catch(e) {}

        // 9. TOUCH-SCREEN DRAG-TO-SCROLL & SWIPE ENGINE
        var isMouseDown = false;
        var isDragging = false;
        var didDrag = false;
        var startX = 0;
        var startY = 0;
        var lastX = 0;
        var lastTime = 0;
        var velocityX = 0;
        var scrollContainer = null;
        var scrollStartLeft = 0;
        var origScrollBehavior = '';
        var origScrollSnap = '';
        var momentumRaf = null;

        function isTextInput(el) {
          if (!el) return false;
          var tag = el.tagName ? el.tagName.toLowerCase() : '';
          return tag === 'input' || tag === 'textarea' || el.isContentEditable;
        }

        function isInteractiveButton(el) {
          if (!el) return false;
          var tag = el.tagName ? el.tagName.toLowerCase() : '';
          if (tag === 'button' || tag === 'select') return true;
          if (el.closest && (el.closest('button') || el.closest('[role="button"]') || el.closest('[aria-controls]'))) return true;
          return false;
        }

        function findHorizontalContainer(el) {
          var curr = el;
          while (curr && curr !== document.body && curr !== document.documentElement) {
            try {
              var style = window.getComputedStyle(curr);
              var ox = style.overflowX;
              var canScroll = (ox === 'auto' || ox === 'scroll' || ox === 'overlay');
              if (canScroll && curr.scrollWidth > curr.clientWidth + 2) {
                return curr;
              }
            } catch(e) {}
            curr = curr.parentElement;
          }
          if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 2) {
            return document.documentElement;
          }
          if (document.body.scrollWidth > document.body.clientWidth + 2) {
            return document.body;
          }
          return null;
        }

        function cancelMomentum() {
          if (momentumRaf) {
            cancelAnimationFrame(momentumRaf);
            momentumRaf = null;
          }
        }

        window.addEventListener('selectstart', function(e) {
          if (isTextInput(e.target)) return;
          if (isMouseDown || isDragging) {
            e.preventDefault();
            return false;
          }
        }, true);

        window.addEventListener('mousedown', function(e) {
          if (e.button !== 0) return;
          if (isTextInput(e.target)) return;

          cancelMomentum();

          isMouseDown = true;
          isDragging = false;
          didDrag = false;
          startX = e.clientX;
          startY = e.clientY;
          lastX = e.clientX;
          lastTime = performance.now();
          velocityX = 0;

          if (window.getSelection) {
            try { window.getSelection().removeAllRanges(); } catch(err) {}
          }

          if (!isInteractiveButton(e.target)) {
            scrollContainer = findHorizontalContainer(e.target);
            if (scrollContainer) {
              scrollStartLeft = scrollContainer.scrollLeft;
            }
          } else {
            scrollContainer = null;
          }
        }, true);

        window.addEventListener('mousemove', function(e) {
          if (!isMouseDown) return;

          var dx = e.clientX - startX;
          var dy = e.clientY - startY;
          var absDx = Math.abs(dx);
          var absDy = Math.abs(dy);

          if (!isDragging && absDx > 3) {
            if (!scrollContainer) {
              scrollContainer = findHorizontalContainer(e.target);
              if (scrollContainer) {
                scrollStartLeft = scrollContainer.scrollLeft;
              }
            }

            if (scrollContainer) {
              isDragging = true;
              didDrag = true;
              document.documentElement.classList.add('qa-touch-active');

              origScrollBehavior = scrollContainer.style.scrollBehavior;
              origScrollSnap = scrollContainer.style.scrollSnapType;
              scrollContainer.style.scrollBehavior = 'auto';
              scrollContainer.style.scrollSnapType = 'none';
            }
          }

          if (isDragging && scrollContainer) {
            var now = performance.now();
            var dt = Math.max(1, now - lastTime);
            var stepDx = e.clientX - lastX;
            velocityX = stepDx / dt;
            lastX = e.clientX;
            lastTime = now;

            scrollContainer.scrollLeft = scrollStartLeft - dx;

            if (window.getSelection) {
              try { window.getSelection().removeAllRanges(); } catch(err) {}
            }
          }
        }, true);

        window.addEventListener('mouseup', function(e) {
          if (!isMouseDown) return;
          isMouseDown = false;

          if (isDragging && scrollContainer) {
            document.documentElement.classList.remove('qa-touch-active');

            var target = scrollContainer;
            var snap = origScrollSnap;
            var behavior = origScrollBehavior;

            if (Math.abs(velocityX) > 0.15) {
              var v = velocityX * 15;
              function glide() {
                if (Math.abs(v) > 0.4) {
                  target.scrollLeft -= v;
                  v *= 0.92;
                  momentumRaf = requestAnimationFrame(glide);
                } else {
                  target.style.scrollBehavior = behavior;
                  target.style.scrollSnapType = snap;
                }
              }
              momentumRaf = requestAnimationFrame(glide);
            } else {
              target.style.scrollBehavior = behavior;
              target.style.scrollSnapType = snap;
            }
          }

          isDragging = false;
          scrollContainer = null;
        }, true);

        window.addEventListener('click', function(e) {
          if (didDrag) {
            e.stopPropagation();
            e.preventDefault();
            didDrag = false;
          }
        }, true);

      })();
    </script>
  `;

  // Place interceptor at the very bottom of <head> to guarantee cascade precedence over site stylesheets
  if (/<\/head>/i.test(processed)) {
    processed = processed.replace(/<\/head>/i, `${interceptorScript}\n</head>`);
  } else if (/<\/body>/i.test(processed)) {
    processed = processed.replace(/<\/body>/i, `${interceptorScript}\n</body>`);
  } else {
    processed = processed + '\n' + interceptorScript;
  }

  return processed;
}

/**
 * Controller to proxy web pages inside an iframe, bypassing X-Frame-Options/CSP
 * and proxying sub-resources.
 */
export async function handleProxyFrame(req, res) {
  try {
    const { url, colorScheme = 'light', scrollbar = 'hidden' } = req.query;
    if (!url) {
      return res.status(400).send('Parámetro url es requerido');
    }

    const cleanUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `https://${url}`;

    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1 Chrome/124.0.0.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || 'text/html';

    // Remove framing restrictions
    res.removeHeader('X-Frame-Options');
    res.removeHeader('x-frame-options');
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('content-security-policy');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "frame-ancestors *");
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Target origin for sub-resources fallback proxy
    const effectiveUrl = new URL(response.url || cleanUrl);
    const effectiveOrigin = effectiveUrl.origin;
    global.__lastProxiedOrigin = effectiveOrigin;
    global.__lastProxiedSettings = {
      origin: effectiveOrigin,
      colorScheme,
      scrollbar,
      url: cleanUrl,
    };

    if (contentType.includes('text/html')) {
      const html = await response.text();
      const processedHtml = processProxiedHtml({
        html,
        cleanUrl,
        effectiveOrigin,
        colorScheme,
        scrollbar,
      });

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(processedHtml);
    } else {
      const buffer = Buffer.from(await response.arrayBuffer());
      res.setHeader('Content-Type', contentType);
      return res.send(buffer);
    }
  } catch (err) {
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; background: #0f172a; color: #f8fafc; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .error-card { background: #1e293b; padding: 2rem; border-radius: 12px; max-width: 500px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
          h2 { color: #f87171; margin-top: 0; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="error-card">
          <h2>No se pudo cargar la URL en el proxy</h2>
          <p>\${err.message}</p>
          <p>Verifica que la URL sea válida y accesible desde tu red local o internet.</p>
        </div>
      </body>
      </html>
    `);
  }
}


