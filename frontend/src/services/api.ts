import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_URL,
});

// We will inject the Clerk token dynamically in the components using `useAuth().getToken()`
// or by setting a default header when the app loads.
