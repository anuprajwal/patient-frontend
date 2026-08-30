export const persistSelection = (key, item) => {
  if (item) {
    sessionStorage.setItem(`selected_${key}`, JSON.stringify(item));
  } else {
    sessionStorage.removeItem(`selected_${key}`);
  }
};

export const getPersistedSelection = (key) => {
  try {
    const raw = sessionStorage.getItem(`selected_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error(`Error loading stored ${key}:`, err);
    return null;
  }
};

export const clearPersistedSelection = (key) => {
  sessionStorage.removeItem(`selected_${key}`);
};