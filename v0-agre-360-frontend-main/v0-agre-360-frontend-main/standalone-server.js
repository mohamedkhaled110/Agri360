const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const NEXT_BUILD_DIR = path.join(__dirname, ".next/standalone");

// Try to require the Next.js standalone server
let nextServer;
try {
  nextServer = require(path.join(NEXT_BUILD_DIR, "server.js"));
  console.log("✅ Using Next.js standalone server");
} catch (err) {
  console.log("⚠️ Standalone server not found, using basic HTTP server");
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Log request
  console.log(`${req.method} ${req.url}`);

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // Serve static files from public directory
  if (req.url.startsWith("/public/")) {
    const filePath = path.join(__dirname, "public", req.url.slice(8));
    if (fs.existsSync(filePath)) {
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  // Proxy API requests to backend
  if (req.url.startsWith("/api/")) {
    const proxyReq = http.request(
      {
        hostname: "localhost",
        port: 5000,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: "localhost:5000",
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on("error", (err) => {
      console.error("Proxy error:", err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: "Backend unavailable" }));
    });

    req.pipe(proxyReq);
    return;
  }

  // For all other requests, serve a simple HTML file pointing to the app
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Agri360</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script>
        window.location.href = '/dashboard';
      </script>
    </head>
    <body>
      <p>Redirecting to dashboard...</p>
    </body>
    </html>
  `);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`✅ Backend API proxied from http://localhost:5000`);
  console.log(`✅ Navigate to http://localhost:${PORT}/dashboard/marketplace`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
});
