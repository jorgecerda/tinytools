// Vercel Serverless Function: api/request-new-tool.js
// Relays new tool request forms to j@crda.dev securely via SMTP2GO API.

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

    const apiKey = process.env.SMTP2GO_API_KEY;
    if (!apiKey) {
        console.error('SMTP2GO_API_KEY environment variable is not configured.');
        return res.status(500).json({ error: 'Server configuration error: SMTP2GO API key missing.' });
    }

    const { description, email } = req.body || {};
    if (!description || description.trim() === '') {
        return res.status(400).json({ error: 'Missing parameter: description' });
    }

    const cleanDescription = description.trim();
    const cleanEmail = email ? email.trim() : '';

    // Construct the email body
    const textBody = `Description of the requested tool:\n${cleanDescription}\n\nContact Email (optional):\n${cleanEmail || 'Not provided'}`;

    // Construct payload for SMTP2GO API v3
    const payload = {
        api_key: apiKey,
        sender: 'request-tool@crda.dev',
        to: ['j@crda.dev'],
        subject: 'tinytools - new tool request',
        text_body: textBody
    };

    // If requester email was provided, add it as a Reply-To custom header
    if (cleanEmail) {
        payload.custom_headers = [
            {
                header: 'Reply-To',
                value: cleanEmail
            }
        ];
    }

    try {
        const response = await fetch('https://api.smtp2go.com/v3/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        let responseData = null;
        try {
            responseData = await response.json();
        } catch {
            // Non-JSON response
        }

        if (!response.ok) {
            console.error('SMTP2GO request failed:', responseData || response.statusText);
            return res.status(500).json({ error: responseData?.data?.error || 'Failed to dispatch email via SMTP2GO.' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('SMTP2GO relay error:', error);
        return res.status(500).json({ error: 'Internal server error executing email dispatch.' });
    }
}
