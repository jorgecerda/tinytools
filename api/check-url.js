// Vercel Serverless Function: api/check-url.js
// Proxies HTTP requests to check URL status codes and track redirect chains.
// Bypasses browser CORS restrictions securely.

export default async function handler(req, res) {
    const allowedOrigins = [
        'https://tinytools.netlify.app',
        'https://tinytools.vercel.app',
        'http://localhost:8888',
        'http://localhost:3000',
        'http://localhost:8000'
    ];
    const origin = req.headers.origin || '';
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // req.body is automatically parsed as JSON by Vercel
    const body = req.body || {};
    const url = body.url;
    const followRedirects = body.followRedirects !== false;
    const method = (body.method || 'GET').toUpperCase();
    const userAgent = body.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 tinytools/1.0';

    if (!url) {
        return res.status(400).json({ error: 'Missing parameter: url' });
    }

    // Standardize URL protocol
    let currentUrl = url.trim();
    if (!/^https?:\/\//i.test(currentUrl)) {
        currentUrl = 'http://' + currentUrl;
    }

    const chain = [];
    const visited = new Set();
    const maxHops = 10;
    let hopCount = 0;
    let redirected = false;

    const requestHeaders = {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    };

    while (currentUrl && hopCount < maxHops) {
        hopCount++;
        if (visited.has(currentUrl)) {
            chain.push({
                url: currentUrl,
                status: 0,
                statusText: 'Redirect Loop Detected',
                responseTime: 0,
                headers: {},
                error: true
            });
            break;
        }

        visited.add(currentUrl);
        const start = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        try {
            const fetchRes = await fetch(currentUrl, {
                method: method,
                headers: requestHeaders,
                redirect: 'manual', // Do not automatically follow redirect in Node environment
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const responseTime = Date.now() - start;

            // Extract response headers
            const resHeaders = {};
            const headersToKeep = ['location', 'server', 'content-type', 'cache-control', 'x-redirect-by', 'content-length', 'content-security-policy', 'content-security-policy-report-only'];
            headersToKeep.forEach(h => {
                const val = fetchRes.headers.get(h);
                if (val) resHeaders[h] = val;
            });

            const status = fetchRes.status;
            const statusText = fetchRes.statusText || getStatusTextFallback(status);

            chain.push({
                url: currentUrl,
                status,
                statusText,
                responseTime,
                headers: resHeaders
            });

            // Check if redirect response (3xx status and location header present)
            const isRedirect = [301, 302, 303, 307, 308].includes(status);
            const location = resHeaders['location'];

            if (isRedirect && location) {
                redirected = true;
                if (!followRedirects) {
                    break; // stop here if client requested no redirect following
                }
                // Resolve next URL relative to current URL
                currentUrl = new URL(location, currentUrl).href;
            } else {
                break; // Not a redirect or missing location, we reached the end
            }

        } catch (err) {
            clearTimeout(timeoutId);
            const responseTime = Date.now() - start;
            let errMsg = err.message || 'Unknown network error';
            if (err.name === 'AbortError') {
                errMsg = 'Request Timeout (exceeded 5s)';
            }
            chain.push({
                url: currentUrl,
                status: 0,
                statusText: errMsg,
                responseTime,
                headers: {},
                error: true
            });
            break;
        }
    }

    if (hopCount >= maxHops) {
        chain.push({
            url: currentUrl,
            status: 0,
            statusText: 'Max redirect limit exceeded (> 10 hops)',
            responseTime: 0,
            headers: {},
            error: true
        });
    }

    return res.status(200).json({
        url,
        redirected,
        hopCount: chain.length,
        chain
    });
}

// Simple fallback helper for common HTTP statuses
function getStatusTextFallback(status) {
    const statuses = {
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        204: 'No Content',
        300: 'Multiple Choices',
        301: 'Moved Permanently',
        302: 'Found',
        303: 'See Other',
        304: 'Not Modified',
        307: 'Temporary Redirect',
        308: 'Permanent Redirect',
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        408: 'Request Timeout',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout'
    };
    return statuses[status] || 'Unknown';
}
