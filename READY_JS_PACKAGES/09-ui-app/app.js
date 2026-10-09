/* =====================================================================
 * PasevSU PGP Toolbox — app.js
 * Local-first PGP key manager
 * ===================================================================== */

/* ---------------------------------------------------------------------
 * STATE
 * ------------------------------------------------------------------- */
let keys = [];            // масив от { fingerprint, email, comment, userLabel, publicKey, privateKey, meta, publishHistory, ... }
let lastInspection = null;
let certifiedKeyArmored = null;
let lastSessionKey = null;
let fileQueue = [];
let wotGraph = null;
let emailRecipientState = null; // { email, publicKey, armored, fingerprint, encryptionKeyID, source, expiration, algorithm }
const APP_SCRIPT_URL = document.currentScript?.src || null;
let qrProviderPromise = null;

function ensureQrProvider() {
    if (typeof window.qrcode === 'function' || typeof window.QRCode === 'function') return Promise.resolve(true);
    if (qrProviderPromise) return qrProviderPromise;
    const sources = [];
    if (APP_SCRIPT_URL) sources.push(new URL('../11-runtime-vendor/qrcode.js', APP_SCRIPT_URL).href);
    if (document.baseURI) sources.push(new URL('11-runtime-vendor/qrcode.js', document.baseURI).href);
    const candidates = [...new Set(sources)];
    qrProviderPromise = new Promise(resolve => {
        const loadNext = index => {
            if (index >= candidates.length || !document.head) return resolve(false);
            const script = document.createElement('script');
            script.src = candidates[index];
            script.async = true;
            script.onload = () => {
                if (typeof window.qrcode === 'function' || typeof window.QRCode === 'function') resolve(true);
                else loadNext(index + 1);
            };
            script.onerror = () => { script.remove(); loadNext(index + 1); };
            document.head.appendChild(script);
        };
        loadNext(0);
    });
    return qrProviderPromise;
}

/* ---------------------------------------------------------------------
 * UTILITIES
 * ------------------------------------------------------------------- */
function formatFingerprint(fp) {
    return (fp || '').toString().replace(/\s+/g, '').match(/.{1,4}/g)?.join(' ') ?? '';
}

function getExpirationTime(expirationTime) {
    if (expirationTime === Infinity || !expirationTime) return 'Never Expires';
    try { return new Date(expirationTime).toISOString().split('T')[0]; }
    catch { return 'Never Expires'; }
}

function uiText(text) {
    return window.PasevSUI18n?.translateRuntime?.(String(text)) ?? String(text);
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[ch]));
}
function isArmoredOpenPgpBytes(bytes) {
    const prefix = new TextDecoder('utf-8', { fatal:false }).decode(bytes.subarray(0, Math.min(bytes.length, 96))).trimStart();
    return prefix.startsWith('-----BEGIN PGP ');
}

function announce(id, text) {
    const node = document.getElementById(id);
    if (!node) return;
    const localized = uiText(text);
    node.textContent = '';
    setTimeout(() => (node.textContent = localized), 10);
}

function toast(text, tone = 'neutral') {
    const localized = uiText(text);
    if (tone === 'error') announce('alert', localized);
    else announce('status', localized);
    alert(localized);
}

/* ---------------------------------------------------------------------
 * THEME
 * ------------------------------------------------------------------- */
const htmlEl = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function iconSun() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M20 12h2M2 12h2m14.142 5.657l1.414 1.414M4.444 4.444l1.414 1.414m12.728 0l1.414-1.414M4.444 19.556l1.414-1.414"/></svg>`;
}
function iconMoon() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}

function applyTheme(mode) {
    htmlEl.classList.remove('theme--light', 'theme--dark', 'theme--auto', 'dark');
    const btn = document.getElementById('theme-toggle');
    if (mode === 'dark') {
        htmlEl.classList.add('theme--dark', 'dark');
        themeIcon.innerHTML = iconSun();
        btn?.setAttribute('aria-pressed', 'true');
        localStorage.setItem('pasevsu-pgp-theme', 'dark');
    } else if (mode === 'light') {
        htmlEl.classList.add('theme--light');
        themeIcon.innerHTML = iconMoon();
        btn?.setAttribute('aria-pressed', 'false');
        localStorage.setItem('pasevsu-pgp-theme', 'light');
    } else {
        htmlEl.classList.add('theme--auto');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        themeIcon.innerHTML = prefersDark ? iconSun() : iconMoon();
        btn?.setAttribute('aria-pressed', prefersDark ? 'true' : 'false');
        localStorage.setItem('pasevsu-pgp-theme', 'auto');
    }
}

function initTheme() {
    const saved = (localStorage.getItem('pasevsu-pgp-theme') || localStorage.getItem('pgpbox-theme')) || 'auto';
    applyTheme(saved);
    themeToggle?.addEventListener('click', () => {
        const current = (localStorage.getItem('pasevsu-pgp-theme') || localStorage.getItem('pgpbox-theme')) || 'auto';
        const next = current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
        applyTheme(next);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (((localStorage.getItem('pasevsu-pgp-theme') || localStorage.getItem('pgpbox-theme')) || 'auto') === 'auto') applyTheme('auto');
    });
}

/* ---------------------------------------------------------------------
 * INDEXEDDB STORAGE
 * ------------------------------------------------------------------- */
const DB_NAME = 'pgpbox';
const DB_VERSION = 1;
const STORE_KEYS = 'keys';
const STORE_SETTINGS = 'settings';
const STORE_SNAPSHOTS = 'snapshots';

let dbInstance = null;

function openDb() {
    if (dbInstance) return Promise.resolve(dbInstance);
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_KEYS)) {
                const store = db.createObjectStore(STORE_KEYS, { keyPath: 'fingerprint' });
                store.createIndex('email', 'email', { unique: false });
                store.createIndex('revoked', 'revoked', { unique: false });
            }
            if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
                db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
            }
            if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
                const store = db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id', autoIncrement: true });
                store.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };
        req.onsuccess = () => { dbInstance = req.result; resolve(dbInstance); };
        req.onerror = () => reject(req.error);
    });
}

function tx(storeName, mode, action) {
    return openDb().then(db => new Promise((resolve, reject) => {
        const t = db.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        let result;
        try { result = action(store); }
        catch (e) { reject(e); return; }
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
    }));
}

async function dbGetAllKeys() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const r = db.transaction(STORE_KEYS, 'readonly').objectStore(STORE_KEYS).getAll();
        r.onsuccess = () => resolve(r.result || []);
        r.onerror = () => reject(r.error);
    });
}

async function dbPutKey(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const r = db.transaction(STORE_KEYS, 'readwrite').objectStore(STORE_KEYS).put(key);
        r.onsuccess = () => resolve();
        r.onerror = () => reject(r.error);
    });
}

async function dbDeleteKey(fingerprint) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const r = db.transaction(STORE_KEYS, 'readwrite').objectStore(STORE_KEYS).delete(fingerprint);
        r.onsuccess = () => resolve();
        r.onerror = () => reject(r.error);
    });
}

async function dbClearKeys() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const r = db.transaction(STORE_KEYS, 'readwrite').objectStore(STORE_KEYS).clear();
        r.onsuccess = () => resolve();
        r.onerror = () => reject(r.error);
    });
}

async function dbGetSetting(key, fallback = null) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const r = db.transaction(STORE_SETTINGS, 'readonly').objectStore(STORE_SETTINGS).get(key);
        r.onsuccess = () => resolve(r.result ? r.result.value : fallback);
        r.onerror = () => reject(r.error);
    });
}

async function dbSetSetting(key, value) {
    return tx(STORE_SETTINGS, 'readwrite', store => store.put({ key, value }));
}

async function dbCreateSnapshot(reason) {
    try {
        const snapshot = {
            reason,
            createdAt: new Date().toISOString(),
            payload: keys.map(k => ({ ...k }))
        };
        return tx(STORE_SNAPSHOTS, 'readwrite', store => store.add(snapshot));
    } catch (e) { console.warn('Snapshot failed:', e); }
}

async function dbListSnapshots() {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const r = db.transaction(STORE_SNAPSHOTS, 'readonly').objectStore(STORE_SNAPSHOTS).getAll();
        r.onsuccess = () => resolve((r.result || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
        r.onerror = () => reject(r.error);
    });
}

async function dbPruneSnapshots(maxCount = 20) {
    const all = await dbListSnapshots();
    if (all.length <= maxCount) return;
    const toDelete = all.slice(maxCount);
    const db = await openDb();
    await Promise.all(toDelete.map(s => new Promise((resolve) => {
        const r = db.transaction(STORE_SNAPSHOTS, 'readwrite').objectStore(STORE_SNAPSHOTS).delete(s.id);
        r.onsuccess = resolve;
        r.onerror = resolve;
    })));
}

async function migrateFromLocalStorage() {
    const legacy = localStorage.getItem('pgpKeys');
    if (!legacy) return { migrated: 0 };
    let parsed = [];
    try { parsed = JSON.parse(legacy) || []; }
    catch { return { migrated: 0 }; }
    if (parsed.length === 0) { localStorage.removeItem('pgpKeys'); return { migrated: 0 }; }

    let migrated = 0;
    for (const k of parsed) {
        if (!k.fingerprint) continue;
        await dbPutKey(k);
        migrated++;
    }
    localStorage.removeItem('pgpKeys');
    return { migrated };
}

async function dbReplaceAllKeys(records) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const t = db.transaction(STORE_KEYS, 'readwrite');
        const store = t.objectStore(STORE_KEYS);
        store.clear();
        for (const record of records) store.put(record);
        t.oncomplete = () => resolve();
        t.onerror = () => reject(t.error || new Error('IndexedDB transaction failed.'));
        t.onabort = () => reject(t.error || new Error('IndexedDB transaction aborted.'));
    });
}
async function dbDeleteSetting(key) {
    return tx(STORE_SETTINGS, 'readwrite', store => store.delete(key));
}
async function saveKeysToLocalStorage() {
    await dbReplaceAllKeys(keys);
    await dbPruneSnapshots();
}

async function loadKeysFromLocalStorage() {
    await openDb();
    const migration = await migrateFromLocalStorage();
    if (migration.migrated > 0) console.log(`Migrated ${migration.migrated} keys to IndexedDB.`);
    // v2.1 removes the old duplicate localStorage migration copy because it may
    // contain private-key material and is not needed after a successful migration.
    await dbDeleteSetting('legacyBackup').catch(() => {});
    keys = await dbGetAllKeys();
    keys.sort((a, b) => (a.fingerprint || '').localeCompare(b.fingerprint || ''));
}

/* ---------------------------------------------------------------------
 * SELECTORS REFRESH
 * ------------------------------------------------------------------- */
function refreshKeySelectors() {
    document.querySelectorAll('.keySelector').forEach((select) => {
        const type = select.dataset.type;
        const prevValue = select.value;
        const isMulti = select.multiple;

        if (!isMulti) {
            select.innerHTML = '<option selected disabled value="">— Select PGP Key —</option>';
        } else {
            select.innerHTML = '';
        }

        keys.forEach((key, index) => {
            if (type === 'private' && !key.privateKey) return;
            if (type === 'public' && !key.publicKey) return;

            const opt = document.createElement('option');
            opt.value = index;
            let label = '';
            if (key.email) label += key.email;
            if (key.email && key.comment) label += ' — ';
            if (key.comment) label += key.comment;
            label += ` (${escapeHtml(formatFingerprint(key.fingerprint))})`;
            if (key.revoked) label = '[REVOKED] ' + label;
            opt.textContent = label || formatFingerprint(key.fingerprint);
            select.appendChild(opt);
        });

        if (!isMulti && prevValue && select.querySelector(`option[value="${prevValue}"]`)) {
            select.value = prevValue;
        }
    });

    window.dispatchEvent(new CustomEvent('pasevsu-keys-changed'));
}

/* ---------------------------------------------------------------------
 * KEY LIST RENDER
 * ------------------------------------------------------------------- */
function attachCopyEventListeners() {
    document.querySelectorAll('.copyPublicKeyButton').forEach((button) => {
        button.addEventListener('click', () => copyKey(keys[button.dataset.index].publicKey, false));
    });
    document.querySelectorAll('.copyPrivateKeyButton').forEach((button) => {
        button.addEventListener('click', () => confirmCopyPrivateKey(button.dataset.index));
    });
    document.querySelectorAll('.deleteKeyButton').forEach((button) => {
        button.addEventListener('click', () => deleteKey(Number(button.dataset.index)));
    });
}

function keyMatchesSearch(key, query) {
    if (!query) return true;
    const q = query.toLowerCase().trim();
    const haystack = [
        key.fingerprint || '', key.email || '', key.comment || '',
        key.userLabel || '', (key.meta?.tags || []).join(' '), key.meta?.organization || ''
    ].join(' ').toLowerCase();
    return haystack.includes(q);
}

function keyMatchesFilter(key, filter) {
    const now = Date.now();
    switch (filter) {
        case 'all': return true;
        case 'private': return Boolean(key.privateKey);
        case 'public': return !key.privateKey;
        case 'revoked': return Boolean(key.revoked);
        case 'expired': {
            if (!key.expirationDate || key.expirationDate === 'Never Expires') return false;
            const exp = Date.parse(key.expirationDate);
            return !isNaN(exp) && exp < now;
        }
        case 'expiring': {
            if (!key.expirationDate || key.expirationDate === 'Never Expires') return false;
            const exp = Date.parse(key.expirationDate);
            if (isNaN(exp)) return false;
            const ninetyDays = 90 * 24 * 60 * 60 * 1000;
            return exp > now && exp - now < ninetyDays;
        }
        default: return true;
    }
}

function getFilteredKeys() {
    const q = document.getElementById('keySearchInput')?.value || '';
    const f = document.getElementById('keyFilterSelect')?.value || 'all';
    return keys
        .map((k, i) => ({ key: k, index: i }))
        .filter(({ key }) => keyMatchesSearch(key, q) && keyMatchesFilter(key, f));
}

