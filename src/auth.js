// src/auth.js
import { UserManager } from 'oidc-client-ts';

const CFG = window.FRAGMENTS_UI_CONFIG || {};
const AUTH_TYPE = (CFG.AUTH_TYPE || process.env.AUTH_TYPE || 'basic').toLowerCase();

// We'll assign implementations, then export them at the bottom.
let signIn, signOut, getUser;

/** ========== BASIC AUTH MODE (Lab 9) ========== */
if (AUTH_TYPE === 'basic') {
  const STORAGE_KEY = 'fragments_basic_auth';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }
  function save(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  signIn = async function () {
    const email = window.prompt('Email (e.g., user1@email.com):');
    if (!email) return;
    const password = window.prompt('Password (e.g., password1):');
    if (!password) return;
    const token = btoa(`${email}:${password}`);
    save({ email, token });
    window.location.reload();
  };

  signOut = function () {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  getUser = async function () {
    const data = load();
    if (!data?.email || !data?.token) return null;
    return {
      username: data.email,
      email: data.email,
      authorizationHeaders: (type = 'application/json') => ({
        'Content-Type': type,
        Authorization: `Basic ${data.token}`,
      }),
    };
  };

/** ========== COGNITO MODE (later labs) ========== */
} else {
  const ENV = {
    REGION:    CFG.COGNITO_REGION    || process.env.COGNITO_REGION,
    POOL_ID:   CFG.COGNITO_POOL_ID   || process.env.COGNITO_POOL_ID,
    CLIENT_ID: CFG.COGNITO_CLIENT_ID || process.env.COGNITO_CLIENT_ID,
    DOMAIN:    CFG.COGNITO_DOMAIN    || process.env.COGNITO_DOMAIN,
  };

  const issuer  = `https://cognito-idp.${ENV.REGION}.amazonaws.com/${ENV.POOL_ID}`;
  const metadata = {
    issuer,
    authorization_endpoint: `${ENV.DOMAIN}/oauth2/authorize`,
    token_endpoint:         `${ENV.DOMAIN}/oauth2/token`,
    userinfo_endpoint:      `${ENV.DOMAIN}/oauth2/userInfo`,
    jwks_uri:               `${issuer}/.well-known/jwks.json`,
  };

  const userManager = new UserManager({
    authority: issuer,
    metadata,
    client_id: ENV.CLIENT_ID,
    redirect_uri: window.location.origin,
    response_type: 'code',
    scope: 'openid email',
    automaticSilentRenew: false,
  });

  function formatUser(user) {
    return {
      username: user.profile['cognito:username'],
      email: user.profile.email,
      idToken: user.id_token,
      accessToken: user.access_token,
      authorizationHeaders: (type = 'application/json') => ({
        'Content-Type': type,
        // backend validates ID token in Cognito mode
        Authorization: `Bearer ${user.id_token}`,
      }),
    };
  }

  signIn = function () {
    return userManager.signinRedirect();
  };

  signOut = function () {
    return userManager.removeUser().then(() => window.location.reload());
  };

  getUser = async function () {
    if (window.location.search.includes('code=')) {
      const user = await userManager.signinCallback();
      window.history.replaceState({}, document.title, window.location.pathname);
      return formatUser(user);
    }
    const existing = await userManager.getUser();
    return existing ? formatUser(existing) : null;
  };
}

export { signIn, signOut, getUser };
