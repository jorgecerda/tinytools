// Vercel Serverless Function: api/cc-start.js
// Creates a CloudConvert job and returns upload details to the client.

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

    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server.' });
    }

    const body = req.body || {};
    const outputFormat = body.outputFormat;

    const allowed = ['docx', 'pptx', 'xlsx', 'png'];
    if (!allowed.includes(outputFormat)) {
        return res.status(400).json({ error: `Unsupported format: ${outputFormat}` });
    }

    try {
        const fetchRes = await fetch('https://api.cloudconvert.com/v2/jobs', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tasks: {
                    'upload-file':  { operation: 'import/upload' },
                    'convert-file': {
                        operation: 'convert',
                        input: 'upload-file',
                        input_format: 'pdf',
                        output_format: outputFormat,
                    },
                    'export-file': {
                        operation: 'export/url',
                        input: 'convert-file',
                        inline: false,
                        archive_multiple_files: false,
                    },
                },
                tag: 'tinytools',
            }),
        });

        if (!fetchRes.ok) {
            const err = await fetchRes.json().catch(() => ({}));
            return res.status(fetchRes.status).json({ error: err.message || 'CloudConvert job creation failed.' });
        }

        const data = await fetchRes.json();
        const uploadTask = data.data.tasks.find(t => t.name === 'upload-file');

        if (!uploadTask?.result?.form) {
            return res.status(500).json({ error: 'CloudConvert did not return upload details.' });
        }

        return res.status(200).json({
            jobId: data.data.id,
            uploadUrl: uploadTask.result.form.url,
            uploadParams: uploadTask.result.form.parameters,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message || 'Internal server error.' });
    }
}
