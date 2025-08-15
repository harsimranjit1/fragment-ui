import { signIn, getUser, signOut } from './auth.js';
import { getUserFragments, createFragment, getFragmentById } from './api.js';

const $ = (s) => document.querySelector(s);

function renderUser(user) {
  const el = $('#user');
  el.innerHTML = user
    ? `Logged in as <span class="ok">${user.username || user.email}</span>`
    : 'Not logged in';
}

async function refreshList() {
  const fragsEl = $('#frags');
  const status = $('#status');
  try {
    status.textContent = 'GET /v1/fragments?expand=1 …';
    const fragments = await getUserFragments();
    fragsEl.textContent = JSON.stringify(fragments, null, 2);
    status.textContent = 'GET /v1/fragments?expand=1 ✓';

    fragsEl.onclick = async () => {
      const sel = window.getSelection()?.toString() || '';
      const match = sel.match(/[0-9a-f-]{16,}/i);
      if (!match) return;
      const id = match[0];
      const out = $('#preview');
      out.textContent = 'Fetching…';
      try {
        const { contentType, text } = await getFragmentById(id);
        let shown = text;
        if (contentType.includes('application/json')) {
          try { shown = JSON.stringify(JSON.parse(text), null, 2); } catch {}
        }
        out.textContent = `(${contentType})\n\n${shown}`;
      } catch (err) {
        out.textContent = `Error: ${err.message}`;
      }
    };
  } catch (e) {
    status.textContent = `GET /v1/fragments error: ${e.message}`;
  }
}

function wireCreateForm() {
  const form = $('#createForm');
  const text = $('#fragText');
  const ctype = $('#ctype');
  const last = $('#lastCreated');
  const locSpan = $('#lastLocation');
  const createStatus = $('#createStatus');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    createStatus.textContent = 'Creating…';
    last.innerHTML = '';
    try {
      const { location, id } = await createFragment(ctype.value, text.value || '');
      createStatus.innerHTML = `<span class="ok">201 Created</span>`;
      locSpan.textContent = location || '—';

      last.innerHTML = `
        <div>New fragment id: <code>${id ?? '—'}</code></div>
        <button id="viewBtn" type="button"${id ? '' : ' disabled'}>Preview now</button>
        <pre id="viewOut"></pre>
      `;

      $('#viewBtn')?.addEventListener('click', async () => {
        const out = $('#viewOut');
        out.textContent = 'Fetching…';
        try {
          if (!id) throw new Error('No fragment id');
          const { contentType, text } = await getFragmentById(id);
          let shown = text;
          if (contentType.includes('application/json')) {
            try { shown = JSON.stringify(JSON.parse(text), null, 2); } catch {}
          }
          out.textContent = `(${contentType})\n\n${shown}`;
        } catch (err) {
          out.textContent = `Error: ${err.message}`;
        }
      });

      text.value = '';
      await refreshList();
    } catch (err) {
      createStatus.innerHTML = `<span class="err">${err.message}</span>`;
    }
  });
}

async function init() {
  // helpful: log fetches so you can screenshot the Location in Network
  window.fetch = ((orig) => (...args) => {
    console.log('fetch ->', args[0], args[1]);
    return orig(...args);
  })(window.fetch);

  const user = await getUser();
  renderUser(user);

  $('#login').addEventListener('click', (e) => { e.preventDefault(); signIn(); });
  $('#logout').addEventListener('click', (e) => { e.preventDefault(); signOut(); });

  wireCreateForm();
  if (user) await refreshList();
}

document.addEventListener('DOMContentLoaded', init);
