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
// Check if path starts with /api2
if (url.pathname.startsWith('/api2')) {
// Forward to Render microservice (stripping or keeping /api depending on backend routes)
const backendUrl = request.url.replace('https://loregraded.com', 'https://lore-graded.onrender.com');
return fetch(new Request(backendUrl, request));
}
// Otherwise, fallback to the main origin (frontend)
return fetch(request);
}
}



submit button:

Create a request when submitting an order to 'https://lore-graded.onrender.com/api2/api/submit-order'.
It should trigger when the user submits their selection of up to ten cards. This endpoint will add a user to the sunday drop queue and notify them by email. This endpoint does not need to store user order information but be able to map a submission in this api to the source of truth submission which is handled in sql.

Requirements:

1. Request Structure: The endpoint expects a POST request. The body must contain an object with value user_id returned from sql database for order submission.

2. Authentication / Cookies: This endpoint is protected by a session token cookie (JWT). You MUST include `credentials: 'include'` in the fetch options so the browser automatically attaches the authentication cookies with the cross-origin request to Render.

3. Payload Handling: Ensure the payload is correctly stringified with 'Content-Type': 'application/json' headers.

4. Error Handling: Handle standard response statuses (e.g., 200/201 success, 401/403 access denied if the token cookie is missing or invalid, and 400/500 backend errors). Show appropriate UI feedback states (loading, success, error messages).

5. The Order: Save the full order in SQL.  We will save only a lightweight document containing the user_id, order_id, and a queue timestamp. order_id: The SQL Insert Result - Where it comes from: When you insert the order into your SQL database (using Drizzle or native SQL), the database auto-generates the order's primary key (e.g., a serial integer or a UUID). Your SQL query should return this newly created ID so you can pass it along to MongoDB.

6. Set up an outboxTable for us to safely sync our main sql transactions with our high throughput mongodb queue tracking collection. Propose an integration such as a cron job to update our mongodb collection with a request to our backend "/api2". 


<!-- Create a request when submitting an order to 'https://lore-graded.onrender.com/api2/api/submit-order'.
It should trigger when the user submits their selection of up to ten cards.


• user_id: The Authenticated Session / JWT.
	• Where it comes from: You should never trust the client to pass the user_id inside req.body, as this can be easily spoofed. Instead, extract it from your authentication middleware (e.g., req.cookies.token or req.headers.authorization) after validating the user session.
• order_id: The SQL Insert Result.
	• Where it comes from: When you insert the order into your SQL database (using Drizzle or native SQL), the database auto-generates the order's primary key (e.g., a serial integer or a UUID). Your SQL query should return this newly created ID so you can pass it along to MongoDB.
• queue_timestamp: The Server Runtime.
	• Where it comes from: Generate this directly in your Node.js code using new Date() or let MongoDB handle it automatically using a schema default (e.g., Date.now). Do not trust a timestamp sent from the user's device, as client clocks can be out of sync or manipulated.




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
4. Error Handling: Handle standard response statuses (e.g., 200/201 success, 401/403 access denied if the token cookie is missing or invalid, and 400/500 backend errors). Show appropriate UI feedback states (loading, success, error messages). -->

Tell me: is order submission already implemented with data structures in sql? if so, tell me those properties. 
If so, show the best way to sync this data to the alt backend at "/api2" which runs Mongodb.

Post request the mapped payloads to the MongoDB Render Web Service
const mongoResponse = await fetch('/api2/api/sync-users', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ documents: mappedDocuments })
});




// frontend/src/services/syncService.ts

interface SQLUserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

export async function fetchAndSyncData() {
  try {
    // 1. Query raw data from Drizzle SQL via Proxy
    // Note: Use credentials 'include' if your proxy endpoints are protected by HTTP cookies
    const sqlResponse = await fetch('/api/v1/sql/users', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!sqlResponse.ok) throw new Error('Failed to fetch from SQL database');
    const sqlUsers: SQLUserRow[] = await sqlResponse.json();

    if (sqlUsers.length === 0) return { message: "No data to sync" };

    // 2. Map SQL columns into a Document Structure for MongoDB
    const mappedDocuments = sqlUsers.map(user => ({
      metadata: {
        sqlId: user.id,
        source: 'drizzle_migration'
      },
      profile: {
        fullName: `${user.first_name} ${user.last_name}`,
        email: user.email.toLowerCase()
      },
      syncedAt: new Date().toISOString()
    }));

    // 3. Post mapped payloads to the MongoDB Render Web Service
    const mongoResponse = await fetch('/api2/api/sync-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: mappedDocuments })
    });

    if (!mongoResponse.ok) throw new Error('Failed to save to MongoDB microservice');
    
    const status = await mongoResponse.json();
    return { success: true, status };

  } catch (error) {
    console.error('Data pipeline error:', error);
    return { success: false, error };
  }
}





Current MongoDB mapping: name comes from player; serial_number uses the submitted copy’s existing id. That is not a slab certification number. The original SQL creation timestamp is sent in UTC.
Best synchronization approach: retain SQL as the authoritative grading/order system, write an outbox event in the same transaction as each order change, then deliver it server-to-server to /api2. MongoDB should deduplicate by source order/event ID and apply only newer revisions. This avoids the failure gap between two independent database writes. 
Today’s implementation saves SQL first, then performs the requested browser POST and records its reported outcome. It is not full automatic two-way synchronization. The outbox and MongoDB deduplication require backend changes.
Two remaining integration points:
Your exact payload excludes country, service, pricing, and source order ID; those remain in SQL.
Render must permit credentialed CORS and set an appropriate cookie. credentials: 'include' cannot override browser cookie restrictions. A real authenticated MongoDB write has not yet been verified. 
Full schema, mapping, and backend handoff (sandbox:/workspace/scratch/0f30ff1e5f1c/main-site/docs/ORDER-API2-HANDOFF.md?_chatgptios_conversationID=6ac8c825-ce18-83ea-bab0-ef0a320ce8e9&_chatgptios_messageID=47119bfe-065a-5b1d-b006-493d481b8f62)⁠