// dashboard/src/lib/api.js

const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // You can add more robust error handling here
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export default authenticatedFetch;
