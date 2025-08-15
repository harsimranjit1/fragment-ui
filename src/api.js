import { getUser } from './auth';

const API_URL =
  (window.FRAGMENTS_UI_CONFIG && window.FRAGMENTS_UI_CONFIG.API_URL) ||
  process.env.API_URL;

if (!API_URL) {
  throw new Error('API_URL is not set. Set it in config.js or .env.');
}
console.log('Using API_URL:', API_URL);

async function authHeaders(type) {
  const user = await getUser();
  if (!user) throw new Error('Not logged in');
  return user.authorizationHeaders(type);
}


// List (expanded)
export async function getUserFragments() {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/v1/fragments?expand=1`, { headers });
  if (!res.ok) throw new Error(`GET /v1/fragments failed: ${res.status}`);
  return res.json();
}

// Create and return both Location + id
export async function createFragment(contentType, body) {
  const headers = await authHeaders(contentType);
  const res = await fetch(`${API_URL}/v1/fragments`, {
    method: 'POST',
    headers,
    body: body ?? '',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST /v1/fragments failed: ${res.status}${text ? ` | ${text}` : ''}`);
  }

  // Try Location header (server must expose it via CORS)
  let location = res.headers.get('Location') || res.headers.get('location') || null;

  // Try to get id from response body (if API returns it)
  let id = null;
  try {
    const data = await res.clone().json();
    id = data?.fragment?.id ?? null;
  } catch {
    // ignore parse errors; body might be empty
  }

  // Derive id from Location if needed
  if (!id && location) id = location.split('/').pop();

  return { location, id, raw: res };
}

export async function getFragmentById(id) {
  const headers = await authHeaders();
  const res = await fetch(`${API_URL}/v1/fragments/${id}`, { headers });
  if (!res.ok) throw new Error(`GET /v1/fragments/${id} failed: ${res.status}`);
  const contentType = res.headers.get('Content-Type') || '';
  const text = await res.text();
  return { contentType, text };
}
