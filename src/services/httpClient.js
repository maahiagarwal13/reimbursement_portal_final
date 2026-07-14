/**
 * HTTP Client — Scaffolded for Future Backend Integration
 * ─────────────────────────────────────────────────────────────────────────────
 * This module provides a thin wrapper around the Fetch API, preconfigured with
 * base URL, JSON content-type, and Bearer token injection.
 *
 * CURRENT STATUS: Scaffolded but NOT actively used by mock service
 * implementations. All services currently read/write localStorage directly.
 * When a real ASP.NET Core backend is available, swap localStorage calls in
 * each service module with calls to this client.
 *
 * IMPORTANT: No component or page should ever import this file directly.
 * Only service-layer modules should use the HTTP client.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let _baseUrl = '';
let _authToken = null;

/**
 * Sets the base URL for all API requests.
 * Typically called once at app startup, e.g. from environment config.
 * @param {string} url - Base URL (e.g. 'https://api.sem-portal.samsung.com').
 */
export const setBaseUrl = (url) => {
  _baseUrl = url.replace(/\/+$/, ''); // strip trailing slashes
};

/**
 * Stores the Bearer token that will be attached to every subsequent request.
 * Called after successful login.
 * @param {string|null} token - JWT token string, or null to clear.
 */
export const setAuthToken = (token) => {
  _authToken = token;
};

/**
 * Returns the currently stored auth token.
 * @returns {string|null}
 */
export const getAuthToken = () => _authToken;

/**
 * Builds the default headers object, including Authorization if a token is set.
 * @returns {HeadersInit}
 */
const buildHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (_authToken) {
    headers['Authorization'] = `Bearer ${_authToken}`;
  }

  return headers;
};

/**
 * Replaces path-parameter placeholders in a URL template.
 * @param {string} template - URL template with {param} placeholders.
 * @param {Record<string, string>} params - Key-value pairs for substitution.
 * @returns {string} Interpolated URL.
 *
 * @example
 *   interpolate('/api/employees/{ghrId}', { ghrId: '40261873' })
 *   // => '/api/employees/40261873'
 */
export const interpolate = (template, params = {}) => {
  return Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`{${key}}`, encodeURIComponent(value)),
    template
  );
};

/**
 * Core request executor. All HTTP verbs route through this.
 * @param {string} path - Relative API path (will be prefixed with baseUrl).
 * @param {RequestInit} options - Fetch options (method, body, etc.).
 * @returns {Promise<any>} Parsed JSON response body.
 * @throws {Error} With server error message or HTTP status text.
 */
const request = async (path, options = {}) => {
  const url = `${_baseUrl}${path}`;
  let response;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const mergedHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...buildHeaders(),
    ...(options.headers || {}),
  };

  if (options.body instanceof FormData) {
    delete mergedHeaders['Content-Type'];
  }

  window.dispatchEvent(new Event('api-request-start'));
  try {
    response = await fetch(url, {
      cache: 'no-store',
      ...options,
      signal: controller.signal,
      headers: mergedHeaders,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    window.dispatchEvent(new Event('api-request-end'));
    if (error.name === 'AbortError') {
      throw new Error('Network error: Request timed out (15s). Ensure the server is running.');
    }
    // Network errors (e.g. CORS, connection refused)
    throw new Error(error.message || 'Network error: Failed to connect to server');
  }

  // Handle 204 No Content (e.g. DELETE responses)
  if (response.status === 204) {
    window.dispatchEvent(new Event('api-request-end'));
    return null;
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // If it's not JSON, read it as text so we don't throw a SyntaxError
      const text = await response.text();
      data = { message: response.ok ? text : `Server returned ${response.status} (${response.statusText})` };
    }
  } catch (error) {
    // Fallback if parsing fails unexpectedly
    data = { message: `Failed to parse response: ${error.message}` };
  }

  if (!response.ok) {
    window.dispatchEvent(new Event('api-request-end'));
    const errorMessage =
      data?.message || data?.title || response.statusText || 'Request failed';
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  window.dispatchEvent(new Event('api-request-end'));
  return data;
};

/**
 * HTTP GET request.
 * @param {string} path - API path.
 * @returns {Promise<any>}
 */
export const get = async (path) => {
  return request(path, { method: 'GET' });
};

/**
 * HTTP POST request.
 * @param {string} path - API path.
 * @param {any} body - Request body (will be JSON-stringified, unless it is FormData).
 * @param {RequestInit} customOptions - Additional fetch options.
 * @returns {Promise<any>}
 */
export const post = async (path, body, customOptions = {}) => {
  const isFormData = body instanceof FormData;
  const options = {
    method: 'POST',
    body: isFormData ? body : JSON.stringify(body),
    ...customOptions,
  };

  if (isFormData) {
    options.headers = { ...options.headers };
    // Let the browser set the Content-Type automatically (with boundary)
    // We can't pass undefined, so we use a Headers object or explicitly delete it before fetch.
    // However, in our request wrapper we merge headers. We will handle it by overriding.
  }

  return request(path, options);
};

/**
 * HTTP PUT request.
 * @param {string} path - API path.
 * @param {any} body - Request body (will be JSON-stringified, unless it is FormData).
 * @param {RequestInit} customOptions - Additional fetch options.
 * @returns {Promise<any>}
 */
export const put = async (path, body, customOptions = {}) => {
  const isFormData = body instanceof FormData;
  const options = {
    method: 'PUT',
    body: isFormData ? body : JSON.stringify(body),
    ...customOptions,
  };

  return request(path, options);
};

/**
 * HTTP DELETE request.
 * @param {string} path - API path.
 * @returns {Promise<any>}
 */
export const del = async (path) => {
  return request(path, { method: 'DELETE' });
};

/**
 * Convenience export for modules that need the full client as one object.
 */
const httpClient = { setBaseUrl, setAuthToken, getAuthToken, interpolate, get, post, put, del };
export default httpClient;
