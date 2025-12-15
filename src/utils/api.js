// Centralized API configuration
// - In production, uses Vercel env var VITE_API_BASE_URL
// - In local development, falls back to localhost:5000 (backend default)
// - Trailing slashes are removed to avoid "//api/..." URLs

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '');