function refreshKeyList() {
    const keysList = document.getElementById('keysList');
    if (!keysList) return;
    keysList.innerHTML = '';

    const filtered = getFilteredKeys();

    if (filtered.length === 0 && keys.length > 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="7" style="text-align:center;padding:1.5rem;color:var(--muted);">
            No keys match the current filter.</td>`;
        keysList.appendChild(tr);
    }

    filtered.forEach(({ key, index }) => {
        const hasPrivate = Boolean(key.privateKey && key.privateKey.trim());
        const tr = document.createElement('tr');

        const revokedBadge = key.revoked
            ? '<span style="background:#dc2626;color:#fff;font-size:.7rem;padding:.1rem .4rem;border-radius:4px;margin-left:.4rem;">REVOKED</span>'
            : '';

        let expiredBadge = '';
        if (key.expirationDate && key.expirationDate !== 'Never Expires') {
            const exp = Date.parse(key.expirationDate);
            if (!isNaN(exp) && exp < Date.now()) {
                expiredBadge = '<span style="background:#f59e0b;color:#fff;font-size:.7rem;padding:.1rem .4rem;border-radius:4px;margin-left:.4rem;">EXPIRED</span>';
            }
        }

        tr.innerHTML = `
      <td><input type="checkbox" class="row-select" data-index="${index}" /></td>
      <td>${escapeHtml(formatFingerprint(key.fingerprint))}</td>
      <td>${escapeHtml(key.email || '—')}</td>
      <td>${escapeHtml(key.userLabel || '—')}${revokedBadge}</td>
      <td>${escapeHtml(key.expirationDate || '—')}${expiredBadge}</td>
      <td>${escapeHtml(key.comment || '—')}</td>
      <td class="whitespace-nowrap">
        <div class="flex flex-wrap gap-2 items-center">
          <button class="btn btn-muted copyPublicKeyButton" data-index="${index}" type="button">Public</button>
          ${hasPrivate ? `<button class="btn btn-danger copyPrivateKeyButton" data-index="${index}" type="button">Private</button>` : ''}
          <button class="btn btn-danger deleteKeyButton" data-index="${index}" type="button">Delete</button>
        </div>
      </td>
    `;

        keysList.appendChild(tr);
    });

    attachCopyEventListeners();
    refreshKeySelectors();
    refreshBackupInfo();

    document.querySelectorAll('.row-select').forEach(cb => {
        cb.addEventListener('change', updateSelectionInfo);
    });
    updateSelectionInfo();
}

function confirmCopyPrivateKey(index) {
    if (confirm(uiText('Copying private keys is sensitive. Proceed?'))) {
        copyKey(keys[index].privateKey, true);
    }
}

function copyKey(key, isPrivate) {
    navigator.clipboard.writeText(key)
        .then(() => toast(`${isPrivate ? 'Private' : 'Public'} key copied.`))
        .catch(() => toast('Failed to copy.', 'error'));
}

/* ---------------------------------------------------------------------
 * GENERATE KEYS
 * ------------------------------------------------------------------- */
const KEY_SECURITY_PROFILES = {
    'PASEVSU-UNIVERSAL-MAX': { type:'suite', level:'universal-max', classical:'multi-algorithm / up to ~256-bit class', speed:'very slow', compatibility:'adaptive' },
    'RSA-2048': { type:'rsa', rsaBits:2048, level:'legacy', classical:'~112-bit class', speed:'fast', compatibility:'maximum' },
    'RSA-3072': { type:'rsa', rsaBits:3072, level:'strong', classical:'~128-bit class', speed:'moderate', compatibility:'maximum' },
    'RSA-4096': { type:'rsa', rsaBits:4096, level:'high', classical:'>128-bit class', speed:'moderate', compatibility:'very high' },
    'RSA-8192': { type:'rsa', rsaBits:8192, level:'very-high', classical:'~192-bit class', speed:'slow', compatibility:'high' },
    'RSA-16384': { type:'rsa', rsaBits:16384, level:'extreme', classical:'~256-bit class', speed:'very slow', compatibility:'reduced' },
    'ECC-p256': { type:'ecc', curve:'nistP256', level:'strong', classical:'~128-bit class', speed:'very fast', compatibility:'high' },
    'ECC-p384': { type:'ecc', curve:'nistP384', level:'very-high', classical:'~192-bit class', speed:'fast', compatibility:'high' },
    'ECC-p521': { type:'ecc', curve:'nistP521', level:'extreme', classical:'~256-bit class', speed:'fast', compatibility:'high' },
    'ECC-brainpoolP512r1': { type:'ecc', curve:'brainpoolP512r1', level:'extreme', classical:'~256-bit class', speed:'moderate', compatibility:'reduced' }
};

function keySecurityProfileText(keyType) {
    const p = KEY_SECURITY_PROFILES[keyType];
    if (!p) return null;
    const de = window.PasevSUI18n?.language === 'de';
    const names = {
        legacy: de ? 'Kompatibilitätsprofil' : 'Профил за съвместимост',
        strong: de ? 'Stark' : 'Силен',
        high: de ? 'Hoch' : 'Висок',
        'very-high': de ? 'Sehr hoch · schwere Fälle' : 'Много висок · тежки случаи',
        extreme: de ? 'Extrem · Expertenprofil' : 'Екстремен · експертен профил',
        'universal-max': de ? 'PasevSU Universal MAX · Mehrrollen-Schlüsselsuite' : 'PasevSU Universal MAX · многоролев ключов комплект'
    };
    const speed = {
        fast: de ? 'schnell' : 'бързо', moderate: de ? 'mittel' : 'средно',
        slow: de ? 'langsam' : 'бавно', 'very slow': de ? 'sehr langsam' : 'много бавно',
        'very fast': de ? 'sehr schnell' : 'много бързо'
    }[p.speed] || p.speed;
    const compat = {
        maximum: de ? 'maximal' : 'максимална', 'very high': de ? 'sehr hoch' : 'много висока',
        high: de ? 'hoch' : 'висока', reduced: de ? 'reduziert' : 'намалена',
        adaptive: de ? 'adaptiv · mehrere Subkeys' : 'адаптивна · множество подключове'
    }[p.compatibility] || p.compatibility;
    let note = '';
    if (keyType === 'PASEVSU-UNIVERSAL-MAX') note = de
        ? 'Eine dauerhafte PasevSU-Identität mit spezialisierten Signatur- und Verschlüsselungs-Subkeys. Der Primärschlüssel bleibt die Identitätswurzel; einzelne Subkeys können später rotiert oder widerrufen werden, ohne die Identität zu ersetzen.'
        : 'Една постоянна PasevSU идентичност със специализирани подключове за подписване и криптиране. Основният ключ остава коренът на идентичността; отделни подключове могат по-късно да се сменят или оттеглят, без да се сменя идентичността.';
    if (keyType === 'RSA-8192') note = de
        ? 'Für besonders langfristige oder sensible Fälle. Deutlich langsamer als RSA-4096.'
        : 'За особено дългосрочни или чувствителни случаи. Значително по-бавен от RSA-4096.';
    if (keyType === 'RSA-16384') note = de
        ? 'Extremprofil. Die Erzeugung kann sehr lange dauern und die Interoperabilität kann leiden. P-521 bietet eine ähnliche klassische Sicherheitsklasse mit wesentlich kleineren Schlüsseln.'
        : 'Екстремен профил. Генерирането може да отнеме много време и съвместимостта може да е по-ниска. P-521 дава сходен клас класическа сигурност с много по-малки ключове.';
    if (keyType === 'ECC-p521') note = de
        ? 'Empfohlenes Hochsicherheitsprofil, wenn maximale RSA-Kompatibilität nicht erforderlich ist.'
        : 'Препоръчителен профил за много висока сигурност, когато не е необходима максимална RSA съвместимост.';
    if (keyType === 'ECC-brainpoolP512r1') note = de
        ? 'Sehr hohe Stärke, aber geringere Interoperabilität als NIST P-521 oder RSA.'
        : 'Много висока сила, но по-ограничена съвместимост от NIST P-521 или RSA.';
    return {p, name:names[p.level], speed, compat, note};
}

function updateKeyStrengthInfo() {
    const select = document.getElementById('keyType');
    const host = document.getElementById('keyStrengthInfo');
    if (!select || !host) return;
    const x = keySecurityProfileText(select.value);
    if (!x) { host.textContent = ''; return; }
    const de = window.PasevSUI18n?.language === 'de';
    host.dataset.level = x.p.level;
    host.innerHTML = `<strong>${x.name}</strong>${x.note ? `<div>${x.note}</div>` : ''}` +
        `<div class="security-meta"><span>${de?'Klassische Stärke':'Класическа сила'}: ${x.p.classical}</span>` +
        `<span>${de?'Erzeugung':'Генериране'}: ${x.speed}</span>` +
        `<span>${de?'Kompatibilität':'Съвместимост'}: ${x.compat}</span></div>`;

    const plan = document.getElementById('universalSuitePlan');
    const planText = document.getElementById('universalSuitePlanText');
    if (plan && planText) {
        const isSuite = select.value === 'PASEVSU-UNIVERSAL-MAX';
        plan.hidden = !isSuite;
        if (isSuite) {
            planText.innerHTML = de
                ? '<ol><li>Primär/Identität: Brainpool P-512</li><li>Signatur: Brainpool P-512</li><li>Verschlüsselung: Brainpool P-512</li><li>Signatur: NIST P-521</li><li>Verschlüsselung: NIST P-521</li><li>Signatur: RSA-8192</li><li>Verschlüsselung: RSA-8192</li><li>Kompatibilitäts-Signatur: RSA-4096</li><li>Kompatibilitäts-Verschlüsselung: RSA-4096</li></ol><div><b>Wichtig:</b> Mehrere Subkeys sind mehrere Fähigkeiten/Alternativen; sie bedeuten nicht, dass Standard-OpenPGP jeden Algorithmus seriell übereinander legt.</div>'
                : '<ol><li>Основен/идентичност: Brainpool P-512</li><li>Подписване: Brainpool P-512</li><li>Криптиране: Brainpool P-512</li><li>Подписване: NIST P-521</li><li>Криптиране: NIST P-521</li><li>Подписване: RSA-8192</li><li>Криптиране: RSA-8192</li><li>Съвместим подпис: RSA-4096</li><li>Съвместимо криптиране: RSA-4096</li></ol><div><b>Важно:</b> Множеството подключове са множество способности/алтернативи; стандартният OpenPGP не наслагва автоматично всички алгоритми последователно.</div>';
        }
    }
}

async function generateUniversalMaxSuite({ userIDs, password, expirationInSeconds }) {
    // High-assurance preferences are embedded in the certificate. AES-256 + RFC 9580
    // AEAD are advertised for Fortress-capable peers; Argon2id protects secret-key
    // material at rest. Compatibility modes remain available elsewhere in the UI.
    const universalConfig = {
        preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256,
        preferredHashAlgorithm: openpgp.enums.hash.sha512,
        aeadProtect: true,
        preferredAEADAlgorithm: openpgp.enums.aead.gcm,
        s2kType: openpgp.enums.s2k.argon2,
        s2kArgon2Params: { passes: 3, parallelism: 4, memoryExponent: 17 },
        maxArgon2MemoryExponent: 18
    };
    // Build the complete suite while secret material is unlocked, then protect the
    // resulting private key once, so every subkey is covered by the same passphrase.
    const base = await openpgp.generateKey({
        type: 'ecc',
        curve: 'brainpoolP512r1',
        userIDs,
        keyExpirationTime: expirationInSeconds,
        subkeys: [],
        format: 'object',
        config: universalConfig
    });

    let privateKey = base.privateKey;
    const layers = [
        { type:'ecc', curve:'brainpoolP512r1', sign:true,  keyExpirationTime:expirationInSeconds },
        { type:'ecc', curve:'brainpoolP512r1', sign:false, keyExpirationTime:expirationInSeconds },
        { type:'ecc', curve:'nistP521',         sign:true,  keyExpirationTime:expirationInSeconds },
        { type:'ecc', curve:'nistP521',         sign:false, keyExpirationTime:expirationInSeconds },
        { type:'rsa', rsaBits:8192,             sign:true,  keyExpirationTime:expirationInSeconds },
        { type:'rsa', rsaBits:8192,             sign:false, keyExpirationTime:expirationInSeconds },
        { type:'rsa', rsaBits:4096,             sign:true,  keyExpirationTime:expirationInSeconds },
        { type:'rsa', rsaBits:4096,             sign:false, keyExpirationTime:expirationInSeconds }
    ];

    for (let i = 0; i < layers.length; i++) {
        const de = window.PasevSUI18n?.language === 'de';
        toast(de ? `Universal MAX: Subkey ${i + 1}/${layers.length} wird erzeugt…` : `Universal MAX: генериране на подключ ${i + 1}/${layers.length}…`);
        privateKey = await privateKey.addSubkey({ ...layers[i], config: universalConfig });
    }

    await privateKey.validate();

    // Reformat produces deterministic armored public/private outputs and applies
    // the final passphrase protection after every subkey has been bound.
    const formatted = await openpgp.reformatKey({
        privateKey,
        userIDs,
        passphrase: password,
        keyExpirationTime: expirationInSeconds,
        format: 'armored',
        config: universalConfig
    });

    return {
        privateKey: formatted.privateKey,
        publicKey: formatted.publicKey,
        revocationCertificate: formatted.revocationCertificate || base.revocationCertificate,
        suite: {
            id: 'PASEVSU-UNIVERSAL-MAX',
            version: 1,
            primary: 'brainpoolP512r1',
            subkeys: layers.map(x => ({...x}))
        }
    };
}

async function generateKeys() {
    const btn = document.getElementById('generateKeysButton');
    const keyType = document.getElementById('keyType').value;
    const password = document.getElementById('keyPassword').value;
    const comment = document.getElementById('keyComment').value;
    const email = document.getElementById('keyEmail').value;
    const expiration = document.getElementById('keyExpiration').value;

    if (!keyType) { toast('Please select algorithm.', 'error'); return; }
    if (!password || password.length < 16) { toast('Generated private keys require a passphrase of at least 16 characters.', 'error'); return; }

    btn.disabled = true;
    const prevText = btn.textContent;
    btn.textContent = 'Generating…';

    const expirationInSeconds = expiration
        ? Math.max(0, Math.floor((new Date(expiration) - new Date()) / 1000))
        : 0;

    try {
        let keyPairOptions = {
            userIDs: [{ name: comment, email }],
            passphrase: password || undefined,
            keyExpirationTime: expirationInSeconds
        };

        const securityProfile = KEY_SECURITY_PROFILES[keyType];
        if (!securityProfile) throw new Error('Unsupported key security profile.');

        if (securityProfile.type === 'suite' && (!password || password.length < 16)) {
            const msg = window.PasevSUI18n?.language === 'de'
                ? 'PasevSU Universal MAX erfordert eine Passphrase mit mindestens 16 Zeichen.'
                : 'PasevSU Universal MAX изисква парола с минимум 16 знака.';
            throw new Error(msg);
        }

        if (securityProfile.type === 'rsa') {
            keyPairOptions.type = 'rsa';
            keyPairOptions.rsaBits = securityProfile.rsaBits;
        } else if (securityProfile.type === 'ecc') {
            keyPairOptions.type = 'ecc';
            keyPairOptions.curve = securityProfile.curve;
        }

        if (keyType === 'PASEVSU-UNIVERSAL-MAX') {
            const msg = window.PasevSUI18n?.language === 'de'
                ? 'Universal MAX erzeugt eine große Mehrrollen-Schlüsselsuite mit acht Subkeys. RSA-8192-Subkeys können die Erzeugung deutlich verlangsamen. Fortfahren?'
                : 'Universal MAX създава голям многоролев комплект с осем подключа. RSA-8192 подключовете могат значително да забавят генерирането. Да продължа ли?';
            if (!confirm(msg)) return;
        }
        if (keyType === 'RSA-16384') {
            const msg = window.PasevSUI18n?.language === 'de'
                ? 'RSA-16384 ist ein Extremprofil. Die Erzeugung kann sehr lange dauern und die Kompatibilität kann geringer sein. Für ähnliche klassische Stärke ist ECC P-521 wesentlich effizienter. RSA-16384 wirklich erzeugen?'
                : 'RSA-16384 е екстремен профил. Генерирането може да отнеме много време и съвместимостта може да е по-ниска. За сходна класическа сила ECC P-521 е значително по-ефективен. Наистина ли да генерирам RSA-16384?';
            if (!confirm(msg)) return;
        }

        toast(`Generating ${keyType} key pair…`);
        const keyPair = securityProfile.type === 'suite'
            ? await generateUniversalMaxSuite({ userIDs: keyPairOptions.userIDs, password, expirationInSeconds })
            : await openpgp.generateKey({ ...keyPairOptions, config:{ ...(window.PasevSUAdvanced?.config?.() || {}), s2kType:openpgp.enums.s2k.argon2, s2kArgon2Params:{passes:3,parallelism:4,memoryExponent:17}, maxArgon2MemoryExponent:18 } });

        const publicKeyObj = await openpgp.readKey({ armoredKey: keyPair.publicKey });
        const fingerprint = publicKeyObj.getFingerprint('hex').toUpperCase();
        const expirationDate = getExpirationTime(await publicKeyObj.getExpirationTime());

        keys.push({
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey,
            email, comment, expirationDate, fingerprint,
            userLabel: `${comment || ''} ${email ? `<${email}>` : ''}`.trim(),
            meta: keyPair.suite ? { pasevSUSuite: keyPair.suite } : {},
            revocationCertificate: keyPair.revocationCertificate || '',
            publishHistory: []
        });

        await saveKeysToLocalStorage();
        refreshKeyList();
        toast('Key pair generated.');
        ['keyPassword', 'keyComment', 'keyEmail', 'keyExpiration'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
    } catch (error) {
        toast(`Failed: ${error.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = prevText;
    }
}

/* ---------------------------------------------------------------------
 * IMPORT KEY
 * ------------------------------------------------------------------- */
async function storeKeys() {
    const keyText = document.getElementById('key').value.trim();
    if (!keyText) { toast('Please paste a key.', 'error'); return; }

    let fingerprint, expirationDate, email = '', comment = '', userLabel = '';
    let privateKey = null, publicKey = null;

    try {
        try {
            const privateKeyObj = await openpgp.readPrivateKey({ armoredKey: keyText });
            if (privateKeyObj.isDecrypted()) throw new Error('Unprotected private-key import is blocked. Protect the key with a passphrase before importing it.');
            privateKey = keyText;
            publicKey = (await privateKeyObj.toPublic()).armor();
            fingerprint = privateKeyObj.getFingerprint('hex').toUpperCase();
            expirationDate = getExpirationTime(await privateKeyObj.getExpirationTime());
            const uid = privateKeyObj.users?.[0]?.userID || {};
            comment = uid.comment || ''; email = uid.email || ''; userLabel = uid.userID || '';
        } catch {
            const publicKeyObj = await openpgp.readKey({ armoredKey: keyText });
            publicKey = keyText;
            fingerprint = publicKeyObj.getFingerprint('hex').toUpperCase();
            expirationDate = getExpirationTime(await publicKeyObj.getExpirationTime());
            const uid = publicKeyObj.users?.[0]?.userID || {};
            comment = uid.comment || ''; email = uid.email || ''; userLabel = uid.userID || '';
        }

        if (keys.some(k => k.fingerprint === fingerprint)) {
            toast('This key is already stored.', 'error');
            return;
        }

        keys.push({
            privateKey, publicKey, email, comment, expirationDate, fingerprint, userLabel,
            meta: {}, publishHistory: []
        });
        await saveKeysToLocalStorage();
        refreshKeyList();
        toast('Key imported.');
        document.getElementById('key').value = '';
    } catch (error) {
        toast(`Failed: ${error.message}`, 'error');
    }
}

/* ---------------------------------------------------------------------
 * ENCRYPT / DECRYPT
 * ------------------------------------------------------------------- */
function normalizeRecipientEmail(value) {
    const email = String(value || '').trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
    return email;
}

function keyUserEmails(publicKey) {
    const emails = new Set();
    for (const user of publicKey.users || []) {
        const email = user?.userID?.email;
        if (email) emails.add(String(email).trim().toLowerCase());
    }
    return [...emails];
}

async function validatePublicKeyForExactEmail(publicKey, email) {
    const normalized = normalizeRecipientEmail(email);
    if (!normalized) throw new Error('Invalid recipient email address.');
    const userEmails = keyUserEmails(publicKey);
    if (!userEmails.includes(normalized)) {
        throw new Error('The discovered public key does not contain this exact email address as an OpenPGP User ID.');
    }

    // Passing the exact User ID to getEncryptionKey forces OpenPGP.js to evaluate
    // the encryption-capable key/subkey in the context of that identity.
    const encryptionKey = await publicKey.getEncryptionKey(undefined, new Date(), { email: normalized });
    const expirationRaw = await publicKey.getExpirationTime({ email: normalized });
    if (expirationRaw === null) throw new Error('The recipient key or matching identity is revoked or invalid.');
    if (expirationRaw !== Infinity && new Date(expirationRaw).getTime() <= Date.now()) {
        throw new Error('The recipient key is expired.');
    }
    const algorithm = encryptionKey.getAlgorithmInfo?.() || {};
    return {
        fingerprint: publicKey.getFingerprint().toUpperCase(),
        keyID: encryptionKey.getKeyID().toHex().toUpperCase(),
        encryptionKeyID: encryptionKey.getKeyID(),
        expiration: expirationRaw === Infinity ? 'Never Expires' : new Date(expirationRaw).toISOString(),
        algorithm: algorithm.algorithm || 'OpenPGP',
        bits: algorithm.bits || null,
        curve: algorithm.curve || null,
        userEmails
    };
}

function clearEmailRecipientState(message = 'No recipient key selected.') {
    emailRecipientState = null;
    const status = document.getElementById('recipientKeyStatus');
    if (status) {
        status.dataset.state = 'idle';
        status.innerHTML = '';
        const strong = document.createElement('strong');
        strong.textContent = uiText(message);
        const span = document.createElement('span');
        span.textContent = uiText('Enter the exact email address and discover its public key before encryption.');
        status.append(strong, span);
    }
    const confirmWrap = document.getElementById('recipientFingerprintConfirmWrap');
    const confirmBox = document.getElementById('recipientFingerprintConfirmed');
    const saveButton = document.getElementById('saveRecipientKeyButton');
    confirmWrap?.classList.add('hidden');
    saveButton?.classList.add('hidden');
    if (confirmBox) confirmBox.checked = false;
    const audit = document.getElementById('encryptRecipientAudit');
    if (audit) audit.textContent = '';
}

function renderEmailRecipientState(state) {
    const status = document.getElementById('recipientKeyStatus');
    if (!status) return;
    status.dataset.state = 'verified';
    status.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = uiText('Exact recipient key found and cryptographically usable.');
    const details = document.createElement('span');
    const strength = [state.algorithm, state.curve || state.bits].filter(Boolean).join(' / ');
    details.textContent = [
        `${uiText('Email')}: ${state.email}`,
        `${uiText('Fingerprint')}: ${formatFingerprint(state.fingerprint)}`,
        `${uiText('Key ID')}: ${state.keyID}`,
        `${uiText('Algorithm')}: ${strength || state.algorithm}`,
        `${uiText('Expiration')}: ${uiText(state.expiration)}`,
        `${uiText('Source')}: ${state.source}`
    ].join('\n');
    status.append(title, details);
    document.getElementById('recipientFingerprintConfirmWrap')?.classList.remove('hidden');
    document.getElementById('saveRecipientKeyButton')?.classList.remove('hidden');
}

async function findLocalPublicKeysForEmail(email) {
    const matches = [];
    for (let index = 0; index < keys.length; index++) {
        const stored = keys[index];
        if (!stored?.publicKey) continue;
        try {
            const parsed = await openpgp.readKey({ armoredKey: stored.publicKey });
            if (!keyUserEmails(parsed).includes(email)) continue;
            const validation = await validatePublicKeyForExactEmail(parsed, email);
            matches.push({ index, stored, parsed, validation });
        } catch { /* invalid/non-matching local key is ignored here */ }
    }
    return matches;
}

async function discoverRecipientByEmail() {
    const input = document.getElementById('recipientEmail');
    const button = document.getElementById('discoverRecipientButton');
    const email = normalizeRecipientEmail(input?.value);
    if (!email) { toast('Enter a valid recipient email address.', 'error'); return; }
    clearEmailRecipientState('Looking for the exact recipient key…');
    if (button) { button.disabled = true; button.textContent = 'Searching…'; }

    try {
        const local = await findLocalPublicKeysForEmail(email);
        if (local.length > 1) {
            throw new Error('More than one valid local key matches this email. Use Stored public keys and select the intended fingerprint explicitly.');
        }
        if (local.length === 1) {
            const match = local[0];
            emailRecipientState = {
                email,
                publicKey: match.parsed,
                armored: match.stored.publicKey,
                fingerprint: match.validation.fingerprint,
                encryptionKeyID: match.validation.encryptionKeyID,
                keyID: match.validation.keyID,
                expiration: match.validation.expiration,
                algorithm: match.validation.algorithm,
                bits: match.validation.bits,
                curve: match.validation.curve,
                source: 'PasevSU local key store'
            };
            renderEmailRecipientState(emailRecipientState);
            toast('Exact local recipient key found. Verify its fingerprint before encryption.');
            return;
        }

        const proxyReady = await checkProxyAvailability();
        if (!proxyReady) throw new Error('Local PasevSU server is required for verified email discovery.');
        const discoveryEmail = String(input?.value || email).trim();
        const response = await fetch(`${PROXY_URL}/api/discover-email?email=${encodeURIComponent(discoveryEmail)}`, { cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok || (!data.armored && !data.binaryBase64)) throw new Error(data.error || `Lookup HTTP ${response.status}`);
        const parsed = data.armored
            ? await openpgp.readKey({ armoredKey: data.armored })
            : await openpgp.readKey({ binaryKey: base64ToBytes(data.binaryBase64) });
        const validation = await validatePublicKeyForExactEmail(parsed, email);
        const armoredForStorage = data.armored || parsed.armor();
        const sourceLabel = data.source === 'wkd'
            ? `WKD ${data.method || ''} — recipient-domain controlled`.trim()
            : (data.verifiedEmail ? 'keys.openpgp.org VKS — verified exact email' : 'OpenPGP directory');
        emailRecipientState = {
            email,
            publicKey: parsed,
            armored: armoredForStorage,
            fingerprint: validation.fingerprint,
            encryptionKeyID: validation.encryptionKeyID,
            keyID: validation.keyID,
            expiration: validation.expiration,
            algorithm: validation.algorithm,
            bits: validation.bits,
            curve: validation.curve,
            source: sourceLabel
        };
        renderEmailRecipientState(emailRecipientState);
        toast('Verified exact-email public key found. Check the fingerprint before encryption.');
    } catch (error) {
        clearEmailRecipientState('Recipient key discovery failed.');
        const status = document.getElementById('recipientKeyStatus');
        if (status) {
            status.dataset.state = 'error';
            const span = status.querySelector('span');
            if (span) span.textContent = uiText(error.message);
        }
        toast(`Recipient lookup failed: ${error.message}`, 'error');
    } finally {
        if (button) { button.disabled = false; button.textContent = uiText('Find & verify public key'); }
    }
}

async function saveDiscoveredRecipientKey() {
    const state = emailRecipientState;
    if (!state?.armored) { toast('Discover a recipient key first.', 'error'); return; }
    if (!document.getElementById('recipientFingerprintConfirmed')?.checked) {
        toast('Confirm that you checked the recipient fingerprint before saving this key.', 'error'); return;
    }
    if (keys.some(k => String(k.fingerprint || '').replace(/\s+/g, '').toUpperCase() === state.fingerprint)) {
        toast('This key is already stored.', 'info'); return;
    }
    const uid = state.publicKey.users?.find(u => String(u?.userID?.email || '').toLowerCase() === state.email)?.userID || {};
    keys.push({
        privateKey: null,
        publicKey: state.armored,
        email: state.email,
        comment: uid.comment || '',
        expirationDate: getExpirationTime(await state.publicKey.getExpirationTime({ email: state.email })),
        fingerprint: state.fingerprint,
        userLabel: uid.userID || state.email,
        meta: { discoveredBy: 'PasevSU exact-email recipient discovery', discoverySource: state.source, discoveredAt: new Date().toISOString() },
        publishHistory: []
    });
    await saveKeysToLocalStorage();
    refreshKeyList();
    toast('Recipient public key saved locally.');
}

function updateEncryptRecipientMode() {
    const mode = document.getElementById('encryptRecipientMode')?.value || 'email';
    document.getElementById('emailRecipientPanel')?.classList.toggle('hidden', mode !== 'email');
    document.getElementById('storedRecipientPanel')?.classList.toggle('hidden', mode !== 'stored');
    const audit = document.getElementById('encryptRecipientAudit');
    if (audit) audit.textContent = '';
}

async function enforceEncryptionPolicy(records) {
    const profileId = document.getElementById('encryptPolicyProfile')?.value || 'modern-compatible';
    if (!window.PasevSUPolicy?.authorizeEncryption) throw new Error('Policy Engine is unavailable; encryption is fail-closed.');
    const report = await window.PasevSUPolicy.authorizeEncryption(records, profileId);
    if (report.decision !== 'READY') throw new Error(`Policy ${report.profile.label} blocked encryption: ${[...report.runtimeReasons, ...report.recipients.flatMap(r => r.reasons)].join(' ')}`);
    return report;
}

async function encryptMessage() {
    const message = document.getElementById('messageToEncrypt').value.trim();
    const mode = document.getElementById('encryptRecipientMode')?.value || 'email';
    if (!message) { toast('Enter a message.', 'error'); return; }

    try {
        const strict = Boolean(document.getElementById('encryptStrictPolicy')?.checked);
        let config = strict ? { ...(window.PasevSUAdvanced?.config?.() || {}) } : {};
        const compression = document.getElementById('encryptCompression')?.value || 'auto';
        const compressionMap = {
            none: openpgp.enums.compression.uncompressed,
            zip: openpgp.enums.compression.zip,
            zlib: openpgp.enums.compression.zlib
        };
        if (compression !== 'auto') config.preferredCompressionAlgorithm = compressionMap[compression];
        if (!Object.keys(config).length) config = undefined;
        const wildcard = Boolean(document.getElementById('encryptHiddenRecipient')?.checked);
        const signEnabled = Boolean(document.getElementById('encryptSignEnabled')?.checked);
        let signingKeys;
        let signingKeyIDs;
        let signatureNotations = [];
        let signerAudit = '';

        if (signEnabled) {
            const signerIndex = document.getElementById('encryptSigningKey')?.value ?? '';
            if (signerIndex === '') throw new Error('Select the private key that must sign the encrypted message.');
            const signerRecord = keys[Number(signerIndex)];
            if (!signerRecord?.privateKey) throw new Error('Selected signing identity has no private material.');
            let signer = await openpgp.readPrivateKey({ armoredKey: signerRecord.privateKey });
            if (!signer.isDecrypted()) {
                const passphrase = document.getElementById('encryptSigningPassphrase')?.value || '';
                if (!passphrase) throw new Error('Signing-key passphrase required.');
                signer = await openpgp.decryptKey({ privateKey: signer, passphrase });
            }
            const signingSubkey = await signer.getSigningKey(undefined, new Date(), undefined, config);
            signingKeys = [signer];
            signingKeyIDs = [signingSubkey.getKeyID()];
            signerAudit = ` · ${uiText('Signed by')} ${formatFingerprint(signer.getFingerprint().toUpperCase())} / ${signingSubkey.getKeyID().toHex().toUpperCase()}`;

            const caseID = document.getElementById('encryptCaseId')?.value.trim();
            const evidenceID = document.getElementById('encryptEvidenceId')?.value.trim();
            if (caseID) signatureNotations.push({ name:'case-id@pasevsu.local', value:new TextEncoder().encode(caseID), humanReadable:true, critical:false });
            if (evidenceID) signatureNotations.push({ name:'evidence-id@pasevsu.local', value:new TextEncoder().encode(evidenceID), humanReadable:true, critical:false });
        }

        let encrypted;
        if (mode === 'email') {
            const email = normalizeRecipientEmail(document.getElementById('recipientEmail')?.value);
            if (!email) { toast('Enter a valid recipient email address.', 'error'); return; }
            if (!emailRecipientState || emailRecipientState.email !== email) {
                toast('Find and verify the public key for this exact email address first.', 'error'); return;
            }
            if (!document.getElementById('recipientFingerprintConfirmed')?.checked) {
                toast('Confirm that you checked the recipient fingerprint before encryption.', 'error'); return;
            }
            const validation = await validatePublicKeyForExactEmail(emailRecipientState.publicKey, email);
            await enforceEncryptionPolicy([{ publicKey:emailRecipientState.armored, email, userLabel:email }]);
            encrypted = await openpgp.encrypt({
                message: await openpgp.createMessage({ text: message }),
                encryptionKeys: [emailRecipientState.publicKey],
                encryptionKeyIDs: [validation.encryptionKeyID],
                encryptionUserIDs: [{ email }],
                signingKeys,
                signingKeyIDs,
                signatureNotations,
                wildcard,
                config
            });
            const audit = document.getElementById('encryptRecipientAudit');
            if (audit) audit.textContent = `${uiText('Encrypted specifically for')} ${email} · ${uiText('Fingerprint')}: ${formatFingerprint(validation.fingerprint)} · ${uiText('Key ID')}: ${wildcard ? uiText('hidden in ciphertext') : validation.keyID}${signerAudit} · ${strict ? 'STRICT' : 'COMPAT'}`;
            toast(`Encrypted specifically for ${email}.`);
        } else {
            const select = document.getElementById('keySelectEncryptMulti');
            const selectedIndices = Array.from(select.selectedOptions).map(o => o.value);
            if (selectedIndices.length === 0) { toast('Select recipients.', 'error'); return; }
            const selectedRecords = selectedIndices.map(i => keys[Number(i)]).filter(Boolean);
            await enforceEncryptionPolicy(selectedRecords);
            const encryptionKeys = await Promise.all(selectedRecords.map(record => openpgp.readKey({ armoredKey: record.publicKey })));
            encrypted = await openpgp.encrypt({
                message: await openpgp.createMessage({ text: message }),
                encryptionKeys,
                signingKeys,
                signingKeyIDs,
                signatureNotations,
                wildcard,
                config
            });
            const audit = document.getElementById('encryptRecipientAudit');
            if (audit) audit.textContent = `${selectedIndices.length} recipient(s) · ${wildcard ? uiText('recipient Key IDs hidden') : uiText('recipient Key IDs visible')}${signerAudit} · ${strict ? 'STRICT' : 'COMPAT'}`;
            toast(`Encrypted for ${selectedIndices.length} recipient(s).`);
        }
        document.getElementById('encryptedMessage').value = encrypted;
    } catch (error) {
        toast(`Encryption failed: ${error.message}`, 'error');
    }
}

async function decryptMessage() {
    const message = document.getElementById('messageToDecrypt').value.trim();
    const keyIndex = document.getElementById('privateKeySelect').value;
    const password = document.getElementById('privateKeyPassword').value;

    if (!message) { toast('Enter encrypted message.', 'error'); return; }
    if (keyIndex === '') { toast('Select private key.', 'error'); return; }

    try {
        const strict = Boolean(document.getElementById('decryptStrictPolicy')?.checked);
        const config = strict ? window.PasevSUAdvanced?.config?.() : undefined;
        const expectSigned = Boolean(document.getElementById('decryptExpectSigned')?.checked);
        const verificationIndex = document.getElementById('decryptVerificationKey')?.value ?? '';
        const validationDateRaw = document.getElementById('decryptValidationDate')?.value || '';
        const date = validationDateRaw ? new Date(validationDateRaw) : new Date();
        if (Number.isNaN(date.getTime())) throw new Error('Invalid signature validation date.');
        if (expectSigned && verificationIndex === '') throw new Error('Select the expected sender public key when a valid signature is required.');

        let privateKey = await openpgp.readPrivateKey({ armoredKey: keys[keyIndex].privateKey });
        if (!privateKey.isDecrypted()) {
            if (!password) throw new Error('Private-key passphrase required.');
            privateKey = await openpgp.decryptKey({ privateKey, passphrase: password });
        }
        let verificationKeys;
        if (verificationIndex !== '') {
            verificationKeys = [await openpgp.readKey({ armoredKey: keys[Number(verificationIndex)].publicKey })];
        }
        const parsedMessage = await openpgp.readMessage({ armoredMessage: message, config });
        const decrypted = await openpgp.decrypt({
            message: parsedMessage,
            decryptionKeys: privateKey,
            verificationKeys,
            expectSigned,
            date,
            config
        });
        document.getElementById('decryptedMessage').value = decrypted.data || '';

        const signatureAudit = [];
        for (const sig of decrypted.signatures || []) {
            try {
                await sig.verified;
                signatureAudit.push(`PASS ${sig.keyID.toHex().toUpperCase()}`);
            } catch (e) {
                signatureAudit.push(`FAIL ${sig.keyID.toHex().toUpperCase()} · ${e.message}`);
            }
        }
        const audit = document.getElementById('decryptSignatureAudit');
        if (audit) audit.textContent = signatureAudit.length
            ? `${uiText('Signature verification')}: ${signatureAudit.join(' | ')} · ${strict ? 'STRICT' : 'COMPAT'} · ${date.toISOString()}`
            : `${uiText('Signature verification')}: ${expectSigned ? 'REQUIRED / NONE VALID' : 'not requested or no verifiable signature'} · ${strict ? 'STRICT' : 'COMPAT'}`;
        toast(expectSigned ? 'Decrypted and required sender signature verified.' : 'Decrypted.');
    } catch (error) {
        const audit = document.getElementById('decryptSignatureAudit');
        if (audit) audit.textContent = `FAIL · ${error.message}`;
        toast(`Decryption failed: ${error.message}`, 'error');
    }
}


/* ---------------------------------------------------------------------
 * PASEVSU FORTRESS MULTI-LAYER ENGINE
 * ------------------------------------------------------------------- */
const FORTRESS_CONTAINER_MAGIC = new TextEncoder().encode('PASEVSU_FORTRESS_V1\0');
const FORTRESS_CONTAINER_MAGIC_V2 = new TextEncoder().encode('PASEVSU_FORTRESS_V2\0');
const FORTRESS_INNER_MAGIC = new TextEncoder().encode('PASEVSU_INNER_V1\0');
const FORTRESS_STREAM_MAGIC_V2 = new TextEncoder().encode('PASEVSU_FORTRESS_STREAM_V2\0');
const FORTRESS_STREAM_MAGIC = new TextEncoder().encode('PASEVSU_FORTRESS_STREAM_V3\0');
const FORTRESS_STREAM_INNER_MAGIC = new TextEncoder().encode('PASEVSU_FORTRESS_INNER_META_V1\0');
const FORTRESS_MAX_BYTES = 128 * 1024 * 1024;
const FORTRESS_STREAM_HASH_BLOCK = 1024 * 1024;
const FORTRESS_STREAM_HEADER_MAX = 64 * 1024;

function u32be(n) {
    const b = new Uint8Array(4);
    new DataView(b.buffer).setUint32(0, n, false);
    return b;
}

function concatBytes(...parts) {
    const len = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(len);
    let off = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    return out;
}

function startsWithBytes(data, prefix) {
    if (!(data instanceof Uint8Array) || data.length < prefix.length) return false;
    for (let i = 0; i < prefix.length; i++) if (data[i] !== prefix[i]) return false;
    return true;
}

function packBinaryEnvelope(magic, meta, payload) {
    const metaBytes = new TextEncoder().encode(JSON.stringify(meta));
    if (metaBytes.length > 65535) throw new Error('Fortress metadata is unexpectedly large.');
    return concatBytes(magic, u32be(metaBytes.length), metaBytes, payload);
}

function unpackBinaryEnvelope(data, magic) {
    if (!startsWithBytes(data, magic)) throw new Error('Not a PasevSU Fortress container.');
    const p = magic.length;
    if (data.length < p + 4) throw new Error('Truncated Fortress container.');
    const metaLen = new DataView(data.buffer, data.byteOffset + p, 4).getUint32(0, false);
    if (metaLen > 65535 || data.length < p + 4 + metaLen) throw new Error('Invalid Fortress metadata length.');
    const metaText = new TextDecoder().decode(data.subarray(p + 4, p + 4 + metaLen));
    let meta;
    try { meta = JSON.parse(metaText); } catch { throw new Error('Invalid Fortress metadata.'); }
    return { meta, payload: data.subarray(p + 4 + metaLen) };
}

function bytesToBase64(bytes) {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
    }
    return btoa(binary);
}

function base64ToBytes(text) {
    const clean = text.replace(/\s+/g, '');
    const bin = atob(clean);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

function armorFortress(bytes) {
    const b64 = bytesToBase64(bytes);
    const lines = b64.match(/.{1,64}/g) || [];
    const version = startsWithBytes(bytes, FORTRESS_CONTAINER_MAGIC_V2) ? 2 : 1;
    return `-----BEGIN PASEVSU FORTRESS-----\nVersion: ${version}\n\n${lines.join('\n')}\n-----END PASEVSU FORTRESS-----`;
}

function dearmorFortress(text) {
    const m = String(text).trim().match(/-----BEGIN PASEVSU FORTRESS-----[\s\S]*?\n\n([A-Za-z0-9+/=\r\n]+)\n-----END PASEVSU FORTRESS-----/);
    if (!m) throw new Error('Not a PasevSU Fortress armored package.');
    return base64ToBytes(m[1]);
}

async function sha512Hex(bytes) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-512', bytes));
    return Array.from(digest, b => b.toString(16).padStart(2, '0')).join('');
}

async function resolveFortressEncryptionLayers(publicKey) {
    const candidates = [];
    for (const sub of publicKey.getSubkeys()) {
        try {
            const usable = await publicKey.getEncryptionKey(sub.getKeyID());
            if (usable.getKeyID().toHex() !== sub.getKeyID().toHex()) continue;
            const info = sub.getAlgorithmInfo?.() || {};
            candidates.push({ sub, info, keyID: sub.getKeyID(), keyIDHex: sub.getKeyID().toHex().toUpperCase() });
        } catch { /* signing-only or invalid subkey */ }
    }

    const curve = name => candidates.find(x => String(x.info.curve || '').toLowerCase() === name.toLowerCase());
    const rsa = bits => candidates.find(x => String(x.info.algorithm || '').toLowerCase().includes('rsa') && Number(x.info.bits) === bits);
    const wanted = [
        { id:'brainpoolP512r1', label:'Brainpool P-512 ECDH', item:curve('brainpoolP512r1') },
        { id:'nistP521', label:'NIST P-521 ECDH', item:curve('nistP521') },
        { id:'rsa8192', label:'RSA-8192', item:rsa(8192) },
        { id:'rsa4096', label:'RSA-4096', item:rsa(4096) }
    ];
    const missing = wanted.filter(x => !x.item).map(x => x.label);
    if (missing.length) throw new Error(`Universal MAX key is missing required encryption layer(s): ${missing.join(', ')}`);
    return wanted.map(x => ({ id:x.id, label:x.label, keyID:x.item.keyID, keyIDHex:x.item.keyIDHex }));
}

function fortressCryptoConfig() {
    return {
        preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256,
        preferredHashAlgorithm: openpgp.enums.hash.sha512,
        aeadProtect: true,
        preferredAEADAlgorithm: openpgp.enums.aead.gcm,
        allowUnauthenticatedMessages: false,
        allowUnauthenticatedStream: false
    };
}

function fortressPasswordConfig() {
    return {
        ...fortressCryptoConfig(),
        s2kType: openpgp.enums.s2k.argon2,
        s2kArgon2Params: { passes: 3, parallelism: 4, memoryExponent: 17 },
        maxArgon2MemoryExponent: 18
    };
}

async function fortressEncryptPayload(plainBytes, publicKey, profile, originalMeta = {}) {
    const primaryUser = await publicKey.getPrimaryUser();
    const selfSig = primaryUser?.selfCertification;
    const aeadPrefs = selfSig?.preferredAEADAlgorithms || [];
    const cipherPrefs = selfSig?.preferredSymmetricAlgorithms || [];
    if (!aeadPrefs.length || !cipherPrefs.includes(openpgp.enums.symmetric.aes256)) throw new Error('Fortress requires a v1.5+ Universal MAX key advertising AEAD and AES-256 preferences.');
    if (plainBytes.length > FORTRESS_MAX_BYTES) throw new Error('Fortress browser mode is limited to 128 MiB per item to avoid unsafe memory pressure.');
    const layers = await resolveFortressEncryptionLayers(publicKey);
    const createdAt = new Date().toISOString();
    const passwordLayer = profile === 'max4-pass';
    const header = {
        format:'PasevSU-Fortress', version:2, profile, createdAt,
        primaryFingerprint:publicKey.getFingerprint().toUpperCase(),
        asymmetricLayers:layers.map(x => ({id:x.id,label:x.label,keyID:x.keyIDHex})),
        passwordLayer,
        passwordKdf:passwordLayer ? 'Argon2id' : null,
        passwordKdfParams:passwordLayer ? {passes:3,parallelism:4,memoryKiB:131072} : null,
        contentCipher:'AES-256', aead:'GCM', digest:'SHA-512', metadataBinding:'encrypted-inner-copy-v1'
    };
    const innerMeta = {
        format:'PasevSU-Fortress-Inner', version:2, createdAt,
        originalSize:plainBytes.length, originalName:originalMeta.name || null,
        originalType:originalMeta.type || 'application/octet-stream', sha512:await sha512Hex(plainBytes),
        primaryFingerprint:header.primaryFingerprint, layers:header.asymmetricLayers,
        outerHeaderBinding:JSON.parse(JSON.stringify(header))
    };
    let payload=packBinaryEnvelope(FORTRESS_INNER_MAGIC,innerMeta,plainBytes);
    for (let i=0;i<layers.length;i++) {
        const layer=layers[i]; toast(`Fortress: layer ${i+1}/${layers.length} — ${layer.label}`);
        payload=await openpgp.encrypt({message:await openpgp.createMessage({binary:payload}),encryptionKeys:publicKey,encryptionKeyIDs:layer.keyID,format:'binary',config:fortressCryptoConfig()});
        if (!(payload instanceof Uint8Array)) payload=new Uint8Array(payload);
    }
    return {payload,header};
}

async function fortressAddPasswordLayer(payload, passphrase, header) {
    if (!header?.passwordLayer || header?.version !== 2) throw new Error('Fortress V2 password-layer metadata is inconsistent.');
    if (!passphrase || passphrase.length < 24) throw new Error('MAX+ requires an independent Fortress passphrase of at least 24 characters.');
    toast('Fortress: Argon2id + AES-256-GCM outer layer…');
    let out=await openpgp.encrypt({message:await openpgp.createMessage({binary:payload}),passwords:[passphrase],format:'binary',config:fortressPasswordConfig()});
    if (!(out instanceof Uint8Array)) out=new Uint8Array(out);
    return out;
}

async function fortressDecryptPayload(containerBytes, privateKey, fortressPassphrase) {
    const isV2=startsWithBytes(containerBytes,FORTRESS_CONTAINER_MAGIC_V2);
    const isV1=startsWithBytes(containerBytes,FORTRESS_CONTAINER_MAGIC);
    if (!isV2 && !isV1) throw new Error('Not a supported PasevSU Fortress container.');
    const outer=unpackBinaryEnvelope(containerBytes,isV2?FORTRESS_CONTAINER_MAGIC_V2:FORTRESS_CONTAINER_MAGIC);
    const header=outer.meta;
    if (header.format !== 'PasevSU-Fortress' || ![1,2].includes(header.version)) throw new Error('Unsupported Fortress version.');
    if ((isV2 && header.version !== 2) || (isV1 && header.version !== 1)) throw new Error('Fortress magic/version mismatch.');
    if (header.primaryFingerprint && privateKey.getFingerprint().toUpperCase() !== header.primaryFingerprint) throw new Error('Selected private key does not match the Fortress recipient fingerprint.');
    let payload=outer.payload;
    if (header.passwordLayer) {
        if (!fortressPassphrase) throw new Error('This MAX+ package requires the independent Fortress passphrase.');
        const r=await openpgp.decrypt({message:await openpgp.readMessage({binaryMessage:payload}),passwords:[fortressPassphrase],format:'binary',config:fortressPasswordConfig()});
        payload=r.data instanceof Uint8Array?r.data:new Uint8Array(r.data);
    }
    const layers=Array.isArray(header.asymmetricLayers)?header.asymmetricLayers:[];
    if (layers.length<1 || layers.length>8) throw new Error('Invalid Fortress layer count.');
    for (let i=layers.length-1;i>=0;i--) {
        toast(`Fortress: decrypt layer ${layers.length-i}/${layers.length} — ${layers[i].label || layers[i].id}`);
        const r=await openpgp.decrypt({message:await openpgp.readMessage({binaryMessage:payload}),decryptionKeys:privateKey,format:'binary',config:fortressCryptoConfig()});
        payload=r.data instanceof Uint8Array?r.data:new Uint8Array(r.data);
    }
    const inner=unpackBinaryEnvelope(payload,FORTRESS_INNER_MAGIC);
    const actualHash=await sha512Hex(inner.payload);
    if (!inner.meta.sha512 || actualHash.toLowerCase() !== String(inner.meta.sha512).toLowerCase()) throw new Error('Fortress SHA-512 integrity verification failed.');
    if (inner.meta.primaryFingerprint && inner.meta.primaryFingerprint !== header.primaryFingerprint) throw new Error('Fortress inner/outer recipient metadata mismatch.');
    if (header.version === 2) {
        if (inner.meta.version !== 2 || !inner.meta.outerHeaderBinding) throw new Error('Fortress V2 authenticated metadata binding is missing.');
        if (fortressCanonicalJson(inner.meta.outerHeaderBinding) !== fortressCanonicalJson(header)) throw new Error('Fortress V2 outer metadata authentication failed.');
    }
    return {data:inner.payload,meta:inner.meta,header,metadataAuthenticated:header.version===2};
}

function fortressHex(bytes) {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

class FortressStreamHasher {
    constructor() {
        this.state = new TextEncoder().encode('PASEVSU-SHA512-CHAIN-V1');
        this.pending = new Uint8Array(0);
        this.blockIndex = 0;
        this.totalBytes = 0;
    }
    async commit(block) {
        const framed = concatBytes(this.state, u32be(this.blockIndex), u32be(block.length), block);
        this.state = new Uint8Array(await crypto.subtle.digest('SHA-512', framed));
        this.blockIndex += 1;
        this.totalBytes += block.length;
    }
    async update(chunk) {
        const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
        if (!bytes.length) return;
        let data = this.pending.length ? concatBytes(this.pending, bytes) : bytes;
        let offset = 0;
        while (data.length - offset >= FORTRESS_STREAM_HASH_BLOCK) {
            await this.commit(data.subarray(offset, offset + FORTRESS_STREAM_HASH_BLOCK));
            offset += FORTRESS_STREAM_HASH_BLOCK;
        }
        this.pending = data.slice(offset);
    }
    async finish() {
        if (this.pending.length || this.blockIndex === 0) await this.commit(this.pending);
        this.pending = new Uint8Array(0);
        return fortressHex(this.state);
    }
}

async function fortressStreamDigestFile(file, onProgress) {
    const hasher = new FortressStreamHasher();
    let processed = 0;
    for await (const chunk of file.stream()) {
        const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
        await hasher.update(bytes);
        processed += bytes.length;
        onProgress?.(processed, file.size);
    }
    return await hasher.finish();
}

function fortressStreamSupported() {
    return typeof ReadableStream !== 'undefined' && typeof TransformStream !== 'undefined' &&
        typeof window.showSaveFilePicker === 'function';
}

async function fortressCreateWritable(handle) {
    try { return await handle.createWritable({ mode:'exclusive' }); }
    catch (e) {
        if (e?.name === 'TypeError' || e?.name === 'NotSupportedError') return await handle.createWritable();
        throw e;
    }
}

async function fortressRejectWritable(writable) {
    if (!writable) return;
    try { await writable.abort('PasevSU Fortress verification failed'); return; } catch {}
    try { await writable.truncate(0); await writable.close(); } catch {}
}

function fortressSetStreamStatus(text, percent = null, tone = 'neutral') {
    const status = document.getElementById('fortressStreamStatus');
    const progress = document.getElementById('fortressStreamProgress');
    if (status) {
        status.textContent = uiText(text);
        status.dataset.tone = tone;
    }
    if (progress && percent !== null) progress.value = Math.max(0, Math.min(100, Number(percent) || 0));
}

async function fortressValidatePublicKeyForStreaming(publicKey) {
    const primaryUser = await publicKey.getPrimaryUser();
    const selfSig = primaryUser?.selfCertification;
    const aeadPrefs = selfSig?.preferredAEADAlgorithms || [];
    const cipherPrefs = selfSig?.preferredSymmetricAlgorithms || [];
    if (!aeadPrefs.length || !cipherPrefs.includes(openpgp.enums.symmetric.aes256)) {
        throw new Error('Fortress requires a v1.5+ Universal MAX key advertising AEAD and AES-256 preferences.');
    }
}

function fortressCanonicalJson(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(fortressCanonicalJson).join(',')}]`;
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${fortressCanonicalJson(value[k])}`).join(',')}}`;
}
function fortressBoundManifestPrefix(header) {
    const bytes = new TextEncoder().encode(fortressCanonicalJson(header));
    if (bytes.length > FORTRESS_STREAM_HEADER_MAX) throw new Error('Authenticated Fortress metadata is too large.');
    return concatBytes(FORTRESS_STREAM_INNER_MAGIC, u32be(bytes.length), bytes);
}
function fortressPrependStream(prefix, stream) {
    const reader = stream.getReader(); let prefixSent = false;
    return new ReadableStream({
        async pull(controller) {
            if (!prefixSent) { prefixSent = true; controller.enqueue(prefix); return; }
            const { done, value } = await reader.read();
            if (done) controller.close(); else controller.enqueue(value);
        },
        cancel(reason) { return reader.cancel(reason); }
    });
}
async function fortressVerifyAndStripBoundManifest(stream, header) {
    const reader = stream.getReader(); let buffer = new Uint8Array(0);
    const minimum = FORTRESS_STREAM_INNER_MAGIC.length + 4;
    while (buffer.length < minimum) {
        const {done,value}=await reader.read(); if(done) throw new Error('Fortress V3 authenticated metadata is truncated.');
        buffer=concatBytes(buffer, value instanceof Uint8Array ? value : new Uint8Array(value));
    }
    if (!startsWithBytes(buffer, FORTRESS_STREAM_INNER_MAGIC)) throw new Error('Fortress V3 authenticated metadata marker is missing.');
    const len = new DataView(buffer.buffer, buffer.byteOffset + FORTRESS_STREAM_INNER_MAGIC.length, 4).getUint32(0,false);
    if (!len || len > FORTRESS_STREAM_HEADER_MAX) throw new Error('Fortress V3 authenticated metadata length is invalid.');
    const required=minimum+len;
    while(buffer.length < required){const {done,value}=await reader.read();if(done)throw new Error('Fortress V3 authenticated metadata is truncated.');buffer=concatBytes(buffer,value instanceof Uint8Array?value:new Uint8Array(value));}
    let inner; try { inner=JSON.parse(new TextDecoder().decode(buffer.subarray(minimum,required))); } catch { throw new Error('Fortress V3 authenticated metadata is invalid JSON.'); }
    if (fortressCanonicalJson(inner) !== fortressCanonicalJson(header)) throw new Error('Fortress V3 outer metadata does not match the authenticated inner manifest.');
    const remainder=buffer.slice(required); let first=true;
    return new ReadableStream({
        async pull(controller){
            if(first){first=false;if(remainder.length){controller.enqueue(remainder);return;}}
            const {done,value}=await reader.read();if(done)controller.close();else controller.enqueue(value);
        },
        cancel(reason){return reader.cancel(reason);}
    });
}

async function fortressBuildEncryptStream(sourceStream, publicKey, layers, password = '') {
    let stream = sourceStream;
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        fortressSetStreamStatus(`Streaming encryption layer ${i + 1}/${layers.length}: ${layer.label}`, 20 + ((i / layers.length) * 55));
        stream = await openpgp.encrypt({
            message: await openpgp.createMessage({ binary: stream }),
            encryptionKeys: publicKey,
            encryptionKeyIDs: layer.keyID,
            format: 'binary',
            config: fortressCryptoConfig()
        });
    }
    if (password) {
        fortressSetStreamStatus('Streaming MAX+ password layer: Argon2id + AES-256-GCM', 78);
        stream = await openpgp.encrypt({
            message: await openpgp.createMessage({ binary: stream }),
            passwords: [password],
            format: 'binary',
            config: fortressPasswordConfig()
        });
    }
    if (!(stream instanceof ReadableStream)) throw new Error('OpenPGP.js did not return a streaming ciphertext.');
    return stream;
}

async function fortressBuildDecryptStream(sourceStream, privateKey, header, fortressPassphrase = '') {
    let stream = sourceStream;
    if (header.passwordLayer) {
        if (!fortressPassphrase) throw new Error('This MAX+ package requires the independent Fortress passphrase.');
        fortressSetStreamStatus('Streaming MAX+ password layer decryption', 12);
        const r = await openpgp.decrypt({
            message: await openpgp.readMessage({ binaryMessage: stream }),
            passwords: [fortressPassphrase],
            format: 'binary',
            config: fortressPasswordConfig()
        });
        stream = r.data;
    }
    const layers = Array.isArray(header.asymmetricLayers) ? header.asymmetricLayers : [];
    if (layers.length !== 4) throw new Error('Fortress Streaming requires exactly four asymmetric layers.');
    for (let i = layers.length - 1; i >= 0; i--) {
        fortressSetStreamStatus(`Streaming decryption layer ${layers.length - i}/${layers.length}: ${layers[i].label || layers[i].id}`, 20 + (((layers.length - 1 - i) / layers.length) * 55));
        const r = await openpgp.decrypt({
            message: await openpgp.readMessage({ binaryMessage: stream }),
            decryptionKeys: privateKey,
            format: 'binary',
            config: fortressCryptoConfig()
        });
        stream = r.data;
    }
    if (!(stream instanceof ReadableStream)) throw new Error('OpenPGP.js did not return a streaming plaintext.');
    return stream;
}

function fortressStreamPrefix(header) {
    const meta = new TextEncoder().encode(JSON.stringify(header));
    if (meta.length > FORTRESS_STREAM_HEADER_MAX) throw new Error('Fortress Streaming header is too large.');
    return concatBytes(FORTRESS_STREAM_MAGIC, u32be(meta.length), meta);
}

async function fortressReadStreamHeader(file) {
    const probeLen = Math.max(FORTRESS_STREAM_MAGIC.length, FORTRESS_STREAM_MAGIC_V2.length) + 4;
    if (file.size < probeLen) throw new Error('Truncated Fortress Streaming file.');
    const probe = new Uint8Array(await file.slice(0, probeLen).arrayBuffer());
    const magic = startsWithBytes(probe, FORTRESS_STREAM_MAGIC) ? FORTRESS_STREAM_MAGIC : (startsWithBytes(probe, FORTRESS_STREAM_MAGIC_V2) ? FORTRESS_STREAM_MAGIC_V2 : null);
    if (!magic) throw new Error('Not a PasevSU Fortress Streaming V2/V3 container.');
    const prefixLen = magic.length + 4;
    const first = probe.subarray(0,prefixLen);
    const metaLen = new DataView(first.buffer, first.byteOffset + magic.length, 4).getUint32(0,false);
    if (!metaLen || metaLen > FORTRESS_STREAM_HEADER_MAX || file.size < prefixLen + metaLen) throw new Error('Invalid Fortress Streaming header length.');
    const metaBytes=new Uint8Array(await file.slice(prefixLen,prefixLen+metaLen).arrayBuffer());
    let header;try{header=JSON.parse(new TextDecoder().decode(metaBytes));}catch{throw new Error('Invalid Fortress Streaming metadata.');}
    if(header.format!=='PasevSU-Fortress-Streaming'||![2,3].includes(header.version))throw new Error('Unsupported Fortress Streaming container version.');
    if(header.version===3 && magic!==FORTRESS_STREAM_MAGIC)throw new Error('Fortress V3 magic/version mismatch.');
    if(header.version===2 && magic!==FORTRESS_STREAM_MAGIC_V2)throw new Error('Fortress V2 magic/version mismatch.');
    return {header,payloadOffset:prefixLen+metaLen,legacyUnboundMetadata:header.version===2};
}

async function fortressStreamingEncryptUi() {
    const pubIdx = document.getElementById('fortressPublicKey').value;
    const profile = document.getElementById('fortressProfile').value;
    const pass = document.getElementById('fortressPassphrase').value;
    const pass2 = document.getElementById('fortressPassphraseConfirm').value;
    const file = document.getElementById('fortressFileInput').files?.[0] || null;
    if (!fortressStreamSupported()) { toast('Direct-to-disk streaming requires a browser with File System Access support.', 'error'); return; }
    if (pubIdx === '') { toast('Select public key.', 'error'); return; }
    if (!file) { toast('Streaming mode requires a file.', 'error'); return; }
    if (profile === 'max4-pass' && (!pass || pass.length < 24)) { toast('MAX+ requires an independent Fortress passphrase of at least 24 characters.', 'error'); return; }
    if (profile === 'max4-pass' && pass !== pass2) { toast('Fortress passphrases do not match.', 'error'); return; }

    let saveHandle;
    try {
        saveHandle = await window.showSaveFilePicker({
            id: 'pasevsu-fortress-stream-encrypt',
            suggestedName: `${file.name}.pasevsu-fortress-v3`,
        });
    } catch (e) { if (e?.name === 'AbortError') return; toast(`Cannot open save-file picker: ${e.message}`, 'error'); return; }

    const btn = document.getElementById('fortressStreamEncryptButton');
    const old = btn.textContent; btn.disabled = true; btn.textContent = uiText('Streaming Encrypting…');
    let writable = null;
    try {
        const publicKey = await openpgp.readKey({ armoredKey: keys[Number(pubIdx)].publicKey });
        await fortressValidatePublicKeyForStreaming(publicKey);
        const layers = await resolveFortressEncryptionLayers(publicKey);
        fortressSetStreamStatus('Pre-hashing source file with SHA-512 chain', 2);
        const digest = await fortressStreamDigestFile(file, (done, total) => {
            fortressSetStreamStatus('Pre-hashing source file with SHA-512 chain', total ? (2 + (done / total) * 15) : 2);
        });
        const header = {
            format: 'PasevSU-Fortress-Streaming', version: 3,
            createdAt: new Date().toISOString(), profile,
            originalName: file.name, originalType: file.type || 'application/octet-stream', originalSize: file.size,
            primaryFingerprint: publicKey.getFingerprint().toUpperCase(),
            asymmetricLayers: layers.map(x => ({ id:x.id, label:x.label, keyID:x.keyIDHex })),
            passwordLayer: profile === 'max4-pass',
            passwordKdf: profile === 'max4-pass' ? 'Argon2id' : null,
            passwordKdfParams: profile === 'max4-pass' ? { passes:3, parallelism:4, memoryKiB:131072 } : null,
            contentCipher: 'AES-256', aead: 'GCM',
            streamDigest: { algorithm:'SHA-512-CHAIN-V1', blockBytes:FORTRESS_STREAM_HASH_BLOCK, value:digest },
            metadataBinding: { mode:'encrypted-inner-manifest-v1', canonicalization:'sorted-json-v1' }
        };
        let sourceDone = 0;
        const sourceProgress = new TransformStream({
            transform(chunk, controller) {
                const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
                sourceDone += bytes.length;
                const pct = file.size ? 20 + Math.min(58, (sourceDone / file.size) * 58) : 50;
                fortressSetStreamStatus('Streaming source through all Fortress encryption layers', pct);
                controller.enqueue(bytes);
            }
        });
        const boundSource = fortressPrependStream(fortressBoundManifestPrefix(header), file.stream().pipeThrough(sourceProgress));
        let stream = await fortressBuildEncryptStream(boundSource, publicKey, layers, profile === 'max4-pass' ? pass : '');
        writable = await fortressCreateWritable(saveHandle);
        await writable.write(fortressStreamPrefix(header));
        fortressSetStreamStatus('Writing encrypted Fortress stream directly to disk', 82);
        await stream.pipeTo(writable);
        writable = null;
        fortressSetStreamStatus('Fortress Streaming V3 encryption completed', 100, 'success');
        document.getElementById('fortressOutput').value = `PasevSU Fortress Streaming V3 OK\n${file.name}\n${file.size} bytes\nSHA-512-CHAIN-V1: ${digest}\nLayers: ${layers.map(x=>x.label).join(' → ')}${profile === 'max4-pass' ? ' → Argon2id password layer' : ''}`;
        toast('Fortress Streaming V3 encryption completed with authenticated metadata binding.');
    } catch (e) {
        try { await writable?.abort?.(); } catch {}
        fortressSetStreamStatus(`Streaming encryption failed: ${e.message}`, 0, 'error');
        toast(`Fortress streaming encryption failed: ${e.message}`, 'error');
    } finally { btn.disabled = false; btn.textContent = old; }
}

async function fortressStreamingDecryptUi() {
    const privIdx = document.getElementById('fortressPrivateKey').value;
    const keyPass = document.getElementById('fortressPrivatePassphrase').value;
    const fortressPass = document.getElementById('fortressPassphrase').value;
    const file = document.getElementById('fortressFileInput').files?.[0] || null;
    if (!fortressStreamSupported()) { toast('Direct-to-disk streaming requires a browser with File System Access support.', 'error'); return; }
    if (privIdx === '') { toast('Select private key.', 'error'); return; }
    if (!file) { toast('Streaming mode requires a file.', 'error'); return; }

    let saveHandle;
    try {
        const suggested = file.name.replace(/\.pasevsu-fortress-v[23]$/i, '') || 'fortress-decrypted.bin';
        saveHandle = await window.showSaveFilePicker({ id:'pasevsu-fortress-stream-decrypt', suggestedName:suggested });
    } catch (e) { if (e?.name === 'AbortError') return; toast(`Cannot open save-file picker: ${e.message}`, 'error'); return; }

    const btn = document.getElementById('fortressStreamDecryptButton');
    const old = btn.textContent; btn.disabled = true; btn.textContent = uiText('Streaming Decrypting…');
    let writable = null;
    try {
        const { header, payloadOffset, legacyUnboundMetadata } = await fortressReadStreamHeader(file);
        if (legacyUnboundMetadata && !confirm(uiText('Legacy Fortress Streaming V2 has integrity protection for plaintext but its outer metadata is not cryptographically bound. Continue legacy decryption?'))) return;
        let privateKey = await openpgp.readPrivateKey({ armoredKey: keys[Number(privIdx)].privateKey });
        if (!privateKey.isDecrypted()) {
            if (!keyPass) throw new Error('Private-key passphrase required.');
            privateKey = await openpgp.decryptKey({ privateKey, passphrase:keyPass });
        }
        if (header.primaryFingerprint && privateKey.getFingerprint().toUpperCase() !== header.primaryFingerprint) {
            throw new Error('Selected private key does not match the Fortress recipient fingerprint.');
        }
        if (header.passwordLayer && !fortressPass) throw new Error('This MAX+ package requires the independent Fortress passphrase.');
        let stream = await fortressBuildDecryptStream(file.slice(payloadOffset).stream(), privateKey, header, fortressPass);
        if (header.version === 3) stream = await fortressVerifyAndStripBoundManifest(stream, header);
        const hasher = new FortressStreamHasher();
        let processed = 0;
        const verifyTransform = new TransformStream({
            async transform(chunk, controller) {
                const bytes = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
                await hasher.update(bytes);
                processed += bytes.length;
                const pct = header.originalSize ? 78 + Math.min(20, (processed / header.originalSize) * 20) : 90;
                fortressSetStreamStatus('Writing verified plaintext stream to disk', pct);
                controller.enqueue(bytes);
            }
        });
        writable = await fortressCreateWritable(saveHandle);
        await stream.pipeThrough(verifyTransform).pipeTo(writable, { preventClose:true });
        const digest = await hasher.finish();
        const expected = String(header.streamDigest?.value || '').toLowerCase();
        if (!expected || header.streamDigest?.algorithm !== 'SHA-512-CHAIN-V1' || digest.toLowerCase() !== expected) {
            await fortressRejectWritable(writable);
            writable = null;
            throw new Error('Fortress Streaming SHA-512 chain verification failed; output was rejected.');
        }
        if (Number.isFinite(Number(header.originalSize)) && processed !== Number(header.originalSize)) {
            await fortressRejectWritable(writable);
            writable = null;
            throw new Error(`Fortress Streaming size verification failed (${processed} != ${header.originalSize}); output was rejected.`);
        }
        await writable.close(); writable = null;
        fortressSetStreamStatus(header.version === 3 ? 'Fortress Streaming V3 authenticated metadata and plaintext integrity verified' : 'Legacy Fortress Streaming V2 plaintext integrity verified', 100, 'success');
        document.getElementById('fortressOutput').value = `PasevSU Fortress Streaming V${header.version} VERIFIED\nOriginal: ${header.originalName || 'unknown'}\nSize: ${processed} bytes\nSHA-512-CHAIN-V1: ${digest}\nLayers: ${header.asymmetricLayers?.length || 0}${header.passwordLayer ? ' + Argon2id' : ''}`;
        toast(header.version === 3 ? 'Fortress Streaming V3 authenticated metadata and plaintext integrity verified.' : 'Legacy Fortress Streaming V2 plaintext integrity verified; outer metadata was not authenticated.');
    } catch (e) {
        try { await writable?.abort?.(); } catch {}
        fortressSetStreamStatus(`Streaming decryption failed: ${e.message}`, 0, 'error');
        toast(`Fortress streaming decryption failed: ${e.message}`, 'error');
    } finally { btn.disabled = false; btn.textContent = old; }
}

function fortressSetDownload(blob, filename) {
    const host = document.getElementById('fortressDownloadHost');
    host.innerHTML = '';
    const a = document.createElement('a');
    a.className = 'btn btn-muted';
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.textContent = `${uiText('Download')} ${filename}`;
    host.appendChild(a);
}

async function fortressEncryptUi() {
    const pubIdx = document.getElementById('fortressPublicKey').value;
    const profile = document.getElementById('fortressProfile').value;
    const pass = document.getElementById('fortressPassphrase').value;
    const pass2 = document.getElementById('fortressPassphraseConfirm').value;
    const file = document.getElementById('fortressFileInput').files?.[0] || null;
    const text = document.getElementById('fortressTextInput').value;
    const out = document.getElementById('fortressOutput');
    if (pubIdx === '') { toast('Select public key.', 'error'); return; }
    if (!file && !text) { toast('Enter text or select a file.', 'error'); return; }
    if (profile === 'max4-pass' && pass !== pass2) { toast('Fortress passphrases do not match.', 'error'); return; }

    const btn = document.getElementById('fortressEncryptButton');
    const old = btn.textContent; btn.disabled = true; btn.textContent = uiText('Fortress Encrypting…');
    try {
        const publicKey = await openpgp.readKey({ armoredKey: keys[Number(pubIdx)].publicKey });
        const plain = file ? new Uint8Array(await file.arrayBuffer()) : new TextEncoder().encode(text);
        const originalMeta = file ? { name:file.name, type:file.type || 'application/octet-stream' } : { name:null, type:'text/plain;charset=utf-8' };
        const result = await fortressEncryptPayload(plain, publicKey, profile, originalMeta);
        let encrypted = result.payload;
        if (profile === 'max4-pass') encrypted = await fortressAddPasswordLayer(encrypted, pass, result.header);
        const container = packBinaryEnvelope(FORTRESS_CONTAINER_MAGIC_V2, result.header, encrypted);
        const de = window.PasevSUI18n?.language === 'de';
        out.value = de
            ? `PasevSU Fortress OK\nSchichten: ${result.header.asymmetricLayers.length}${result.header.passwordLayer ? ' + Argon2id-Passphrase-Schicht' : ''}\nEmpfänger: ${result.header.primaryFingerprint}\nChiffre: AES-256 / ${result.header.aead}\nIntegrität: AEAD + SHA-512`
            : `PasevSU Fortress OK\nСлоеве: ${result.header.asymmetricLayers.length}${result.header.passwordLayer ? ' + Argon2id слой с парола' : ''}\nПолучател: ${result.header.primaryFingerprint}\nШифър: AES-256 / ${result.header.aead}\nЦялост: AEAD + SHA-512`;
        if (file) {
            fortressSetDownload(new Blob([container], {type:'application/octet-stream'}), `${file.name}.pasevsu-fortress`);
        } else {
            const armored = armorFortress(container);
            out.value = armored;
            fortressSetDownload(new Blob([armored], {type:'text/plain;charset=utf-8'}), 'message.pasevsu-fortress.asc');
        }
        toast('Fortress V2 encryption completed with authenticated metadata binding.');
    } catch (e) { toast(`Fortress encryption failed: ${e.message}`, 'error'); out.value = `ERROR: ${e.message}`; }
    finally { btn.disabled = false; btn.textContent = old; }
}

async function fortressDecryptUi() {
    const privIdx = document.getElementById('fortressPrivateKey').value;
    const keyPass = document.getElementById('fortressPrivatePassphrase').value;
    const fortressPass = document.getElementById('fortressPassphrase').value;
    const file = document.getElementById('fortressFileInput').files?.[0] || null;
    const text = document.getElementById('fortressTextInput').value.trim();
    const out = document.getElementById('fortressOutput');
    if (privIdx === '') { toast('Select private key.', 'error'); return; }
    if (!file && !text) { toast('Select a Fortress file or paste an armored Fortress package.', 'error'); return; }

    const btn = document.getElementById('fortressDecryptButton');
    const old = btn.textContent; btn.disabled = true; btn.textContent = uiText('Fortress Decrypting…');
    try {
        let privateKey = await openpgp.readPrivateKey({ armoredKey: keys[Number(privIdx)].privateKey });
        if (!privateKey.isDecrypted()) {
            if (!keyPass) throw new Error('Private-key passphrase required.');
            privateKey = await openpgp.decryptKey({ privateKey, passphrase:keyPass });
        }
        const container = file ? new Uint8Array(await file.arrayBuffer()) : dearmorFortress(text);
        const result = await fortressDecryptPayload(container, privateKey, fortressPass);
        const isText = String(result.meta.originalType || '').startsWith('text/');
        if (isText && !result.meta.originalName) {
            out.value = new TextDecoder().decode(result.data);
        } else {
            const de = window.PasevSUI18n?.language === 'de';
            out.value = de
                ? `PasevSU Fortress VERIFIZIERT\nSHA-512: ${result.meta.sha512}\nOriginalgröße: ${result.meta.originalSize} Bytes\nSchichten: ${result.header.asymmetricLayers.length}${result.header.passwordLayer ? ' + Argon2id' : ''}`
                : `PasevSU Fortress ПРОВЕРЕН\nSHA-512: ${result.meta.sha512}\nОригинален размер: ${result.meta.originalSize} байта\nСлоеве: ${result.header.asymmetricLayers.length}${result.header.passwordLayer ? ' + Argon2id' : ''}`;
            fortressSetDownload(new Blob([result.data], {type:result.meta.originalType || 'application/octet-stream'}), result.meta.originalName || 'fortress-decrypted.bin');
        }
        toast(result.metadataAuthenticated ? 'Fortress V2 authenticated metadata and SHA-512 verification completed.' : 'Legacy Fortress V1 decrypted; outer metadata was not authenticated.');
    } catch (e) { toast(`Fortress decryption failed: ${e.message}`, 'error'); out.value = `ERROR: ${e.message}`; }
    finally { btn.disabled = false; btn.textContent = old; }
}

function bindFortressEngine() {
    const profile = document.getElementById('fortressProfile');
    const passRow = document.getElementById('fortressPassphraseRow');
    const sync = () => { if (passRow) passRow.hidden = profile?.value !== 'max4-pass'; };
    profile?.addEventListener('change', sync); sync();
    document.getElementById('fortressEncryptButton')?.addEventListener('click', fortressEncryptUi);
    document.getElementById('fortressDecryptButton')?.addEventListener('click', fortressDecryptUi);
    document.getElementById('fortressStreamEncryptButton')?.addEventListener('click', fortressStreamingEncryptUi);
    document.getElementById('fortressStreamDecryptButton')?.addEventListener('click', fortressStreamingDecryptUi);
    document.getElementById('fortressClearButton')?.addEventListener('click', () => {
        document.getElementById('fortressTextInput').value = '';
        document.getElementById('fortressFileInput').value = '';
        document.getElementById('fortressOutput').value = '';
        document.getElementById('fortressDownloadHost').innerHTML = '';
        fortressSetStreamStatus('Streaming engine ready', 0);
        document.getElementById('fortressPassphrase').value = '';
        document.getElementById('fortressPassphraseConfirm').value = '';
    });
}

/* ---------------------------------------------------------------------
 * SIGN / VERIFY
 * ------------------------------------------------------------------- */
async function signMessage() {
    const message = document.getElementById('messageToSign').value.trim();
    const keyIndex = document.getElementById('signPrivateKeySelect').value;
    const password = document.getElementById('signPrivateKeyPassword').value;

    if (!message) { toast('Enter a message.', 'error'); return; }
    if (keyIndex === '') { toast('Select private key.', 'error'); return; }

    try {
        let privateKey = await openpgp.readPrivateKey({ armoredKey: keys[keyIndex].privateKey });
        if (!privateKey.isDecrypted() && password) {
            privateKey = await openpgp.decryptKey({ privateKey, passphrase: password });
        }
        const signed = await openpgp.sign({
            message: await openpgp.createCleartextMessage({ text: message }),
            signingKeys: privateKey,
            detached: false
        });
        document.getElementById('signedMessage').value = signed;
        toast('Signed.');
    } catch (error) {
        toast(`Signing failed: ${error.message}`, 'error');
    }
}

async function verifyMessage() {
    const message = document.getElementById('messageToVerify').value.trim();
    const keyIndex = document.getElementById('verifyPublicKeySelect').value;

    if (!message) { toast('Enter signed message.', 'error'); return; }
    if (keyIndex === '') { toast('Select public key.', 'error'); return; }

    try {
        const publicKey = await openpgp.readKey({ armoredKey: keys[keyIndex].publicKey });
        let verified;
        if (/-----BEGIN PGP SIGNED MESSAGE-----/i.test(message)) {
            const clear = await openpgp.readCleartextMessage({ cleartextMessage: message });
            verified = await openpgp.verify({ message: clear, verificationKeys: publicKey });
        } else if (/-----BEGIN PGP MESSAGE-----/i.test(message)) {
            const msg = await openpgp.readMessage({ armoredMessage: message });
            verified = await openpgp.verify({ message: msg, verificationKeys: publicKey, expectSigned: true });
        } else {
            throw new Error('Unrecognized armored data.');
        }
        const signatures=verified?.signatures || [];
        if(!signatures.length) throw new Error('No signature found.');
        let valid=0; for(const sig of signatures){try{if(await sig.verified)valid++;}catch{}}
        if(valid>0) toast(`Signature verification: ${valid}/${signatures.length} valid for the selected public key.`);
        else toast('Verification failed: no valid signature from the selected key.', 'error');
    } catch (error) {
        toast(`Verification failed: ${error.message}`, 'error');
    }
}

async function verifyDetachedSignature() {
    const sigFile = document.getElementById('detachedSigFile')?.files?.[0];
    const dataFile = document.getElementById('detachedDataFile')?.files?.[0];
    const keyIdx = document.getElementById('verifyPublicKeySelect').value;
    const result = document.getElementById('detachedResult');

    if (!sigFile) { toast('Select signature file.', 'error'); return; }
    if (!dataFile) { toast('Select data file.', 'error'); return; }
    if (keyIdx === '') { toast('Select signer\'s public key.', 'error'); return; }

    result.innerHTML = 'Verifying…';
    try {
        const publicKey = await openpgp.readKey({ armoredKey: keys[keyIdx].publicKey });
        const sigText = await sigFile.text();
        let signature;
        try { signature = await openpgp.readSignature({ armoredSignature: sigText }); }
        catch {
            const sigBytes = new Uint8Array(await sigFile.arrayBuffer());
            signature = await openpgp.readSignature({ binarySignature: sigBytes });
        }
        const dataBytes = new Uint8Array(await dataFile.arrayBuffer());
        const message = await openpgp.createMessage({ binary: dataBytes });
        const verification = await openpgp.verify({ message, signature, verificationKeys: publicKey });
        const signatures=verification.signatures || []; let valid=0;
        for(const sig of signatures){try{if(await sig.verified)valid++;}catch{}}
        if(valid>0) result.textContent=`✓ Signature verification: ${valid}/${signatures.length} valid.`;
        else result.textContent='✗ Signature verification failed.';
    } catch (error) {
        result.innerHTML = `<span style="color:#dc2626;">✗ ${escapeHtml(error.message)}</span>`;
    }
}

/* ---------------------------------------------------------------------
 * DELETE
 * ------------------------------------------------------------------- */
async function deleteKey(index) {
    if (!confirm(uiText('Delete this key?'))) return;
    await dbCreateSnapshot('delete-single');
    keys.splice(index, 1);
    await saveKeysToLocalStorage();
    refreshKeyList();
    toast('Key deleted.');
}

function getSelectedIndices() {
    return Array.from(document.querySelectorAll('.row-select:checked'))
        .map(cb => Number(cb.dataset.index))
        .sort((a, b) => b - a);
}

function updateSelectionInfo() {
    const n = document.querySelectorAll('.row-select:checked').length;
    const el = document.getElementById('selectionInfo');
    if (el) el.textContent = n > 0 ? `${n} selected` : '';
}

function exportSelectedKeys() {
    const indices = getSelectedIndices().reverse();
    if (indices.length === 0) { toast('Select keys.', 'error'); return; }
    const armored = indices.map(i => keys[i].publicKey).filter(Boolean).join('\n');
    const blob = new Blob([armored], { type: 'application/pgp-keys' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pgp-keys-export-${Date.now()}.asc`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${indices.length} key(s).`);
}

async function deleteSelectedKeys() {
    const indices = getSelectedIndices();
    if (indices.length === 0) { toast('Select keys.', 'error'); return; }
    if (!confirm(uiText(`Delete ${indices.length} key(s)?`))) return;
    await dbCreateSnapshot('delete-batch');
    indices.forEach(i => keys.splice(i, 1));
    await saveKeysToLocalStorage();
    refreshKeyList();
    toast(`Deleted ${indices.length} key(s).`);
}

/* ---------------------------------------------------------------------
 * KEYSERVERS
 * ------------------------------------------------------------------- */
const KEY_SERVERS = [
  { name: 'keys.openpgp.org',       url: 'https://keys.openpgp.org',       verifying: true  },
  { name: 'keyserver.ubuntu.com',   url: 'https://keyserver.ubuntu.com',   verifying: false },
  { name: 'keys.mailvelope.com',    url: 'https://keys.mailvelope.com',    verifying: false },
  { name: 'keyserver.pgp.com',      url: 'https://keyserver.pgp.com',      verifying: false },
  { name: 'pgp.key-server.io',      url: 'https://pgp.key-server.io',      verifying: false },
  { name: 'keys.gnupg.net',         url: 'https://keys.gnupg.net',         verifying: false },
  { name: 'pgp.uni-mainz.de',       url: 'https://pgp.uni-mainz.de',       verifying: false },
  { name: 'keyserver.cryptnet.net', url: 'https://keyserver.cryptnet.net', verifying: false },
  { name: 'keys.niif.hu',           url: 'https://keys.niif.hu',           verifying: false },
  { name: 'pgp.mit.edu',            url: 'https://pgp.mit.edu',            verifying: false }
];

const PROXY_CANDIDATES = [
    '', // same origin — preferred when server/server.js serves the frontend
    'http://127.0.0.1:3000',
    'http://localhost:3000'
];
let PROXY_URL = '';
let proxyAvailable = null;

async function checkProxyAvailability() {
    if (proxyAvailable !== null) return proxyAvailable;
    for (const candidate of PROXY_CANDIDATES) {
        try {
            const r = await fetch(`${candidate}/api/health`, { cache: 'no-store' });
            if (r.ok) {
                PROXY_URL = candidate;
                proxyAvailable = true;
                return true;
            }
        } catch { /* try next candidate */ }
    }
    proxyAvailable = false;
    return false;
}

function renderServerList() {
    const wrap = document.getElementById('serverList');
    if (!wrap) return;
    wrap.innerHTML = '';
    KEY_SERVERS.forEach((server, idx) => {
        const label = document.createElement('label');
        label.style.cssText = 'display:flex;align-items:center;gap:.5rem;font-size:.9rem;margin:0;';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'srv-checkbox';
        cb.dataset.serverIndex = String(idx);
        cb.checked = true;
        const span = document.createElement('span');
        span.textContent = server.name + (server.verifying ? ' (verifying)' : '');
        if (server.verifying) span.style.opacity = '.7';
        label.appendChild(cb);
        label.appendChild(span);
        wrap.appendChild(label);
    });
}

async function uploadPublicKeySmart(server, armoredPublicKey) {
    if (!(await checkProxyAvailability())) throw new Error('PasevSU local server is required for keyserver publishing.');
    const r = await fetch(`${PROXY_URL}/api/publish/${encodeURIComponent(server.name)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keytext: armoredPublicKey })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.ok) throw new Error(data.error || `Proxy HTTP ${r.status}`);
    return { viaProxy: true, message: data.message };
}

