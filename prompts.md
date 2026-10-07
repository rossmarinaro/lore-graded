webworker proxy support:


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



login button:


Create a login button and style it like the language buttons. Position it top left above the LORE logo.

Requirements:
1. When clicked, it should make a GET fetch request to 'https://lore-graded.com/api/auth/google'.
2. The backend will return a redirect URL (the Google OAuth consent screen) or a JSON payload containing the auth URL. Handle both cases:
   - If the API returns a direct redirect/HTML, ensure it navigates the browser window to that destination.
   - If it returns JSON (e.g., `{ url: "..." }`), catch the URL and update `window.location.href`.
3. Account for credentials/cookies: Ensure `credentials: 'include'` is set on the fetch request so that any existing session context or incoming authentication cookies are handled correctly across domains.



submit button:


Create a function to handle submitting an order to 'https://lore-graded.onrender.com/submit-order'.
It should trigger when the user submits their selection of up to ten cards.

Requirements:
1. Request Structure: The endpoint expects a POST request. The body must contain an object structured exactly like this:
   {
     "order": {
       "recipient": string,
       "street_address": string,
       "city": string,
       "state": string,
       "zip": string
       "phone": string,
       "created_at": string (ISO 8601 UTC timestamp format),
       "cards": array of Card type. this type has params serial_number: string, name: string for now. we will add more later.
     }
   }
2. Authentication / Cookies: This endpoint is protected by a session token cookie (JWT). You MUST include `credentials: 'include'` in the fetch options so the browser automatically attaches the authentication cookies with the cross-origin request to Render.
3. Payload Handling: Ensure the payload is correctly stringified with 'Content-Type': 'application/json' headers. Do not pass raw objects or let `req.body.order` serialize into an unparsed string format.
4. Error Handling: Handle standard response statuses (e.g., 200/201 success, 401/403 access denied if the token cookie is missing or invalid, and 400/500 backend errors). Show appropriate UI feedback states (loading, success, error messages).










