You need to place this script into a Cloudflare Worker and assign it to a Custom Route targeting your main domain.
Because your domain (loregraded.com) is registered on GoDaddy but managed via Cloudflare, all configuration happens directly inside your Cloudflare Dashboard. GoDaddy's only job here is pointing its nameservers to Cloudflare.
Follow these step-by-step instructions to deploy your script and route the traffic correctly.
Step 1: Create the Cloudflare Worker
1. Log in to your Cloudflare Dashboard.
2. On the left sidebar, click Compute (Workers & Pages).
3. Click the Create button (or Create application), then select Create Worker.
4. Give your Worker a descriptive name (e.g., render-api-router) and click Deploy.
5. Click Edit Code to open the online code editor.
6. Delete any default code in the editor, paste your exact JavaScript snippet, and click Save and deploy.
Step 2: Bind the Worker to Your Custom Route
To make the Worker intercept incoming traffic to loregraded.com, you must assign it to a route:
7. Go back to your Cloudflare Dashboard home page and click on your domain: loregraded.com.
8. On the left sidebar, navigate to Websites > loregraded.com > Workers Routes.
9. Click Add route.
10. Configure the route using these parameters:
• Route: ://loregraded.com* (The asterisk ensures it intercepts all traffic on the domain)
• Worker: Select the worker you created in Step 1 (e.g., render-api-router).
11. Click Save


code to paste:

export default {
async fetch(request) {
const url = new URL(request.url);
// Check if path starts with /api
if (url.pathname.startsWith('/api')) {
// Forward to Render microservice (stripping or keeping /api depending on backend routes)
const backendUrl = request.url.replace('https://loregraded.com', 'https://lore-graded.onrender.com');
return fetch(new Request(backendUrl, request));
}
// Otherwise, fallback to the main origin (frontend)
return fetch(request);
}
}