async function publishSelectedKey() {
    const select = document.getElementById('publishKeySelect');
    const keyIndex = select.value;
    if (keyIndex === '') { toast('Select key.', 'error'); return; }
    const key = keys[keyIndex];
    if (!key?.publicKey) { toast('No public part.', 'error'); return; }

    const selected = Array.from(document.querySelectorAll('.srv-checkbox:checked'))
        .map(cb => KEY_SERVERS[Number(cb.dataset.serverIndex)]);
    if (selected.length === 0) { toast('Select servers.', 'error'); return; }

    const results = document.getElementById('publishResults');
    results.innerHTML = '';
    const btn = document.getElementById('publishKeyButton');
    const prev = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Publishing…';

    const publishedTo = [];
    const proxyReady = await checkProxyAvailability();

    try {
        for (const server of selected) {
            const row = document.createElement('div');
            row.style.cssText = 'padding:.45rem .65rem;border-radius:6px;border:1px solid var(--border);font-size:.9rem;display:flex;justify-content:space-between;gap:.5rem;';
            row.innerHTML = `<span>${server.name}${proxyReady ? ' <em>(proxy)</em>' : ''}</span><span style="opacity:.7">pending…</span>`;
            results.appendChild(row);

            try {
                const result = await uploadPublicKeySmart(server, key.publicKey);
                const extra = result.message ? ` — ${result.message}` : '';
                row.innerHTML = `<span>${server.name}</span><span style="color:#16a34a">✓ uploaded${escapeHtml(extra)}</span>`;
                publishedTo.push({ name: server.name, url: server.url, status: 'ok', at: new Date().toISOString() });
            } catch (error) {
                row.innerHTML = `<span>${server.name}</span><span style="color:#dc2626">✗ ${escapeHtml(error.message)}</span>`;
                publishedTo.push({ name: server.name, url: server.url, status: 'error', error: error.message, at: new Date().toISOString() });
            }
        }
        key.publishHistory = Array.isArray(key.publishHistory) ? key.publishHistory : [];
        key.publishHistory.push(...publishedTo);
        await saveKeysToLocalStorage();
        const ok = publishedTo.filter(p => p.status === 'ok').length;
        toast(`Published: ${ok}/${selected.length}.`);
    } finally {
        btn.disabled = false;
        btn.textContent = prev;
    }
}

