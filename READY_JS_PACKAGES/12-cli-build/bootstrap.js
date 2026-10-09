/* PasevSU canonical-origin bootstrap v2.1.1 */
(() => {
  'use strict';
  const canonical = new URL('http://127.0.0.1:3000/');
  const here = window.location;
  const isCanonical = here.protocol === canonical.protocol && here.hostname === canonical.hostname && (here.port || '80') === (canonical.port || '80');
  if (!isCanonical) {
    const target = new URL(canonical.href);
    target.searchParams.set('redirected', '1');
    target.hash = here.hash || '';
    window.location.replace(target.href);
  }
})();
