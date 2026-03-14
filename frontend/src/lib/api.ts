import axios from 'axios'

export const api = axios.create({
  // Dev: proxied by Vite (see vite.config.ts). Prod: set VITE_API_URL.
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