async function lookupKeyFromServer() {
    const query = prompt(uiText('Enter fingerprint or key ID (hex):'));
    if (!query) return;
    if (!/^(0x)?[0-9A-Fa-f]{8,40}$/.test(query)) { toast('Invalid format.', 'error'); return; }

    const useProxy = await checkProxyAvailability();
    if (!useProxy) { toast('Proxy required for lookup.', 'error'); return; }

    const host = prompt(uiText(`Server number (1-${KEY_SERVERS.length}):\n${KEY_SERVERS.map((s, i) => `${i + 1}. ${s.name}`).join('\n')}`), '1');
    const idx = Number(host) - 1;
    if (!KEY_SERVERS[idx]) { toast('Cancelled.', 'info'); return; }

    try {
        const r = await fetch(`${PROXY_URL}/api/lookup/${encodeURIComponent(KEY_SERVERS[idx].name)}/${encodeURIComponent(query)}`);
        const data = await r.json();
        if (!r.ok || !data.ok) throw new Error(data.error || 'Failed');
        document.getElementById('key').value = data.armored;
        toast('Key fetched. Press "Import key".');
        document.querySelector('#manage-summary')?.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        toast(`Lookup failed: ${error.message}`, 'error');
    }
}

async function refreshAllKeysFromServers() {
    const btn = document.getElementById('refreshAllKeysButton');
    if (btn) { btn.disabled = true; btn.textContent = 'Refreshing…'; }
    let updated = 0, checked = 0, errors = 0;
    try {
        if (!(await checkProxyAvailability())) throw new Error('PasevSU local server is required for key refresh.');
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]; if (!key.publicKey) continue; checked++;
            const fp = key.fingerprint.replace(/\s+/g, '').toUpperCase();
            try {
                const r = await fetch(`${PROXY_URL}/api/lookup/keys.openpgp.org/${encodeURIComponent(fp)}`, { cache:'no-store' });
                if (r.status === 404) continue;
                const data = await r.json().catch(() => ({}));
                if (!r.ok || !data.ok) throw new Error(data.error || `HTTP ${r.status}`);
                const fresh = await openpgp.readKey({ armoredKey:data.armored });
                const localParsed = key.privateKey
                    ? await openpgp.readPrivateKey({ armoredKey:key.privateKey })
                    : await openpgp.readKey({ armoredKey:key.publicKey });
                const merged = await localParsed.update(fresh, new Date(), openpgp.config);
                const mergedPublic = merged.isPrivate?.() ? merged.toPublic().armor() : merged.armor();
                const publicChanged = mergedPublic !== key.publicKey;
                if (merged.isPrivate?.()) key.privateKey = merged.armor();
                key.publicKey = mergedPublic;
                const refreshedPublic = merged.isPrivate?.() ? merged.toPublic() : merged;
                try { if (await refreshedPublic.getExpirationTime() === null) key.revoked=true; } catch {}
                if (publicChanged) updated++;
                key.lastRefreshedAt = new Date().toISOString();
            } catch { errors++; }
        }
        if (checked > 0) await saveKeysToLocalStorage();
        refreshKeyList();
        toast(`Refresh: ${updated} updated, ${Math.max(0, checked-updated-errors)} unchanged, ${errors} errors.`);
    } catch (error) { toast(`Refresh failed: ${error.message}`, 'error'); }
    finally { if (btn) { btn.disabled=false; btn.textContent='Refresh all from keyservers'; } }
}

