#!/usr/bin/env node
const http = require("http");
const net = require("net");

const PORT = 3000;
const BACKEND_HOST = "localhost";
const BACKEND_PORT = 5000;

// Simple proxy function
function proxyRequest(clientReq, clientRes, targetHost, targetPort) {
  const options = {
    hostname: targetHost,
    port: targetPort,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes);
  });

  proxyReq.on("error", (err) => {
    console.error("Proxy error:", err.message);
    clientRes.writeHead(502, { "Content-Type": "application/json" });
    clientRes.end(
      JSON.stringify({ error: "Backend unavailable", details: err.message })
    );
  });

  clientReq.pipe(proxyReq);
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Log all requests
  console.log(`${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS, PATCH"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle OPTIONS requests
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Proxy API requests to backend
  if (req.url.startsWith("/api/")) {
    proxyRequest(req, res, BACKEND_HOST, BACKEND_PORT);
    return;
  }

  // Default response
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Agri360 API Proxy Server</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌿 Agri360 API Proxy Server</h1>
        <div class="status success">✅ Server is running on port ${PORT}</div>
        <div class="status info">ℹ️ Backend API available at http://localhost:${BACKEND_PORT}</div>
        <div class="status info">📡 Proxy all /api/* requests to backend</div>
        <hr>
        <h2>Available API Endpoints:</h2>
        <ul>
          <li><code>GET/POST /api/auth/*</code> - Authentication</li>
          <li><code>GET/POST /api/users/*</code> - User management</li>
          <li><code>GET/POST /api/farms/*</code> - Farm management</li>
          <li><code>GET/POST /api/market/listings</code> - Marketplace listings</li>
          <li><code>GET /api/dashboard</code> - Dashboard stats</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Handle errors
server.on("error", (err) => {
  console.error("Server error:", err);
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  }
});

// Start server
server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("════════════════════════════════════════════════");
  console.log("✅ Agri360 API Proxy Server Started");
  console.log("════════════════════════════════════════════════");
  console.log(`🌐 Frontend Server: http://localhost:${PORT}`);
  console.log(`🔗 Backend API:     http://localhost:${BACKEND_PORT}`);
  console.log(
    `📡 API Proxy:       /api/* → http://localhost:${BACKEND_PORT}/api/*`
  );
  console.log("════════════════════════════════════════════════");
  console.log("");
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  server.close();
  process.exit(0);
});
