const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export const getApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const getAssetUrl = (path = '') => {
  if (!path) {
    return '';
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};

export const apiRequest = async (path, options = {}) => {
  const { body, headers = {}, ...restOptions } = options;
  const token = localStorage.getItem('authToken');
  const requestHeaders = { ...headers };
  const isFormData = body instanceof FormData;

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (!isFormData) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(getApiUrl(path), {
    ...restOptions,
    headers: requestHeaders,
    body: body == null ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Request failed.');
  }

  return payload;
};
