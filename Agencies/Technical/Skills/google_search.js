/**
 * CyCOS Skill: Google Search
 * Role: The Researcher (Knowledge)
 * 
 * Uses Google Custom Search API for grounded web retrieval.
 */

const { google } = require('googleapis');
const customsearch = google.customsearch('v1');

const API_KEY = process.env.GOOGLE_SEARCH_API_KEY || "";
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ID || "";

/**
 * Performs a web search and returns snippets.
 * @param {string} query - The search query.
 * @param {number} num - Number of results (default 5).
 */
async function searchWeb(query, num = 5) {
    try {
        if (!API_KEY || !SEARCH_ENGINE_ID) {
            throw new Error("Missing GOOGLE_SEARCH_API_KEY or GOOGLE_SEARCH_ID.");
        }

        const res = await customsearch.cse.list({
            cx: SEARCH_ENGINE_ID,
            q: query,
            auth: API_KEY,
            num: num
        });

        if (!res.data.items) return "No results found.";

        return res.data.items.map(item => ({
            title: item.title,
            link: item.link,
            snippet: item.snippet
        }));
    } catch (error) {
        return `Error performing search: ${error.message}`;
    }
}

// Self-test block
if (require.main === module) {
    const query = process.argv[2] || "Latest CyCOS Operating System updates";
    searchWeb(query).then(results => console.log(JSON.stringify(results, null, 2))).catch(console.error);
}

module.exports = { searchWeb };
