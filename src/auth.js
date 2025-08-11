// fragments-ui/src/auth.js
import { UserManager } from 'oidc-client-ts';

// Read from Parcel's env (set in .env)
const ENV = {
  REGION:     process.env.COGNITO_REGION,
  POOL_ID:    process.env.COGNITO_POOL_ID,
  CLIENT_ID:  process.env.COGNITO_CLIENT_ID,
  DOMAIN:     process.env.COGNITO_DOMAIN, // e.g., https://my-fragment-app.auth.us-east-1.amazoncognito.com
};

// Build inline metadata (no network fetch = no CORS issues)
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
  redirect_uri: window.location.origin,   // http://localhost:1234
  response_type: 'code',
  scope: 'openid email',
  automaticSilentRenew: false,
});

// Make a nice shape for our app
function formatUser(user) {
  return {
    username:       user.profile['cognito:username'],
    email:          user.profile.email,
    idToken:        user.id_token,
    accessToken:    user.access_token,
    authorizationHeaders: (type='application/json') => ({
      'Content-Type': type,
      Authorization: `Bearer ${user.id_token}`, // backend expects ID token
    }),
  };
}

export function signIn() {
  return userManager.signinRedirect();
}

export async function getUser() {
  // Handle callback
  if (window.location.search.includes('code=')) {
    const user = await userManager.signinCallback();
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return formatUser(user);
  }
  // Existing session?
  const existing = await userManager.getUser();
  return existing ? formatUser(existing) : null;
}
