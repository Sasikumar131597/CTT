const BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!BASE_URL) {
  console.error(" VITE_API_BASE_URL is not set in your .env file!");
}

const TOKEN_URL = `${BASE_URL}/guest-token`;
const JWT_TOKEN_KEY = "jwt_token";

const DEFAULT_TOKEN_TIMEOUT_MS = 15000;
const DEFAULT_REQUEST_TIMEOUT_MS = 25000;

// Prevent multiple parallel requests from "stamping" the guest-token endpoint.
let tokenFetchPromise = null;

// ─── Internal token helpers ───────────────────────────────────────────────────

const fetchGuestToken = async (timeoutMs = DEFAULT_TOKEN_TIMEOUT_MS) => {
  console.log(" Fetching guest token from:", TOKEN_URL);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(TOKEN_URL, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Token fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log(" Token response:", data);

    if (data.token) {
      localStorage.setItem(JWT_TOKEN_KEY, data.token);
      return data.token;
    }
    throw new Error("No token in response: " + JSON.stringify(data));
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(`Guest token fetch timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

const getToken = async () => {
  const cached = localStorage.getItem(JWT_TOKEN_KEY);
  if (cached) return cached;

  if (tokenFetchPromise) return tokenFetchPromise;
  tokenFetchPromise = fetchGuestToken().finally(() => {
    tokenFetchPromise = null;
  });
  return tokenFetchPromise;
};

// ─── Authenticated fetch wrapper ─────────────────────────────────────────────

const authFetch = async (url, options = {}, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) => {
  if (!BASE_URL) throw new Error("VITE_API_BASE_URL is not configured");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let token = await getToken();
    console.log(" Fetching:", url);

    const makeRequest = (t) =>
      fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${t}`,
          ...(options.headers || {}),
        },
      });

    let res = await makeRequest(token);

    // Token expired → clear cache, refresh once, retry
    if (res.status === 401) {
      console.warn(" Token expired, refreshing...");
      localStorage.removeItem(JWT_TOKEN_KEY);
      token = await fetchGuestToken();
      res = await makeRequest(token);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`API ${res.status}: ${body}`);
    }

    return res.json();
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(`API request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

export const api = {
  getSubTechnologies: () =>
    authFetch(`${BASE_URL}/api/get_sub_techlogies`),

  getGlobalPublicationCount: (subTechId) =>
    authFetch(`${BASE_URL}/api/get_global_publication_count/${encodeURIComponent(subTechId)}`),

  getGlobalPatentCount: (subTechId) =>
    authFetch(`${BASE_URL}/api/get_global_patent_count/${encodeURIComponent(subTechId)}`),

  getCountryPublicationCount: (subTechId, countryId) =>
    authFetch(
      `${BASE_URL}/api/get-country-publication-count/${encodeURIComponent(subTechId)}/${encodeURIComponent(countryId)}`
    ),

  getCountryPatentCount: (subTechId, countryId) =>
    authFetch(
      `${BASE_URL}/api/get-country-patent-count/${encodeURIComponent(subTechId)}/${encodeURIComponent(countryId)}`
    ),

  getSelectedCountries: () => authFetch(`${BASE_URL}/api/selected_countries`),

  getGlobalPublicationCountryRankMultiline: (subTechId) =>
    authFetch(
      `${BASE_URL}/api/get-global-publication-country-rank-multiline/${encodeURIComponent(subTechId)}`
    ),

  getGlobalPatentCountryRankMultiline: (subTechId) =>
    authFetch(
      `${BASE_URL}/api/get-global-patent-country-rank-multiline/${encodeURIComponent(subTechId)}`
    ),

  getGlobalPublicationCountryRank: (subTechId) =>
    authFetch(
      `${BASE_URL}/api/get-global-publication-country-rank/${encodeURIComponent(subTechId)}`
    ),

  getPublicationTrendlineCountry: (subTechId, countryId) =>
    authFetch(
      `${BASE_URL}/api/get-publication-trendline-country/${encodeURIComponent(subTechId)}/${encodeURIComponent(countryId)}`
    ),

  getPublicationInternationalCollaboration: (subTechId, countryId) =>
    authFetch(
      `${BASE_URL}/api/publication-international-collaboration/${encodeURIComponent(subTechId)}/${encodeURIComponent(countryId)}`
    ),

  getPatentTrendlineCountry: (subTechId, countryId) =>
    authFetch(
      `${BASE_URL}/api/get-patent-trendline-country/${encodeURIComponent(subTechId)}/${encodeURIComponent(countryId)}`
    ),

  getGlobalPatentsCountryRank: (subTechId) =>
    authFetch(
      `${BASE_URL}/api/get-global-patents-country-rank/${encodeURIComponent(subTechId)}`
    ),
};