/* ---------------------------------------------------------------------
 * MERGE
 * ------------------------------------------------------------------- */
async function mergeKeyFromInput() {
    const armored = document.getElementById('mergeKeyInput').value.trim();
    const resultHost = document.getElementById('mergeResult');
    if (!armored) { toast('Paste armored key.', 'error'); return; }

    try {
        let incoming;
        try { incoming = await openpgp.readPrivateKey({ armoredKey: armored }); }
        catch { incoming = await openpgp.readKey({ armoredKey: armored }); }

        const fp = incoming.getFingerprint().toUpperCase();
        const existingIdx = keys.findIndex(k => k.fingerprint === fp);

        if (existingIdx === -1) {
            resultHost.innerHTML = '<span style="color:#f59e0b;">No matching key — use Import.</span>';
            return;
        }

        const existing = keys[existingIdx];
        const localParsed = existing.privateKey
            ? await openpgp.readPrivateKey({ armoredKey: existing.privateKey })
            : await openpgp.readKey({ armoredKey: existing.publicKey });

        const merged = await localParsed.update(incoming, new Date(), openpgp.config);
        const armoredMerged = merged.armor();

        if (existing.privateKey) {
            keys[existingIdx].privateKey = armoredMerged;
            keys[existingIdx].publicKey = merged.toPublic().armor();
        } else {
            keys[existingIdx].publicKey = armoredMerged;
        }
        keys[existingIdx].lastMergedAt = new Date().toISOString();
        await saveKeysToLocalStorage();
        refreshKeyList();
        resultHost.innerHTML = '<span style="color:#16a34a;">✓ Merged.</span>';
        toast('Key merged.');
    } catch (error) {
        document.getElementById('mergeResult').innerHTML = `<span style="color:#dc2626;">✗ ${escapeHtml(error.message)}</span>`;
    }
}

