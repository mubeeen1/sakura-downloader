const { igdl } = require("btch-downloader");

function deduplicateInstagramUrls(urls) {
    if (!urls || urls.length === 0) return urls;
    
    const totalUrls = urls.length;
    const imageCount = Math.sqrt(totalUrls);
    
    // Only proceed if we have a perfect square pattern (n² URLs)
    if (!Number.isInteger(imageCount)) {
        return urls;
    }
    
    // Select URLs at indices: 0, n, 2n, 3n... (n-1)n
    const selectedUrls = [];
    for (let i = 0; i < totalUrls; i += imageCount) {
        if (urls[i]) {
            selectedUrls.push(urls[i]);
        }
    }
    
    return selectedUrls;
}

// Update download function
async function downloadInstagram(url) {
    try {
        const data = await igdl(url);
        if (data.result && data.result.length > 0) {
            // Deduplicate URLs
            const uniqueUrls = deduplicateInstagramUrls(data.result);
            return uniqueUrls.map((item, index) => ({
                mediaUrl: item.url,
                title: `instagram_media_${index + 1}`,
                thumbnail: item.thumbnail || item.url,
                downloadUrl: item.url,
                type: item.type || 'media'
            }));
        }
        throw new Error("No media URL found");
    } catch (error) {
        throw new Error(`Instagram download failed: ${error.message}`);
    }
}

module.exports = { downloadInstagram };
