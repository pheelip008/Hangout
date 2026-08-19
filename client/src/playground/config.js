const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) 
    ? import.meta.env.VITE_API_BASE 
    : "http://localhost:3000";

// Assets are served from Vite's public directory at /playground/
// Must be an absolute URL for use as a base in new URL() calls
export const GAME_ASSET_BASE_URL = window.location.origin + '/playground/';

export default API_BASE;
