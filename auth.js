
const SIGNIN_URL = 'https://learn.reboot01.com/api/auth/signin';
const TOKEN_KEY  = 'r01_token';


export async function login(credential, password) {
  // Build the Basic auth header value
  const encoded = btoa(`${credential}:${password}`);

  const res = await fetch(SIGNIN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('Invalid username/email or password. Please try again.');
  }
  if (!res.ok) {
    throw new Error(`Login failed (HTTP ${res.status}). Please try again.`);
  }

  // The API returns the JWT as a quoted JSON string, e.g. "eyJ..."
  const raw = await res.text();

  // Strip surrounding quotes if present
  const token = raw.replace(/^"|"$/g, '').trim();

  if (!token || token.split('.').length !== 3) {
    throw new Error('Received an invalid token from the server.');
  }

  saveToken(token);
  return token;
}

/**
 * Save the JWT to localStorage.
 */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Retrieve the stored JWT from localStorage.
 * Returns null if not present.
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

/**
 * Remove the stored JWT (log out).
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Check if a token is stored.
 */
export function isLoggedIn() {
  return !!getToken();
}
