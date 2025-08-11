// fragments-ui/src/app.js
import { signIn, getUser } from './auth';
import { getUserFragments, createFragment, getFragmentById } from './api';

const $ = (s) => document.querySelector(s);

function renderUser(user) {
  const el = $('#user');
  if (user) {
    el.innerHTML = `Logged in as <span class="ok">${user.username || user.email}</span>`;
  } else {
    el.textContent = 'Not logged in';
  }
}

async function refreshList() {
  const frags = $('#frags');
  const status = $('#status');
  try {
    const data = await getUserFragments();
    frags.textContent = JSON.stringify(data, null, 2);
    status.textContent = 'GET /v1/fragments';
  } catch (e) {
    status.textContent = `GET /v1/fragments  ${e.message}`;
  }
}

function wireCreateForm() {
  const form = $('#createForm');
  const text = $('#fragText');
  const last = $('#lastCreated');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    last.innerHTML = 'Creating…';
    try {
      const res = await createFragment(text.value || '');

      // Prefer Location header; fall back to body.fragment.id if header not exposed
      let loc = res.headers.get('Location') || null;
      let id = loc ? loc.split('/').pop() : null;

      if (!loc) {
        try {
          const body = await res.clone().json();
          if (body?.fragment?.id) {
            id = body.fragment.id;
            loc = `/v1/fragments/${id}`;
          }
        } catch {
          /* ignore */
        }
      }

      last.innerHTML = `
        <div class="ok">201 Created</div>
        <div>Location: <code>${loc ?? 'null'}</code></div>
        <button id="viewBtn" type="button"${id ? '' : ' disabled'}>View fragment</button>
        <pre id="viewOut"></pre>
      `;

      // View button will fetch with Bearer and show the content
      $('#viewBtn').addEventListener('click', async () => {
        const out = $('#viewOut');
        out.textContent = 'Fetching…';
        try {
          if (!id) throw new Error('No fragment id available');
          const body = await getFragmentById(id);
          out.textContent = body;
        } catch (err) {
          out.textContent = `Error: ${err.message}`;
        }
      });

      // clear input, refresh list
      text.value = '';
      await refreshList();
    } catch (err) {
      last.innerHTML = `<div class="err"> ${err.message}</div>`;
    }
  });
}

async function init() {
  // optional: log every fetch so you can see real GET/POST in Console
  window.fetch = ((orig) => (...args) => {
    console.log('fetch ->', args[0], args[1]);
    return orig(...args);
  })(window.fetch);

  const user = await getUser();
  renderUser(user);

  $('#login').addEventListener('click', (e) => {
    e.preventDefault();
    signIn();
  });

  wireCreateForm();

  if (user) {
    await refreshList();
  }
}

document.addEventListener('DOMContentLoaded', init);
