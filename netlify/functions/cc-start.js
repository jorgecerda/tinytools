// Netlify Function: cc-start.js
// Creates a CloudConvert job and returns upload details to the client.
// The API key is stored as a Netlify environment variable (CLOUDCONVERT_API_KEY).

exports.handler = async (event) => {
    const allowedOrigins = ['https://tiinytools.netlify.app', 'http://localhost:8888', 'http://localhost:8000'];
    const origin = event.headers.origin || '';
    const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    const corsHeaders = {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers: corsHeaders, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const apiKey = process.env.CLOUDCONVERT_API_KEY;
    if (!apiKey) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'API key not configured on server.' }) };
    }

    let outputFormat;
    try {
        ({ outputFormat } = JSON.parse(event.body));
    } catch {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid request body.' }) };
    }

    const allowed = ['docx', 'pptx', 'xlsx', 'png'];
    if (!allowed.includes(outputFormat)) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: `Unsupported format: ${outputFormat}` }) };
    }

    try {
        const res = await fetch('https://api.cloudconvert.com/v2/jobs', {
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
                tag: 'tiinytools',
            }),
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { statusCode: res.status, headers: corsHeaders, body: JSON.stringify({ error: err.message || 'CloudConvert job creation failed.' }) };
        }

        const data = await res.json();
        const uploadTask = data.data.tasks.find(t => t.name === 'upload-file');

        if (!uploadTask?.result?.form) {
            return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: 'CloudConvert did not return upload details.' }) };
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                jobId: data.data.id,
                uploadUrl: uploadTask.result.form.url,
                uploadParams: uploadTask.result.form.parameters,
            }),
        };
    } catch (err) {
        return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message || 'Internal server error.' }) };
    }
};
