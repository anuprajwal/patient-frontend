export const setSelectedItem = (key, data) => {
  if (data) {
    localStorage.setItem(`selected_${key}`, JSON.stringify(data));
  } else {
    localStorage.removeItem(`selected_${key}`);
  }
};

export const getSelectedItem = (key) => {
  try {
    const raw = localStorage.getItem(`selected_${key}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
};

export const clearSelectedItem = (key) => {
  localStorage.removeItem(`selected_${key}`);
};