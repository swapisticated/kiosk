import axios from "axios";

// ============================================
// SCRAPER HTTP CLIENT
// ============================================
// Configured axios instance for web scraping
// with logging, timeouts, and proper headers

export const scraperClient = axios.create({
  timeout: 15000, // 15 seconds - prevents hanging on slow sites
  headers: {
    // Mimic a real browser to avoid bot detection
    "User-Agent":
      "Mozilla/5.0 (compatible; KioskBot/1.0; +https://kiosk.io/bot)",
    // Tell server we accept HTML
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    // Prefer English content
    "Accept-Language": "en-US,en;q=0.9",
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================
// Runs BEFORE every request is sent

scraperClient.interceptors.request.use(
  (config) => {
    // Log what we're about to fetch
    console.log(`[Scraper]  Fetching: ${config.url}`);
    return config; // Must return config to continue
  },
  (error) => {
    // Runs if request setup fails (rare - usually a code bug)
    console.error(`[Scraper]  Request setup failed:`, error.message);
    return Promise.reject(error); // Must reject to propagate error
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================
// Runs AFTER response is received

scraperClient.interceptors.response.use(
  (response) => {
    // Success path (2xx status codes)
    const size = response.data?.length || 0;
    const sizeKB = (size / 1024).toFixed(1);
    console.log(
      `[Scraper] ${response.status} from ${response.config.url} (${sizeKB} KB)`
    );
    return response; // Must return response
  },
  (error) => {
    // Error path (4xx, 5xx, or network errors)

    if (error.response) {
      // Server responded with error status (4xx, 5xx)
      const status = error.response.status;
      const url = error.config?.url;
      console.error(`[Scraper]  HTTP ${status} from ${url}`);

      // Log specific error types
      if (status === 404) {
        console.error(`[Scraper]    Page not found`);
      } else if (status === 403 || status === 401) {
        console.error(`[Scraper]    Access denied (might be blocked)`);
      } else if (status >= 500) {
        console.error(`[Scraper]    Server error`);
      }
    } else if (error.code === "ECONNABORTED") {
      // Timeout (took longer than 15s)
      console.error(`[Scraper]  Timeout: ${error.config?.url}`);
    } else if (error.code === "ENOTFOUND") {
      // DNS resolution failed (domain doesn't exist)
      console.error(`[Scraper]  Domain not found: ${error.config?.url}`);
    } else {
      // Other network errors (no internet, firewall, etc.)
      console.error(`[Scraper]  Network error: ${error.message}`);
    }

    return Promise.reject(error); // Must reject to propagate error
  }
);
