import axios from 'axios';

let accessToken = null;
let onSessionExpired = () => {};
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessToken = token;
};
export const setOnSessionExpired = (fn) => {
  onSessionExpired = fn;
};

export const api = axios.create({ baseURL: '/api', withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

export function refreshSession() {
  // Share one in-flight refresh so parallel 401s don't rotate the token twice.
  refreshPromise ??= axios
    .post('/api/auth/refresh', null, { withCredentials: true })
    .then((res) => {
      setAccessToken(res.data.accessToken);
      return res.data;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;
    if (response?.status === 401 && !config._retry && !config.url.startsWith('/auth/')) {
      config._retry = true;
      try {
        await refreshSession();
        return api(config);
      } catch {
        setAccessToken(null);
        onSessionExpired();
      }
    }
    return Promise.reject(error);
  },
);

export const errorMessage = (err) => err?.response?.data?.error?.message || err?.message || 'Something went wrong';
