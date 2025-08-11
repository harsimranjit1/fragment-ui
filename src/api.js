// fragments-ui/src/api.js
import { getUser } from './auth';

const API_URL = process.env.API_URL;

// Fail fast if env not loaded
if (!API_URL) {
  throw new Error('API_URL is not set. Put it in fragments-ui/.env and restart `npm start`.');
}
console.log('Using API_URL:', API_URL);

async function authHeaders(type) {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');
  return user.authorizationHeaders(type);
}

// GET /v1/fragments
export async function listFragments() {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/v1/fragments`, { headers });
  if (!res.ok) throw new Error(`GET /v1/fragments failed: ${res.status}`);
  return res.json();
}

// keep compatibility with app.js that imports getUserFragments
export const getUserFragments = listFragments;

// POST /v1/fragments
export async function createFragment(text) {
  const headers = await authHeaders('text/plain');
  const res = await fetch(`${API_URL}/v1/fragments`, {
    method: 'POST',
    headers,
    body: text,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`POST /v1/fragments failed: ${res.status}${body ? ` | ${body}` : ''}`);
  }
  return res; // caller can read Location header
}

// helper to GET one fragment by id (used by the View button)
export async function getFragmentById(id) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/v1/fragments/${id}`, { headers });
  if (!res.ok) throw new Error(`GET /v1/fragments/${id} failed: ${res.status}`);
  return res.text();
}
