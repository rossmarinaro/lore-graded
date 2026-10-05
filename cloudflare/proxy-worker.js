export default {
  async fetch(request) {
    const url = new URL(request.url);
    // Check if path starts with /api
    if (url.pathname.startsWith('/api')) {
      // Forward to Render microservice (stripping or keeping /api depending on backend routes)
      const backendUrl = request.url.replace('https://loregraded.com', 'https://onrender.com');
      return fetch(new Request(backendUrl, request));
    }
    // Otherwise, fallback to the main origin (frontend)
    return fetch(request);
  }
}
