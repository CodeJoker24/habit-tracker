const TOKEN_KEY = 'habit-tracker:access-token';
const SESSION_KEY = 'habit-tracker:session';
const PROFILE_KEY = 'habit-tracker:profile';

let accessToken = null;

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    if (value) localStorage.setItem(key, JSON.stringify(value));
    else localStorage.removeItem(key);
  } catch {
    return;
  }
};

export const setAccessToken = (token) => {
  accessToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    return;
  }
};

export const getAccessToken = () => {
  if (!accessToken) {
    try {
      accessToken = localStorage.getItem(TOKEN_KEY);
    } catch {
      accessToken = null;
    }
  }
  return accessToken;
};

export const setSessionCache = (session) => write(SESSION_KEY, session);
export const getSessionCache = () => read(SESSION_KEY);
export const setProfileCache = (profile) => write(PROFILE_KEY, profile);
export const getProfileCache = () => read(PROFILE_KEY);

export const clearAuthCache = () => {
  accessToken = null;
  [TOKEN_KEY, SESSION_KEY, PROFILE_KEY].forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      return;
    }
  });
};
