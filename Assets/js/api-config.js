(() => {
    const root = typeof window !== 'undefined' ? window : globalThis;
    const LOCAL_API_BASE = 'http://localhost:8080/reservation';
    const PRODUCTION_API_BASE = 'http://99.79.51.142:8080/reservation';

    const hostname = String(root?.location?.hostname || '').toLowerCase();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (!root.API_BASE_URL) {
        root.API_BASE_URL = isLocalhost ? LOCAL_API_BASE : PRODUCTION_API_BASE;
    }

    root.getApiBaseUrl = () => root.API_BASE_URL;
})();
