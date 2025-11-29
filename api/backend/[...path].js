const { Readable } = require('stream');

const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
    'host',
    'content-length'
]);

async function handler(req, res) {
    const backendBase = process.env.BACKEND_BASE_URL;
    if (!backendBase) {
        res.status(500).json({ error: 'BACKEND_BASE_URL not configured' });
        return;
    }

    const queryPath = req.query.path;
    const path = Array.isArray(queryPath) ? queryPath.join('/') : (queryPath || '');
    const queryIndex = req.url.indexOf('?');
    const search = queryIndex >= 0 ? req.url.slice(queryIndex) : '';

    const normalizedBase = backendBase.endsWith('/') ? backendBase.slice(0, -1) : backendBase;
    const normalizedPath = path ? `/${path}` : '';
    const targetUrl = `${normalizedBase}${normalizedPath}${search}`;

    const headers = { ...req.headers };
    Object.keys(headers).forEach((name) => {
        if (HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
            delete headers[name];
        }
    });

    const method = (req.method || 'GET').toUpperCase();
    const init = {
        method,
        headers,
        redirect: 'manual'
    };

    if (method !== 'GET' && method !== 'HEAD') {
        init.body = req;
    }

    let backendResponse;
    try {
        backendResponse = await fetch(targetUrl, init);
    } catch (error) {
        res.status(502).json({ error: 'Failed to reach backend', details: error.message });
        return;
    }

    res.status(backendResponse.status);
    backendResponse.headers.forEach((value, name) => {
        const lower = name.toLowerCase();
        if (lower === 'content-length' || lower === 'content-encoding') {
            return;
        }
        res.setHeader(name, value);
    });

    if (backendResponse.body) {
        const stream = typeof backendResponse.body.pipe === 'function'
            ? backendResponse.body
            : (Readable.fromWeb ? Readable.fromWeb(backendResponse.body) : null);
        if (stream) {
            stream.pipe(res);
            return;
        }
    }

    const buffer = Buffer.from(await backendResponse.arrayBuffer());
    res.send(buffer);
}

module.exports = handler;
module.exports.config = {
    api: {
        bodyParser: false
    }
};
