// Vercel Serverless Function: api/cc-status.js
// Polls a CloudConvert job by ID and returns its status + download URL.

export default async function handler(req, res) {
    const allowedOrigins = [
        'https://tt.crda.dev',
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

    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    const body = req.body || {};
    const jobId = body.jobId;

    if (!jobId) {
        return res.status(400).json({ error: 'Missing parameter: jobId' });
    }

    try {
        const fetchRes = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobId}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });

        if (!fetchRes.ok) {
            return res.status(fetchRes.status).json({ error: `CloudConvert status check failed (${fetchRes.status}).` });
        }

        const data = await fetchRes.json();
        const tasks = data.data.tasks;
        const status = data.data.status;

        if (status === 'finished') {
            const exportTask = tasks.find(t => t.name === 'export-file');
            const downloadUrl = exportTask?.result?.files?.[0]?.url || null;
            return res.status(200).json({ status: 'finished', downloadUrl });
        }

        if (status === 'error') {
            const errTask = tasks.find(t => t.status === 'error');
            return res.status(200).json({ status: 'error', message: errTask?.message || 'Conversion failed on CloudConvert.' });
        }

        return res.status(200).json({ status });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Internal server error.' });
    }
}