/* ---------------------------------------------------------------------
 * MANIFEST
 * ------------------------------------------------------------------- */
async function buildManifest(keyIndex) {
    const key = keys[keyIndex];
    if (!key) throw new Error('Key not found.');
    const armored = key.privateKey || key.publicKey;
    const parsed = key.privateKey
        ? await openpgp.readPrivateKey({ armoredKey: armored })
        : await openpgp.readKey({ armoredKey: armored });

    const algo = parsed.getAlgorithmInfo();
    const createdRaw = parsed.getCreationTime();
    const expiresRaw = await parsed.getExpirationTime();

    const users = (parsed.users ?? []).map(u => ({
        userID: u.userID?.userID ?? null, name: u.userID?.name ?? null,
        email: u.userID?.email ?? null, comment: u.userID?.comment ?? null
    }));

    const subkeys = [];
    for (const sk of (parsed.getSubkeys?.() ?? [])) {
        const info = sk.getAlgorithmInfo();
        const skExpires = await sk.getExpirationTime();
        subkeys.push({
            fingerprint: sk.getFingerprint().toUpperCase(),
            keyID: sk.getKeyID().toHex().toUpperCase(),
            algorithm: info.algorithm, bits: info.bits ?? null, curve: info.curve ?? null,
            createdAt: sk.getCreationTime()?.toISOString?.() ?? null,
            expiresAt: skExpires instanceof Date ? skExpires.toISOString() : null,
            neverExpires: skExpires === Infinity,
            validityStatus: skExpires === null ? 'invalid-or-revoked' : (skExpires === Infinity ? 'no-expiration' : 'dated-expiration')
        });
    }

    return {
        manifestVersion: '1.0',
        generatedAt: new Date().toISOString(),
        generatedBy: 'PasevSU PGP Toolbox',
        key: {
            fingerprint: parsed.getFingerprint().toUpperCase(),
            keyID: parsed.getKeyID().toHex().toUpperCase(),
            version: parsed.keyPacket?.version ?? null,
            algorithm: algo.algorithm,
            bits: algo.bits ?? null, curve: algo.curve ?? null,
            createdAt: createdRaw?.toISOString?.() ?? null,
            expiresAt: expiresRaw?.toISOString?.() ?? null,
            neverExpires: expiresRaw === Infinity,
            validityStatus: expiresRaw === null ? 'invalid-or-revoked' : (expiresRaw === Infinity ? 'no-expiration' : 'dated-expiration'),
            sourceContainsPrivateMaterial: parsed.isPrivate(),
            privateMaterialIncluded: false,
            users, subkeys,
            publicKeyArmored: parsed.isPrivate() ? parsed.toPublic().armor() : parsed.armor()
        },
        extendedMetadata: key.meta || {},
        userMetadata: {
            email: key.email || null, comment: key.comment || null, userLabel: key.userLabel || null
        },
        publishedTo: key.publishHistory || []
    };
}

async function generateManifest() {
    const idx = document.getElementById('metaKeySelect').value;
    if (idx === '') { toast('Select key.', 'error'); return; }
    try {
        const manifest = await buildManifest(Number(idx));
        document.getElementById('manifestOutput').value = JSON.stringify(manifest, null, 2);
        toast('Manifest generated.');
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
}

async function downloadManifest() {
    const idx = document.getElementById('metaKeySelect').value;
    if (idx === '') { toast('Select key.', 'error'); return; }
    try {
        const manifest = await buildManifest(Number(idx));
        const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pgp-manifest-${manifest.key.fingerprint.slice(-16)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
}

function importManifest() {
    const input = document.getElementById('manifestFileInput');
    if (input) { input.value = ''; input.click(); }
}

async function handleManifestFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
        const text = await file.text();
        const manifest = JSON.parse(text);
        document.getElementById('manifestOutput').value = JSON.stringify(manifest, null, 2);
        toast('Manifest imported — review below.');
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
}

function loadMetadataForSelectedKey() {
    const idx = document.getElementById('metaKeySelect').value;
    const fields = {
        metaOrganization: 'organization', metaWebsite: 'website',
        metaPhone: 'phone', metaLocation: 'location', metaNotes: 'notes'
    };
    if (idx === '') {
        Object.keys(fields).forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        const tagsEl = document.getElementById('metaTags'); if (tagsEl) tagsEl.value = '';
        return;
    }
    const meta = keys[idx]?.meta || {};
    Object.entries(fields).forEach(([id, prop]) => {
        const el = document.getElementById(id);
        if (el) el.value = meta[prop] ?? '';
    });
    const tagsEl = document.getElementById('metaTags');
    if (tagsEl) tagsEl.value = Array.isArray(meta.tags) ? meta.tags.join(', ') : '';
}

async function saveExtendedMetadata() {
    const idx = document.getElementById('metaKeySelect').value;
    if (idx === '') { toast('Select key.', 'error'); return; }
    const tagsRaw = document.getElementById('metaTags')?.value || '';
    keys[idx].meta = {
        organization: document.getElementById('metaOrganization')?.value.trim() || null,
        website: document.getElementById('metaWebsite')?.value.trim() || null,
        phone: document.getElementById('metaPhone')?.value.trim() || null,
        location: document.getElementById('metaLocation')?.value.trim() || null,
        notes: document.getElementById('metaNotes')?.value.trim() || null,
        tags: tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    };
    await saveKeysToLocalStorage();
    toast('Metadata saved.');
}

/* ---------------------------------------------------------------------
 * PASSPHRASE
 * ------------------------------------------------------------------- */
async function readDecryptedPrivateKey(armored, passphrase) {
    const privateKey = await openpgp.readPrivateKey({ armoredKey: armored });
    if (privateKey.isDecrypted()) return { key: privateKey };
    if (!passphrase) throw new Error('Passphrase required.');
    const decrypted = await openpgp.decryptKey({ privateKey, passphrase });
    return { key: decrypted };
}

async function changeKeyPassphrase() {
    const idx = document.getElementById('passphraseKeySelect').value;
    if (idx === '') { toast('Select key.', 'error'); return; }
    const oldPass = document.getElementById('oldPassphrase').value;
    const newPass = document.getElementById('newPassphrase').value;
    const confirmPass = document.getElementById('confirmPassphrase').value;

    if (!keys[idx].privateKey) { toast('No private part.', 'error'); return; }
    if (!newPass || newPass.length < 16) { toast('New passphrase must contain at least 16 characters.', 'error'); return; }
    if (newPass !== confirmPass) { toast('Passphrases do not match.', 'error'); return; }

    try {
        const { key: decrypted } = await readDecryptedPrivateKey(keys[idx].privateKey, oldPass);
        const reEncrypted = await openpgp.encryptKey({ privateKey: decrypted, passphrase:newPass, config:{ ...(window.PasevSUAdvanced?.config?.() || {}), s2kType:openpgp.enums.s2k.argon2, s2kArgon2Params:{passes:3,parallelism:4,memoryExponent:17}, maxArgon2MemoryExponent:18 } });
        keys[idx].privateKey = reEncrypted.armor();
        await saveKeysToLocalStorage();
        refreshKeyList();
        ['oldPassphrase', 'newPassphrase', 'confirmPassphrase'].forEach(id => {
            const el = document.getElementById(id); if (el) el.value = '';
        });
        toast('Passphrase changed.');
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
}



/* ---------------------------------------------------------------------
 * REVOCATION CERTIFICATE
 * ------------------------------------------------------------------- */
async function generateRevocationCertificate() {
    const idx = document.getElementById('revocationKeySelect').value;
    if (idx === '') { toast('Select key.', 'error'); return; }
    const key = keys[idx];
    if (!key?.privateKey) { toast('No private part.', 'error'); return; }
    const passphrase = document.getElementById('revocationPassphrase').value;
    const reasonName = document.getElementById('revocationReason')?.value || 'noReason';
    const reasonText = document.getElementById('revocationString')?.value.trim() || '';
    const flag = openpgp.enums.reasonForRevocation?.[reasonName];
    if (flag === undefined) { toast('Unsupported revocation reason.', 'error'); return; }
    try {
        const { key: decrypted } = await readDecryptedPrivateKey(key.privateKey, passphrase);
        // getRevocationCertificate() only extracts a certificate from a revoked key.
        // Create a revoked clone first; the stored identity is NOT modified here.
        const revokedClone = await decrypted.revoke({ flag, string: reasonText }, new Date(), openpgp.config);
        const certOnly = await revokedClone.getRevocationCertificate(new Date(), openpgp.config);
        if (!/-----BEGIN PGP PUBLIC KEY BLOCK-----/.test(certOnly)) throw new Error('OpenPGP.js did not return an armored revocation certificate.');
        document.getElementById('revocationOutput').value = certOnly;
        document.getElementById('downloadRevocationButton').disabled = false;
        toast('Revocation certificate generated from a revoked clone; the stored key remains active until you explicitly apply the certificate.', 'warning');
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
}

function downloadRevocationCertificate() {
    const armored = document.getElementById('revocationOutput').value.trim();
    if (!armored) return;
    const idx = document.getElementById('revocationKeySelect').value;
    const fp = keys[idx]?.fingerprint || 'unknown';
    const blob = new Blob([armored], { type: 'application/pgp-keys' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revocation-${fp.slice(-16)}.asc`;
    a.click();
    URL.revokeObjectURL(url);
}

function chooseRevocationFile() {
    const input = document.getElementById('revocationFileInput');
    if (input) { input.value = ''; input.click(); }
}

async function applyRevocationCertificateFromFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const idx = document.getElementById('revocationKeySelect').value;
    if (idx === '') { toast('Select key.', 'error'); return; }

    const key = keys[idx];
    const armored = await file.text();
    try {
        const parsedKey = key.privateKey
            ? await openpgp.readPrivateKey({ armoredKey: key.privateKey })
            : await openpgp.readKey({ armoredKey: key.publicKey });
        const revoked = await parsedKey.applyRevocationCertificate(armored, new Date(), openpgp.config);

        if (key.privateKey) {
            keys[idx].privateKey = revoked.armor();
            keys[idx].publicKey = revoked.toPublic().armor();
        } else {
            keys[idx].publicKey = revoked.armor();
        }
        keys[idx].revoked = true;
        keys[idx].revokedAt = new Date().toISOString();
        await saveKeysToLocalStorage();
        refreshKeyList();
        toast('Revocation applied.', 'warning');
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
}

/* ---------------------------------------------------------------------
 * CERTIFY
 * ------------------------------------------------------------------- */
async function certifyPublicKey() {
    const targetArmored = document.getElementById('certTargetKey').value.trim();
    const signerIdx = document.getElementById('certSigningKey').value;
    const passphrase = document.getElementById('certPassphrase').value;
    if (!targetArmored) { toast('Paste target key.', 'error'); return; }
    if (signerIdx === '') { toast('Select signing key.', 'error'); return; }
    const signerKey = keys[signerIdx];
    if (!signerKey?.privateKey) { toast('No private part.', 'error'); return; }
    const btn = document.getElementById('certifyKeyButton');
    const prev = btn.textContent; btn.disabled = true; btn.textContent = 'Signing…';
    try {
        let targetKey;
        try { targetKey = await openpgp.readKey({ armoredKey: targetArmored }); }
        catch { targetKey = (await openpgp.readPrivateKey({ armoredKey: targetArmored })).toPublic(); }
        if (targetKey.getFingerprint().toUpperCase() === signerKey.fingerprint) throw new Error('Cannot certify own key.');
        const { key: decryptedSigner } = await readDecryptedPrivateKey(signerKey.privateKey, passphrase);
        const certified = await targetKey.signAllUsers([decryptedSigner], new Date(), openpgp.config);
        const verification = await certified.verifyAllUsers([decryptedSigner.toPublic()], new Date(), openpgp.config);
        const signerId = decryptedSigner.getKeyID().toHex().toUpperCase();
        if (!verification.some(v => v.valid === true && v.keyID?.toHex?.().toUpperCase() === signerId)) throw new Error('Certification was created but could not be verified against the signing key.');
        certifiedKeyArmored = certified.armor();
        document.getElementById('certOutput').value = certifiedKeyArmored;
        ['copyCertifiedButton','downloadCertifiedButton','publishCertifiedButton'].forEach(id => { document.getElementById(id).disabled = false; });
        toast('Generic OpenPGP certification created and verified.');
    } catch (error) { toast(`Certification failed: ${error.message}`, 'error'); }
    finally { btn.disabled = false; btn.textContent = prev; }
}

async function copyCertifiedKey() {
    if (!certifiedKeyArmored) return;
    try { await navigator.clipboard.writeText(certifiedKeyArmored); toast('Copied.'); }
    catch { toast('Clipboard failed.', 'error'); }
}

function downloadCertifiedKey() {
    if (!certifiedKeyArmored) return;
    const blob = new Blob([certifiedKeyArmored], { type: 'application/pgp-keys' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `certified-key-${Date.now()}.asc`; a.click();
    URL.revokeObjectURL(url);
}

async function publishCertifiedKey() {
    if (!certifiedKeyArmored) return;
    const parsed = await openpgp.readKey({ armoredKey: certifiedKeyArmored });
    const tmpIdx = keys.push({
        publicKey: certifiedKeyArmored, privateKey: null,
        fingerprint: parsed.getFingerprint().toUpperCase(),
        email: '', comment: '', userLabel: 'Temporary — certified key',
        publishHistory: [], meta: {}
    }) - 1;

    refreshKeySelectors();
    document.getElementById('publishKeySelect').value = String(tmpIdx);
    try { await publishSelectedKey(); }
    finally {
        keys.splice(tmpIdx, 1);
        await saveKeysToLocalStorage();
        refreshKeyList();
    }
}

/* ---------------------------------------------------------------------
 * ENCRYPTED BACKUP
 * v2: standard OpenPGP password encryption with Argon2 S2K + AES-256 + AEAD GCM.
 * v1 PBKDF2/AES-GCM remains read-only for backwards compatibility.
 * ------------------------------------------------------------------- */
const BACKUP_FORMAT = 'pasevsu-pgp-encrypted-backup';
const LEGACY_BACKUP_FORMATS = new Set(['pgpbox-encrypted-backup']);
const BACKUP_VERSION = 2;
const PBKDF2_ITERATIONS = 600000;
const MIN_PASSWORD_LENGTH = 16;

const b64decode = (value) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
async function deriveLegacyBackupKey(password, salt) {
    const baseKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations:PBKDF2_ITERATIONS, hash:'SHA-256' }, baseKey, { name:'AES-GCM', length:256 }, false, ['decrypt']);
}
function backupOpenPgpConfig() {
    return {
        ...(window.PasevSUAdvanced?.config?.() || {}),
        preferredSymmetricAlgorithm: openpgp.enums.symmetric.aes256,
        aeadProtect: true,
        preferredAEADAlgorithm: openpgp.enums.aead.gcm,
        s2kType: openpgp.enums.s2k.argon2,
        s2kArgon2Params: { passes:3, parallelism:4, memoryExponent:17 },
        maxArgon2MemoryExponent: 18
    };
}
async function encryptBackup(payload, password) {
    const armored = await openpgp.encrypt({
        message: await openpgp.createMessage({ text:JSON.stringify(payload) }),
        passwords:[password], format:'armored', config:backupOpenPgpConfig()
    });
    return {
        format:BACKUP_FORMAT, version:BACKUP_VERSION, createdAt:new Date().toISOString(),
        protection:{ standard:'OpenPGP', s2k:'Argon2id', passes:3, parallelism:4, memoryKiB:131072, cipher:'AES-256', aead:'GCM' },
        armoredMessage:armored
    };
}
async function decryptBackup(backup, password) {
    if (backup?.format !== BACKUP_FORMAT && !LEGACY_BACKUP_FORMATS.has(backup?.format)) throw new Error('Not a compatible PasevSU PGP backup.');
    if (backup.version === 2) {
        if (typeof backup.armoredMessage !== 'string' || !backup.armoredMessage.includes('-----BEGIN PGP MESSAGE-----')) throw new Error('Invalid OpenPGP backup payload.');
        const message = await openpgp.readMessage({ armoredMessage:backup.armoredMessage, config:backupOpenPgpConfig() });
        const { data } = await openpgp.decrypt({ message, passwords:[password], format:'utf8', config:backupOpenPgpConfig() });
        return JSON.parse(data);
    }
    if (backup.version === 1) {
        const salt=b64decode(backup.salt), iv=b64decode(backup.iv), ct=b64decode(backup.ciphertext);
        const key=await deriveLegacyBackupKey(password,salt);
        try { return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct))); }
        catch { throw new Error('Wrong password or corrupted legacy backup.'); }
    }
    throw new Error('Unsupported backup version.');
}
async function exportEncryptedBackup() {
    const pwd=document.getElementById('backupPassword').value;
    const confirmPwd=document.getElementById('backupPasswordConfirm').value;
    const includePrivate=document.getElementById('backupIncludePrivate').checked;
    const includeMeta=document.getElementById('backupIncludeMetadata').checked;
    if (pwd.length < MIN_PASSWORD_LENGTH) { toast(`Min ${MIN_PASSWORD_LENGTH} chars.`, 'error'); return; }
    if (pwd !== confirmPwd) { toast('Mismatch.', 'error'); return; }
    if (keys.length === 0) { toast('No keys.', 'error'); return; }
    const btn=document.getElementById('exportBackupButton'), prev=btn.textContent; btn.disabled=true; btn.textContent='Encrypting…';
    try {
        const payload={ exportedAt:new Date().toISOString(), keyCount:keys.length, keys:keys.map(k=>{
            const copy={ fingerprint:k.fingerprint,email:k.email,comment:k.comment,userLabel:k.userLabel,expirationDate:k.expirationDate,publicKey:k.publicKey,revoked:k.revoked??false,revokedAt:k.revokedAt??null };
            if(includePrivate) copy.privateKey=k.privateKey;
            if(includeMeta){copy.meta=k.meta??{};copy.publishHistory=k.publishHistory??[];}
            return copy;
        })};
        const encrypted=await encryptBackup(payload,pwd);
        const blob=new Blob([JSON.stringify(encrypted,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a');
        a.href=url;a.download=`PasevSU-PGP-backup-${new Date().toISOString().slice(0,10)}.pgpbackup`;a.click();URL.revokeObjectURL(url);
        document.getElementById('backupPassword').value='';document.getElementById('backupPasswordConfirm').value='';
        toast(`Backup exported (${keys.length} keys) with OpenPGP Argon2id + AES-256-GCM.`);
    } catch(error){toast(`Backup failed: ${error.message}`,'error');}
    finally{btn.disabled=false;btn.textContent=prev;}
}
function chooseBackupFile(){const input=document.getElementById('backupFileInput');if(input){input.value='';input.click();}}
async function importEncryptedBackup(event) {
    const file=event.target.files?.[0];if(!file)return;const pwd=prompt(uiText('Enter master password for this backup:'));if(!pwd)return;
    try {
        const text=await file.text();let backup;try{backup=JSON.parse(text);}catch{throw new Error('Invalid JSON.');}
        const payload=await decryptBackup(backup,pwd);if(!Array.isArray(payload.keys)||payload.keys.length===0)throw new Error('No keys.');
        const merge=confirm(uiText(`Backup: ${payload.keys.length} keys.\n\nOK = MERGE\nCancel = REPLACE`));
        if(!merge){if(!confirm(uiText('DELETE all current keys?')))return;await dbCreateSnapshot('before-backup-replace');keys=[];}
        let added=0,skipped=0;
        for(const k of payload.keys){
            if(!k.fingerprint||typeof k.publicKey!=='string')continue;
            try { const parsed=await openpgp.readKey({armoredKey:k.publicKey}); if(parsed.getFingerprint().toUpperCase()!==String(k.fingerprint).replace(/\s+/g,'').toUpperCase()) throw new Error('fingerprint mismatch'); } catch { skipped++; continue; }
            if(keys.some(e=>e.fingerprint===k.fingerprint)){skipped++;continue;}
            let restoredPrivate=k.privateKey??null;
            if(restoredPrivate){
                const parsedPrivate=await openpgp.readPrivateKey({armoredKey:restoredPrivate});
                if(parsedPrivate.isDecrypted()) restoredPrivate=(await openpgp.encryptKey({privateKey:parsedPrivate,passphrase:pwd,config:backupOpenPgpConfig()})).armor();
            }
            keys.push({fingerprint:k.fingerprint,email:k.email??'',comment:k.comment??'',userLabel:k.userLabel??'',expirationDate:k.expirationDate??'—',publicKey:k.publicKey,privateKey:restoredPrivate,meta:k.meta??{},publishHistory:k.publishHistory??[],revoked:k.revoked??false,revokedAt:k.revokedAt??null});added++;
        }
        await saveKeysToLocalStorage();refreshKeyList();toast(`Restore: ${added} added, ${skipped} skipped.`);
    } catch(error){toast(`Restore failed: ${error.message}`,'error');}
}

/* ---------------------------------------------------------------------
 * SNAPSHOTS
 * ------------------------------------------------------------------- */
async function listSnapshots() {
    const host = document.getElementById('snapshotsList');
    host.innerHTML = 'Loading…';
    const list = await dbListSnapshots();
    if (list.length === 0) { host.innerHTML = 'No snapshots yet.'; return; }
    host.innerHTML = list.map(s => `
      <div style="display:flex;justify-content:space-between;padding:.35rem .5rem;border:1px solid var(--border);border-radius:6px;margin-bottom:.3rem;">
        <span><strong>${escapeHtml(s.reason)}</strong> — ${escapeHtml(new Date(s.createdAt).toLocaleString())} (${s.payload.length} keys)</span>
        <button class="btn btn-muted" style="font-size:.8rem;padding:.15rem .5rem;" data-restore="${s.id}">Restore</button>
      </div>
    `).join('');
    host.querySelectorAll('[data-restore]').forEach(btn => {
        btn.addEventListener('click', () => restoreSnapshot(Number(btn.dataset.restore)));
    });
}

async function restoreSnapshot(id) {
    const list = await dbListSnapshots();
    const snapshot = list.find(s => s.id === id);
    if (!snapshot) { toast('Not found.', 'error'); return; }
    if (!confirm(uiText(`Restore from ${snapshot.createdAt}?`))) return;
    await dbCreateSnapshot('before-restore');
    keys = snapshot.payload.map(k => ({ ...k }));
    await saveKeysToLocalStorage();
    refreshKeyList();
    toast(`Restored ${keys.length} key(s).`);
}

async function createManualSnapshot() {
    await dbCreateSnapshot('manual');
    toast('Snapshot created.');
    listSnapshots();
}

/* ---------------------------------------------------------------------
 * QR CODE
 * ------------------------------------------------------------------- */
function showQrForSelected() {
    const indices = getSelectedIndices().reverse();
    if (indices.length !== 1) { toast('Select exactly one key.', 'error'); return; }
    const key = keys[indices[0]];
    const fp = key.fingerprint.replace(/\s+/g, '').toUpperCase();
    const url = `https://keys.openpgp.org/search?q=${fp}`;

    const host = document.getElementById('qrCanvasHost');
    const hasGeneratorApi = typeof qrcode === 'function';
    const hasQrCodeJsApi = typeof QRCode === 'function';
    if (!hasGeneratorApi && !hasQrCodeJsApi) { toast('QR library not loaded.', 'error'); return; }

    try {
        host.replaceChildren();
        if (hasGeneratorApi) {
            // qrcode-generator 1.4.4 compatibility provider.
            const qr = qrcode(0, 'M');
            qr.addData(url);
            qr.make();
            host.innerHTML = qr.createSvgTag({ cellSize: 6, margin: 4, scalable: true });
        } else {
            // davidshimjs/QRCode.js provider from the central _crypto/qrcodejs.
            new QRCode(host, {
                text: url,
                width: 256,
                height: 256,
                correctLevel: QRCode.CorrectLevel.M,
                useSVG: true
            });
        }
        document.getElementById('qrTitle').textContent = key.userLabel || key.email || 'Public key';
        document.getElementById('qrSubtitle').textContent = `Fingerprint: ${formatFingerprint(fp)}`;
        document.getElementById('qrModal').style.display = 'flex';
    } catch (error) { toast(`QR failed: ${error.message}`, 'error'); }
}

function hideQrModal() {
    document.getElementById('qrModal').style.display = 'none';
}

/* ---------------------------------------------------------------------
 * INSPECTOR
 * ------------------------------------------------------------------- */
function hexU8(u8) {
    if (!u8) return '';
    return Array.from(u8).map(b => b.toString(16).padStart(2, '0')).join('');
}

function prefLabel(kind, code) {
    const maps = {
        hash: { 1: 'MD5', 2: 'SHA1', 3: 'RIPEMD160', 8: 'SHA256', 9: 'SHA384', 10: 'SHA512', 11: 'SHA224', 12: 'SHA3-256', 14: 'SHA3-512' },
        cipher: { 1: 'IDEA', 2: '3DES', 3: 'CAST5', 4: 'Blowfish', 7: 'AES128', 8: 'AES192', 9: 'AES256', 10: 'Twofish' },
        compression: { 0: 'Uncompressed', 1: 'ZIP', 2: 'ZLIB', 3: 'BZIP2' },
        aead: { 1: 'EAX', 2: 'OCB', 3: 'GCM' }
    };
    return maps[kind]?.[code] ?? `#${code}`;
}

function keyFlagsHuman(flags) {
    if (!flags || flags.length === 0) return [];
    const b = flags[0], out = [];
    if (b & 0x01) out.push('Certify');
    if (b & 0x02) out.push('Sign');
    if (b & 0x04) out.push('Encrypt (communication)');
    if (b & 0x08) out.push('Encrypt (storage)');
    if (b & 0x10) out.push('Split');
    if (b & 0x20) out.push('Authenticate');
    return out;
}

function featuresHuman(features) {
    if (!features || features.length === 0) return [];
    const b = features[0], out = [];
    if (b & 0x01) out.push('MDC');
    if (b & 0x02) out.push('AEAD');
    if (b & 0x04) out.push('v5 keys');
    if (b & 0x08) out.push('SEIPD v2');
    return out;
}

async function inspectKey(keyIndex) {
    const key = keys[keyIndex];
    if (!key) throw new Error('Key not found.');
    const armored = key.privateKey || key.publicKey;
    const parsed = key.privateKey
        ? await openpgp.readPrivateKey({ armoredKey: armored })
        : await openpgp.readKey({ armoredKey: armored });

    const info = parsed.getAlgorithmInfo();
    const primaryExpiration = await parsed.getExpirationTime();
    const primary = {
        version: parsed.keyPacket.version,
        createdAt: parsed.getCreationTime()?.toISOString?.() ?? null,
        expiresAt: primaryExpiration instanceof Date ? primaryExpiration.toISOString() : null,
        neverExpires: primaryExpiration === Infinity,
        validityStatus: primaryExpiration === null ? 'invalid-or-revoked' : (primaryExpiration === Infinity ? 'no-expiration' : 'dated-expiration'),
        algorithm: info.algorithm, bits: info.bits ?? null, curve: info.curve ?? null,
        fingerprint: parsed.getFingerprint().toUpperCase(),
        keyID: parsed.getKeyID().toHex().toUpperCase(),
        isPrivate: parsed.isPrivate(),
        isDecrypted: typeof parsed.isDecrypted === 'function' ? parsed.isDecrypted() : undefined
    };

    const users = [];
    for (const user of parsed.users ?? []) {
        const entry = {
            userID: user.userID?.userID ?? null, name: user.userID?.name ?? null,
            email: user.userID?.email ?? null, comment: user.userID?.comment ?? null,
            selfCertifications: [], otherCertifications: [], revocationSignatures: []
        };
        const summarize = (sig) => ({
            signatureType: sig.signatureType, hashAlgorithm: sig.hashAlgorithm,
            createdAt: sig.created?.toISOString?.() ?? null,
            issuerKeyID: sig.issuerKeyID?.toHex?.() ?? null,
            keyFlags: keyFlagsHuman(sig.keyFlags),
            features: featuresHuman(sig.features),
            isPrimaryUserID: sig.isPrimaryUserID ?? null,
            preferredHashAlgorithms: (sig.preferredHashAlgorithms ?? []).map(c => prefLabel('hash', c)),
            preferredSymmetricAlgorithms: (sig.preferredSymmetricAlgorithms ?? []).map(c => prefLabel('cipher', c)),
            preferredCompressionAlgorithms: (sig.preferredCompressionAlgorithms ?? []).map(c => prefLabel('compression', c)),
            preferredAEADAlgorithms: (sig.preferredAEADAlgorithms ?? []).map(c => prefLabel('aead', c)),
            notations: (sig.rawNotations ?? []).map(n => ({
                name: n.name, humanReadable: n.humanReadable, critical: n.critical,
                value: n.humanReadable ? new TextDecoder().decode(n.value) : hexU8(n.value)
            }))
        });
        for (const sig of user.selfCertifications ?? []) entry.selfCertifications.push(summarize(sig));
        for (const sig of user.otherCertifications ?? []) entry.otherCertifications.push(summarize(sig));
        for (const sig of user.revocationSignatures ?? []) entry.revocationSignatures.push(summarize(sig));
        users.push(entry);
    }

    const subkeys = [];
    for (const sub of (parsed.getSubkeys?.() ?? [])) {
        const sInfo = sub.getAlgorithmInfo?.() ?? {};
        const subExpiration = await sub.getExpirationTime();
        subkeys.push({
            fingerprint: sub.getFingerprint().toUpperCase(),
            keyID: sub.getKeyID().toHex().toUpperCase(),
            algorithm: sInfo.algorithm, bits: sInfo.bits ?? null, curve: sInfo.curve ?? null,
            createdAt: sub.getCreationTime?.()?.toISOString?.() ?? null,
            expiresAt: subExpiration instanceof Date ? subExpiration.toISOString() : null,
            neverExpires: subExpiration === Infinity,
            validityStatus: subExpiration === null ? 'invalid-or-revoked' : (subExpiration === Infinity ? 'no-expiration' : 'dated-expiration'),
            bindingSignatures: (sub.bindingSignatures ?? []).map(s => ({
                createdAt: s.created?.toISOString?.() ?? null,
                keyFlags: keyFlagsHuman(s.keyFlags)
            }))
        });
    }

    let globalPreferences = null;
    try {
        const pu = await parsed.getPrimaryUser();
        const sc = pu?.selfCertification;
        if (sc) {
            globalPreferences = {
                preferredSymmetricAlgorithms: (sc.preferredSymmetricAlgorithms ?? []).map(c => prefLabel('cipher', c)),
                preferredHashAlgorithms: (sc.preferredHashAlgorithms ?? []).map(h => prefLabel('hash', h)),
                preferredCompressionAlgorithms: (sc.preferredCompressionAlgorithms ?? []).map(c => prefLabel('compression', c)),
                preferredAEADAlgorithms: (sc.preferredAEADAlgorithms ?? []).map(a => prefLabel('aead', a)),
                features: featuresHuman(sc.features),
                keyFlags: keyFlagsHuman(sc.keyFlags),
                isPrimaryUserID: sc.isPrimaryUserID ?? null
            };
        }
    } catch {}

    return {
        inspectedAt: new Date().toISOString(),
        primary, users, subkeys, globalPreferences,
        revoked: key.revoked ?? false
    };
}

async function handleInspectKey() {
    const idx = document.getElementById('inspectKeySelect').value;
    if (idx === '') { toast('Select key.', 'error'); return; }
    const btn = document.getElementById('inspectKeyButton');
    const prev = btn.textContent;
    btn.disabled = true; btn.textContent = 'Inspecting…';
    try {
        lastInspection = await inspectKey(Number(idx));
        renderInspection(lastInspection);
        document.getElementById('exportInspectButton').disabled = false;
        toast('Inspected.');
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
    finally { btn.disabled = false; btn.textContent = prev; }
}

function renderInspection(data) {
    const host = document.getElementById('inspectOutput');
    const section = (title, content) => `
      <details open style="margin-bottom:.75rem;border:1px solid var(--border);border-radius:8px;padding:.6rem .8rem;">
        <summary style="cursor:pointer;font-weight:600;list-style:none;">${title}</summary>
        <div style="padding-top:.5rem;">${content}</div>
      </details>`;
    const row = (k, v) => `
      <div style="display:grid;grid-template-columns:minmax(180px,240px) 1fr;gap:.5rem;padding:.2rem 0;border-bottom:1px solid var(--border);">
        <span style="opacity:.7;">${escapeHtml(k)}</span><span style="word-break:break-word;">${escapeHtml(v ?? '—')}</span>
      </div>`;

    let html = '';
    html += section('Primary Key Packet',
        row('Version', data.primary.version) +
        row('Algorithm', data.primary.algorithm) +
        row('Bits', data.primary.bits) + row('Curve', data.primary.curve) +
        row('Created', data.primary.createdAt) +
        row('Expires', data.primary.validityStatus === 'invalid-or-revoked' ? uiText('Invalid / revoked') : (data.primary.expiresAt || 'Never')) +
        row('Fingerprint', data.primary.fingerprint) +
        row('Key ID', data.primary.keyID) +
        row('Private', data.primary.isPrivate ? 'Yes' : 'No') +
        row('Revoked', data.revoked ? 'Yes' : 'No'));

    if (data.globalPreferences) {
        const p = data.globalPreferences;
        html += section('Global Preferences',
            row('Key flags', p.keyFlags.join(', ') || '—') +
            row('Features', p.features.join(', ') || '—') +
            row('Preferred ciphers', p.preferredSymmetricAlgorithms.join(', ') || '—') +
            row('Preferred hashes', p.preferredHashAlgorithms.join(', ') || '—') +
            row('Preferred compression', p.preferredCompressionAlgorithms.join(', ') || '—') +
            row('Preferred AEAD', p.preferredAEADAlgorithms.join(', ') || '—'));
    }

    html += section(`User IDs (${data.users.length})`,
        data.users.map(u => `
          <div style="padding:.5rem;border:1px solid var(--border);border-radius:6px;margin-bottom:.5rem;">
            <div style="font-weight:600;">${escapeHtml(u.userID ?? '(no UID)')}</div>
            <div style="font-size:.8rem;opacity:.7;">name: ${escapeHtml(u.name ?? '—')} · email: ${escapeHtml(u.email ?? '—')}</div>
            <div style="margin-top:.4rem;">Self: ${u.selfCertifications.length} · Other: ${u.otherCertifications.length} · Rev: ${u.revocationSignatures.length}</div>
          </div>
        `).join(''));

    html += section(`Subkeys (${data.subkeys.length})`,
        data.subkeys.length === 0 ? '<div>None</div>' :
        data.subkeys.map(sk => `
          <div style="padding:.5rem;border:1px solid var(--border);border-radius:6px;margin-bottom:.5rem;">
            <div style="font-family:monospace;font-size:.8rem;">${escapeHtml(sk.fingerprint)}</div>
            <div>${escapeHtml(sk.algorithm)}${sk.bits ? ` · ${escapeHtml(sk.bits)} bits` : ''}${sk.curve ? ` · ${escapeHtml(sk.curve)}` : ''}</div>
            <div>Created: ${escapeHtml(sk.createdAt)} · Expires: ${escapeHtml(sk.validityStatus === 'invalid-or-revoked' ? uiText('Invalid / revoked') : (sk.expiresAt || 'Never'))}</div>
            <div>Bindings: ${sk.bindingSignatures.length}</div>
          </div>
        `).join(''));

    host.innerHTML = html;
}

function exportInspection() {
    if (!lastInspection) return;
    const blob = new Blob([JSON.stringify(lastInspection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `inspection-${lastInspection.primary.keyID}.json`; a.click();
    URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------------
 * USER ATTRIBUTES / NOTATIONS / PREFERENCES
 * ------------------------------------------------------------------- */
function extractUserAttributes(parsedKey) {
    const out = [];
    for (const user of parsedKey.users ?? []) {
        const ua = user.userAttribute;
        if (!ua) continue;
        for (const attrBytes of ua.attributes ?? []) {
            const view = new Uint8Array(attrBytes);
            if (view.length < 4) continue;
            const isJpeg = view[0] === 0xFF && view[1] === 0xD8;
            const isPng = view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4E && view[3] === 0x47;
            out.push({
                length: view.length,
                format: isJpeg ? 'jpeg' : isPng ? 'png' : 'unknown',
                hex: hexU8(view).slice(0, 64) + (view.length > 32 ? '…' : ''),
                bytes: view
            });
        }
    }
    return out;
}

async function showUserAttributes(keyIndex) {
    const key = keys[keyIndex];
    const armored = key.privateKey || key.publicKey;
    const parsed = key.privateKey
        ? await openpgp.readPrivateKey({ armoredKey: armored })
        : await openpgp.readKey({ armoredKey: armored });
    const attrs = extractUserAttributes(parsed);
    if (attrs.length === 0) { toast('No user attributes.', 'info'); return; }
    const host = document.getElementById('qrCanvasHost');
    host.innerHTML = attrs.map((a, i) => {
        if (a.format === 'jpeg' || a.format === 'png') {
            const blob = new Blob([a.bytes], { type: `image/${a.format}` });
            const url = URL.createObjectURL(blob);
            return `<img src="${url}" style="max-width:100%;border-radius:8px;margin-bottom:.5rem;" />`;
        }
        return `<div style="font-family:monospace;font-size:.8rem;color:#000;word-break:break-all;">Unknown: ${a.hex}</div>`;
    }).join('');
    document.getElementById('qrTitle').textContent = `Attributes (${attrs.length})`;
    document.getElementById('qrSubtitle').textContent = '';
    document.getElementById('qrModal').style.display = 'flex';
}

async function listNotations(keyIndex) {
    const key = keys[keyIndex];
    const armored = key.privateKey || key.publicKey;
    const parsed = key.privateKey
        ? await openpgp.readPrivateKey({ armoredKey: armored })
        : await openpgp.readKey({ armoredKey: armored });
    const out = [];
    for (const user of parsed.users ?? []) {
        for (const sig of [...(user.selfCertifications ?? []), ...(user.otherCertifications ?? [])]) {
            for (const n of sig.rawNotations ?? []) {
                out.push({
                    userID: user.userID?.userID ?? null,
                    name: n.name, humanReadable: n.humanReadable, critical: n.critical,
                    value: n.humanReadable ? new TextDecoder().decode(n.value) : hexU8(n.value)
                });
            }
        }
    }
    return out;
}

async function showNotationsForSelected() {
    const indices = getSelectedIndices().reverse();
    if (indices.length !== 1) { toast('Select exactly one.', 'error'); return; }
    const notations = await listNotations(indices[0]);
    const host = document.getElementById('qrCanvasHost');
    host.innerHTML = notations.length === 0
        ? '<div style="color:#000;padding:1rem;">No notations.</div>'
        : notations.map(n => `
            <div style="padding:.5rem;border:1px solid #ddd;border-radius:6px;margin-bottom:.4rem;color:#000;">
              <div><strong>${escapeHtml(n.name)}</strong> ${n.critical ? '<span style="background:#dc2626;color:#fff;padding:0 .3rem;border-radius:3px;font-size:.7rem;">CRITICAL</span>' : ''}</div>
              <div style="font-size:.85rem;">${escapeHtml(n.value)}</div>
            </div>`).join('');
    document.getElementById('qrTitle').textContent = `Notations (${notations.length})`;
    document.getElementById('qrSubtitle').textContent = '';
    document.getElementById('qrModal').style.display = 'flex';
}

async function showPreferencesForSelected() {
    const indices = getSelectedIndices().reverse();
    if (indices.length !== 1) { toast('Select exactly one.', 'error'); return; }
    try {
        const inspection = await inspectKey(indices[0]);
        const p = inspection.globalPreferences;
        const host = document.getElementById('qrCanvasHost');
        if (!p) {
            host.innerHTML = '<div style="color:#000;padding:1rem;">No preferences.</div>';
        } else {
            const line = (label, value) => `
              <div style="display:flex;justify-content:space-between;gap:.75rem;padding:.35rem 0;border-bottom:1px solid #eee;color:#000;">
                <span style="opacity:.7;">${escapeHtml(label)}</span>
                <span style="text-align:right;">${escapeHtml(Array.isArray(value) ? (value.join(', ') || '—') : (value ?? '—'))}</span>
              </div>`;
            host.innerHTML = `<div style="width:100%;color:#000;font-size:.9rem;">
              ${line('Key flags', p.keyFlags)}
              ${line('Features', p.features)}
              ${line('Ciphers', p.preferredSymmetricAlgorithms)}
              ${line('Hashes', p.preferredHashAlgorithms)}
              ${line('Compression', p.preferredCompressionAlgorithms)}
              ${line('AEAD', p.preferredAEADAlgorithms)}
            </div>`;
        }
        document.getElementById('qrTitle').textContent = 'Key preferences';
        document.getElementById('qrSubtitle').textContent = '';
        document.getElementById('qrModal').style.display = 'flex';
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
}

/* ---------------------------------------------------------------------
 * FILE ENCRYPTION
 * ------------------------------------------------------------------- */
function bindFileDropZone() {
    const zone = document.getElementById('fileDropZone');
    const input = document.getElementById('fileInput');
    if (!zone || !input) return;

    const highlight = (on) => {
        zone.style.background = on ? 'rgba(96,165,250,.08)' : '';
        zone.style.borderColor = on ? 'var(--ring)' : 'var(--border)';
    };
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') input.click(); });
    ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); highlight(true); }));
    ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); highlight(false); }));
    zone.addEventListener('drop', e => {
        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length) addFilesToQueue(files);
    });
    input.addEventListener('change', () => {
        const files = Array.from(input.files || []);
        if (files.length) addFilesToQueue(files);
        input.value = '';
    });
}

function addFilesToQueue(files) {
    for (const f of files) fileQueue.push({ file: f, result: null, error: null });
    renderFileQueue();
}

function renderFileQueue() {
    const q = document.getElementById('fileQueue');
    if (!q) return;
    if (fileQueue.length === 0) {
        q.innerHTML = '<div class="text-[0.85rem] text-slate-500">No files.</div>';
    } else {
        q.innerHTML = fileQueue.map(item => {
            const size = (item.file.size / 1024).toFixed(1);
            const status = item.result
                ? `<span style="color:#16a34a;">✓ ${escapeHtml(item.result.name)}</span>`
                : item.error
                    ? `<span style="color:#dc2626;">✗ ${escapeHtml(item.error)}</span>`
                    : '<span style="opacity:.6;">queued</span>';
            return `<div style="display:flex;justify-content:space-between;gap:.5rem;padding:.35rem .5rem;border:1px solid var(--border);border-radius:6px;">
                <span><strong>${escapeHtml(item.file.name)}</strong> (${size} KB)</span><span>${status}</span>
              </div>`;
        }).join('');
    }

    const btn = document.getElementById('processFilesButton');
    if (btn) btn.disabled = fileQueue.length === 0;

    const done = fileQueue.filter(f => f.result);
    if (done.length > 0) {
        const dl = document.createElement('div');
        dl.style.marginTop = '.5rem';
        dl.innerHTML = done.map(item => {
            const url = URL.createObjectURL(item.result.blob);
            return `<a href="${url}" download="${escapeHtml(item.result.name)}" style="display:block;padding:.35rem .5rem;color:var(--accent);">
                ⬇ ${escapeHtml(item.result.name)} (${(item.result.blob.size / 1024).toFixed(1)} KB)</a>`;
        }).join('');
        q.appendChild(dl);
    }
}

function clearFileQueue() {
    fileQueue = [];
    renderFileQueue();
}

async function processFiles() {
    const op=document.getElementById('fileOperation').value, format=document.getElementById('fileOutputFormat').value;
    const recipIdx=document.getElementById('fileRecipientKey').value, signIdx=document.getElementById('fileSigningKey').value;
    const passphrase=document.getElementById('fileSignPassphrase').value;
    if(fileQueue.length===0){toast('Queue empty.','error');return;}
    const btn=document.getElementById('processFilesButton'),prev=btn.textContent;btn.disabled=true;
    try {
        let recipientKey=null, signingKey=null;
        if(op==='encrypt'||op==='encrypt-sign'){
            if(recipIdx==='')throw new Error('Select recipient.');
            await enforceEncryptionPolicy([keys[Number(recipIdx)]]);
            recipientKey=await openpgp.readKey({armoredKey:keys[Number(recipIdx)].publicKey});
        }
        if(op==='sign'||op==='encrypt-sign'||op==='decrypt'){
            if(signIdx==='')throw new Error('Select private key.');
            const parsed=await openpgp.readPrivateKey({armoredKey:keys[Number(signIdx)].privateKey});
            if(parsed.isDecrypted()) signingKey=parsed;
            else { if(!passphrase)throw new Error('Private-key passphrase required.'); signingKey=await openpgp.decryptKey({privateKey:parsed,passphrase}); }
        }
        for(let i=0;i<fileQueue.length;i++){
            const item=fileQueue[i];btn.textContent=`Processing… (${i+1}/${fileQueue.length})`;item.result=null;item.error=null;
            try {
                const bytes=new Uint8Array(await item.file.arrayBuffer());
                if(op==='encrypt'){
                    const msg=await openpgp.createMessage({binary:bytes,filename:item.file.name});
                    const enc=await openpgp.encrypt({message:msg,encryptionKeys:recipientKey,format,config:window.PasevSUAdvanced?.config?.()});
                    item.result={blob:new Blob([enc]),name:`${item.file.name}.${format==='armored'?'asc':'pgp'}`};
                } else if(op==='sign'){
                    const msg=await openpgp.createMessage({binary:bytes});
                    const sig=await openpgp.sign({message:msg,signingKeys:signingKey,detached:true,format,config:window.PasevSUAdvanced?.config?.()});
                    item.result={blob:new Blob([sig]),name:`${item.file.name}.sig`};
                } else if(op==='encrypt-sign'){
                    const msg=await openpgp.createMessage({binary:bytes,filename:item.file.name});
                    const enc=await openpgp.encrypt({message:msg,encryptionKeys:recipientKey,signingKeys:signingKey,format,config:window.PasevSUAdvanced?.config?.()});
                    item.result={blob:new Blob([enc]),name:`${item.file.name}.${format==='armored'?'asc':'pgp'}`};
                } else if(op==='decrypt'){
                    const isText=isArmoredOpenPgpBytes(bytes);
                    const message=isText?await openpgp.readMessage({armoredMessage:new TextDecoder().decode(bytes)}):await openpgp.readMessage({binaryMessage:bytes});
                    const {data}=await openpgp.decrypt({message,decryptionKeys:signingKey,format:'binary',config:window.PasevSUAdvanced?.config?.()});
                    item.result={blob:new Blob([data]),name:item.file.name.replace(/\.(asc|pgp|gpg)$/i,'')};
                } else throw new Error('Unsupported file operation.');
            } catch(e){item.error=e.message;}
        }
        renderFileQueue();toast(`Processed ${fileQueue.filter(f=>f.result).length}/${fileQueue.length}.`);
    } catch(error){toast(`File operation failed: ${error.message}`,'error');}
    finally{btn.textContent=prev;btn.disabled=false;}
}

/* ---------------------------------------------------------------------
 * SESSION KEYS
 * ------------------------------------------------------------------- */
async function generateEncryptedSessionKey() {
    const recipIdx = document.getElementById('sessionRecipientKey').value;
    const algo = document.getElementById('sessionAlgorithm').value;
    if (recipIdx === '') { toast('Select recipient.', 'error'); return; }

    try {
        const recipient = await openpgp.readKey({ armoredKey: keys[recipIdx].publicKey });
        const selectedAlgorithm = openpgp.enums.symmetric[algo];
        if (selectedAlgorithm === undefined) throw new Error(`Unsupported session-key algorithm: ${algo}`);
        // Generate exactly the algorithm selected in the GUI. Passing recipient preferences
        // here would allow them to override the explicit AES-128/192/256 selection.
        const sk = await openpgp.generateSessionKey({
            config: { preferredSymmetricAlgorithm: selectedAlgorithm }
        });
        if (sk.algorithm !== algo) throw new Error(`Session-key algorithm mismatch: requested ${algo}, generated ${sk.algorithm}`);
        const armored = await openpgp.encryptSessionKey({
            data: sk.data, algorithm: sk.algorithm, encryptionKeys: recipient, format: 'armored'
        });
        lastSessionKey = { data: sk.data, algorithm: sk.algorithm };
        document.getElementById('sessionKeyOutput').value = armored;
        document.getElementById('testSessionButton').disabled = false;
        document.getElementById('sessionMeta').textContent =
            `Algorithm: ${sk.algorithm} · ${sk.data.length} bytes · recipient: ${recipient.getKeyID().toHex().toUpperCase()}`;
        toast('Session key generated.');
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
}

async function testSessionKey() {
    if (!lastSessionKey) return;
    const recipIdx = document.getElementById('sessionRecipientKey').value;
    try {
        const recipient = await openpgp.readKey({ armoredKey: keys[recipIdx].publicKey });
        const payload = new TextEncoder().encode('Test @ ' + new Date().toISOString());
        const encrypted = await openpgp.encrypt({
            message: await openpgp.createMessage({ binary: payload }),
            sessionKey: { data: lastSessionKey.data, algorithm: lastSessionKey.algorithm },
            encryptionKeys: recipient, format: 'armored'
        });
        document.getElementById('sessionMeta').textContent =
            `Test payload encrypted (${encrypted.length} chars).`;
        toast('Session key test OK.');
    } catch (error) { toast(`Test failed: ${error.message}`, 'error'); }
}

/* ---------------------------------------------------------------------
 * WEB OF TRUST
 * ------------------------------------------------------------------- */
async function buildWotGraph(rootIndex, maxDepth = 2) {
    const rootKey = keys[rootIndex];
    if (!rootKey) throw new Error('Root not found.');
    const rootFp = rootKey.fingerprint.replace(/\s+/g, '').toUpperCase();

    const parsed = new Map();
    for (const k of keys) {
        if (!k.publicKey) continue;
        try {
            const p = await openpgp.readKey({ armoredKey: k.publicKey });
            parsed.set(k.fingerprint.replace(/\s+/g, '').toUpperCase(), {
                fingerprint: k.fingerprint.replace(/\s+/g, '').toUpperCase(),
                label: k.userLabel || k.email || k.fingerprint.slice(-16),
                parsed: p
            });
        } catch {}
    }
    if (!parsed.has(rootFp)) throw new Error('Root could not be parsed.');

    const nodes = new Map();
    const edges = [];
    const queue = [{ fp: rootFp, depth: 0 }];
    const visited = new Set([rootFp]);
    nodes.set(rootFp, { ...parsed.get(rootFp), depth: 0, score: 1 });

    while (queue.length > 0) {
        const { fp, depth } = queue.shift();
        if (depth >= maxDepth) continue;
        const node = parsed.get(fp);
        if (!node) continue;

        for (const [otherFp, other] of parsed) {
            if (visited.has(otherFp)) continue;
            let signedByFp = false;
            try {
                const checks = await other.parsed.verifyAllUsers([node.parsed], new Date(), window.PasevSUAdvanced?.config?.() || openpgp.config);
                signedByFp = checks.some(check => check.valid === true && check.keyID?.equals?.(node.parsed.getKeyID()));
            } catch { signedByFp = false; }
            if (signedByFp) {
                visited.add(otherFp);
                const newDepth = depth + 1;
                nodes.set(otherFp, { ...other, depth: newDepth, score: 1 / (newDepth + 1) });
                edges.push({ from: fp, to: otherFp });
                queue.push({ fp: otherFp, depth: newDepth });
            }
        }
    }
    return { root: rootFp, nodes: Array.from(nodes.values()), edges, builtAt: new Date().toISOString() };
}

async function handleBuildWot() {
    const idx = document.getElementById('wotRootKey').value;
    if (idx === '') { toast('Select root.', 'error'); return; }
    const depth = Number(document.getElementById('wotMaxDepth').value) || 2;
    const btn = document.getElementById('buildWotButton');
    const prev = btn.textContent;
    btn.disabled = true; btn.textContent = 'Building…';
    try {
        wotGraph = await buildWotGraph(Number(idx), depth);
        renderWotGraph(wotGraph);
        renderWotScores(wotGraph);
        document.getElementById('exportWotButton').disabled = false;
        toast(`Graph: ${wotGraph.nodes.length} nodes, ${wotGraph.edges.length} edges.`);
    } catch (error) { toast(`Failed: ${error.message}`, 'error'); }
    finally { btn.disabled = false; btn.textContent = prev; }
}

function renderWotGraph(graph) {
    const host = document.getElementById('wotGraphHost');
    const levels = new Map();
    for (const n of graph.nodes) {
        if (!levels.has(n.depth)) levels.set(n.depth, []);
        levels.get(n.depth).push(n);
    }
    const W = 600, H = 400, margin = 50;
    const maxDepth = Math.max(...levels.keys(), 1);
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;font-family:system-ui;font-size:11px;">`;
    svg += `<defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--muted)"/></marker></defs>`;

    const positions = new Map();
    for (const [depth, list] of levels) {
        const y = margin + (H - 2 * margin) * (depth / maxDepth);
        list.forEach((n, i) => {
            const x = margin + (W - 2 * margin) * ((i + 1) / (list.length + 1));
            positions.set(n.fingerprint, { x, y });
        });
    }
    for (const e of graph.edges) {
        const from = positions.get(e.from), to = positions.get(e.to);
        if (!from || !to) continue;
        svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="var(--muted)" stroke-width="1" marker-end="url(#arrow)" opacity=".5"/>`;
    }
    for (const n of graph.nodes) {
        const pos = positions.get(n.fingerprint);
        if (!pos) continue;
        const isRoot = n.fingerprint === graph.root;
        const color = isRoot ? 'var(--accent)' : 'var(--border)';
        const textColor = isRoot ? '#fff' : 'var(--text)';
        svg += `<circle cx="${pos.x}" cy="${pos.y}" r="18" fill="${color}" stroke="var(--border)"/>`;
        svg += `<text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" fill="${textColor}" font-weight="600">${n.depth}</text>`;
        svg += `<text x="${pos.x}" y="${pos.y + 30}" text-anchor="middle" fill="var(--text)" font-size="10">${escapeHtml(n.label.slice(0, 14))}</text>`;
    }
    svg += `</svg>`;
    host.innerHTML = svg;
}

function renderWotScores(graph) {
    const host = document.getElementById('wotScores');
    const sorted = [...graph.nodes].sort((a, b) => b.score - a.score);
    host.innerHTML = sorted.map(n => {
        const pct = Math.round(n.score * 100);
        return `<div style="display:flex;justify-content:space-between;padding:.25rem .5rem;border-bottom:1px solid var(--border);">
          <span>${escapeHtml(n.label)}</span><span style="opacity:.7;">depth ${n.depth} · ${pct}%</span>
        </div>`;
    }).join('');
}

function exportWotGraph() {
    if (!wotGraph) return;
    const blob = new Blob([JSON.stringify(wotGraph, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `wot-graph-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------------
 * BACKUP INFO
 * ------------------------------------------------------------------- */
function refreshBackupInfo() {
    const el = document.getElementById('backupInfo');
    if (!el) return;
    const total = keys.length;
    const withPriv = keys.filter(k => k.privateKey).length;
    const revoked = keys.filter(k => k.revoked).length;
    el.textContent = `Stored: ${total} key(s) · ${withPriv} with private material · ${revoked} revoked`;
}

/* ---------------------------------------------------------------------
 * SERVICE WORKER
 * ------------------------------------------------------------------- */
function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(location.hostname)) return;
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(reg => console.log('SW registered:', reg.scope))
            .catch(err => console.warn('SW failed:', err));
    });
}

/* ---------------------------------------------------------------------
 * BIND ACTIONS
 * ------------------------------------------------------------------- */
function bindActions() {
    // Generate
    document.getElementById('generateKeysButton')?.addEventListener('click', generateKeys);
    document.getElementById('keyType')?.addEventListener('change', updateKeyStrengthInfo);
    window.addEventListener('pasevsu-language-changed', updateKeyStrengthInfo);
    updateKeyStrengthInfo();
    // Manage
    document.getElementById('storeKeysButton')?.addEventListener('click', storeKeys);
    document.getElementById('reloadKeysButton')?.addEventListener('click', refreshKeyList);
    document.getElementById('exportSelectedButton')?.addEventListener('click', exportSelectedKeys);
    document.getElementById('deleteSelectedButton')?.addEventListener('click', deleteSelectedKeys);
    document.getElementById('lookupKeyButton')?.addEventListener('click', lookupKeyFromServer);
    document.getElementById('refreshAllKeysButton')?.addEventListener('click', refreshAllKeysFromServers);
    document.getElementById('showQrButton')?.addEventListener('click', showQrForSelected);
    document.getElementById('showAttributesButton')?.addEventListener('click', () => {
        const indices = getSelectedIndices().reverse();
        if (indices.length !== 1) { toast('Select exactly one.', 'error'); return; }
        showUserAttributes(indices[0]);
    });
    document.getElementById('showNotationsButton')?.addEventListener('click', showNotationsForSelected);
    document.getElementById('showPreferencesButton')?.addEventListener('click', showPreferencesForSelected);
    document.getElementById('mergeKeyButton')?.addEventListener('click', mergeKeyFromInput);
    // Search / filter
    const searchInput = document.getElementById('keySearchInput');
    let searchDebounce = null;
    searchInput?.addEventListener('input', () => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(refreshKeyList, 120);
    });
    document.getElementById('keyFilterSelect')?.addEventListener('change', refreshKeyList);
    // Encrypt / decrypt
    document.getElementById('encryptMessageButton')?.addEventListener('click', encryptMessage);
    document.getElementById('discoverRecipientButton')?.addEventListener('click', discoverRecipientByEmail);
    document.getElementById('saveRecipientKeyButton')?.addEventListener('click', saveDiscoveredRecipientKey);
    document.getElementById('encryptRecipientMode')?.addEventListener('change', updateEncryptRecipientMode);
    document.getElementById('recipientEmail')?.addEventListener('input', () => clearEmailRecipientState());
    document.getElementById('recipientEmail')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); discoverRecipientByEmail(); }
    });
    updateEncryptRecipientMode();
    document.getElementById('decryptMessageButton')?.addEventListener('click', decryptMessage);
    bindFortressEngine();
    // Sign / verify
    document.getElementById('signMessageButton')?.addEventListener('click', signMessage);
    document.getElementById('verifyMessageButton')?.addEventListener('click', verifyMessage);
    document.getElementById('verifyDetachedButton')?.addEventListener('click', verifyDetachedSignature);
    // Publish
    document.getElementById('selectAllServersButton')?.addEventListener('click', () => {
        document.querySelectorAll('.srv-checkbox').forEach(cb => { cb.checked = true; });
    });
    document.getElementById('clearServersButton')?.addEventListener('click', () => {
        document.querySelectorAll('.srv-checkbox').forEach(cb => { cb.checked = false; });
    });
    document.getElementById('publishKeyButton')?.addEventListener('click', publishSelectedKey);
    // Manifest
    document.getElementById('metaKeySelect')?.addEventListener('change', loadMetadataForSelectedKey);
    document.getElementById('saveMetaButton')?.addEventListener('click', saveExtendedMetadata);
    document.getElementById('generateManifestButton')?.addEventListener('click', generateManifest);
    document.getElementById('downloadManifestButton')?.addEventListener('click', downloadManifest);
    document.getElementById('importManifestButton')?.addEventListener('click', importManifest);
    document.getElementById('manifestFileInput')?.addEventListener('change', handleManifestFile);
    // Passphrase
    document.getElementById('changePassphraseButton')?.addEventListener('click', changeKeyPassphrase);
    // Revocation
    document.getElementById('generateRevocationButton')?.addEventListener('click', generateRevocationCertificate);
    document.getElementById('downloadRevocationButton')?.addEventListener('click', downloadRevocationCertificate);
    document.getElementById('applyRevocationButton')?.addEventListener('click', chooseRevocationFile);
    document.getElementById('revocationFileInput')?.addEventListener('change', applyRevocationCertificateFromFile);
    // Certify
    document.getElementById('certifyKeyButton')?.addEventListener('click', certifyPublicKey);
    document.getElementById('copyCertifiedButton')?.addEventListener('click', copyCertifiedKey);
    document.getElementById('downloadCertifiedButton')?.addEventListener('click', downloadCertifiedKey);
    document.getElementById('publishCertifiedButton')?.addEventListener('click', publishCertifiedKey);
    // Backup
    document.getElementById('exportBackupButton')?.addEventListener('click', exportEncryptedBackup);
    document.getElementById('importBackupButton')?.addEventListener('click', chooseBackupFile);
    document.getElementById('backupFileInput')?.addEventListener('change', importEncryptedBackup);
    document.getElementById('listSnapshotsButton')?.addEventListener('click', listSnapshots);
    document.getElementById('createSnapshotButton')?.addEventListener('click', createManualSnapshot);
    // Inspector
    document.getElementById('inspectKeyButton')?.addEventListener('click', handleInspectKey);
    document.getElementById('exportInspectButton')?.addEventListener('click', exportInspection);
    // File encryption
    bindFileDropZone();
    document.getElementById('processFilesButton')?.addEventListener('click', processFiles);
    document.getElementById('clearFilesButton')?.addEventListener('click', clearFileQueue);
    // Session keys
    document.getElementById('generateSessionButton')?.addEventListener('click', generateEncryptedSessionKey);
    document.getElementById('testSessionButton')?.addEventListener('click', testSessionKey);
    // WoT
    document.getElementById('buildWotButton')?.addEventListener('click', handleBuildWot);
    document.getElementById('exportWotButton')?.addEventListener('click', exportWotGraph);
    // Modal
    document.getElementById('qrCloseButton')?.addEventListener('click', hideQrModal);
    document.getElementById('qrModal')?.addEventListener('click', e => {
        if (e.target.id === 'qrModal') hideQrModal();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hideQrModal(); });
}

/* ---------------------------------------------------------------------
 * SAFE CROSS-MODULE SURFACE
 * Exposes public certificate records only. Private key material remains
 * inside app.js / IndexedDB workflows and is never returned here.
 * ------------------------------------------------------------------- */
window.PasevSUApp = Object.freeze({
    getPublicKeyRecords() {
        return keys.filter(k => Boolean(k.publicKey)).map(k => ({
            fingerprint: k.fingerprint || null, email: k.email || null, comment: k.comment || null,
            userLabel: k.userLabel || null, revoked: Boolean(k.revoked), publicKey: k.publicKey
        }));
    }
});

/* ---------------------------------------------------------------------
 * BOOTSTRAP
 * ------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    await loadKeysFromLocalStorage();
    const qrReady = await ensureQrProvider();
    renderServerList();
    refreshKeyList();
    refreshBackupInfo();
    bindActions();
    registerServiceWorker();
    document.querySelectorAll('textarea[readonly]').forEach(el => el.addEventListener('click', () => el.select()));

    if (typeof openpgp === 'undefined') {
        toast('OpenPGP.js is missing. Run setup_vendor.ps1 or setup_vendor.sh first.', 'error');
    }
    if (!qrReady) {
        console.warn('The local QR provider could not be loaded; QR display is unavailable.');
    }

    const today = new Date().toISOString().split('T')[0];
    const exp = document.getElementById('keyExpiration');
    if (exp) exp.setAttribute('min', today);

    checkProxyAvailability().then(ok => {
        const info = document.getElementById('backupInfo');
        if (info && !ok) info.textContent += ' · proxy offline';
    });
});
