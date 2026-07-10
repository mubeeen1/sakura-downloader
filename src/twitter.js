const { twitter } = require('btch-downloader');

async function downloadTwitter(url) {
    try {
        const data = await twitter(url);
        
        // Select the single best quality URL (prioritizing HD, then SD, then first found URL)
        let bestUrl = null;
        if (Array.isArray(data.url)) {
            // 1. Try to find 'hd' quality first in the objects
            for (const item of data.url) {
                if (item && typeof item === 'object' && item.hd && typeof item.hd === 'string' && item.hd.startsWith('http')) {
                    bestUrl = item.hd;
                    break;
                }
            }
            // 2. Try to find 'sd' quality as fallback in the objects
            if (!bestUrl) {
                for (const item of data.url) {
                    if (item && typeof item === 'object' && item.sd && typeof item.sd === 'string' && item.sd.startsWith('http')) {
                        bestUrl = item.sd;
                        break;
                    }
                }
            }
            // 3. Fallback to any string URL or first object property in the array
            if (!bestUrl) {
                for (const item of data.url) {
                    if (typeof item === 'string' && item.startsWith('http')) {
                        bestUrl = item;
                        break;
                    } else if (item && typeof item === 'object') {
                        const val = Object.values(item).find(v => typeof v === 'string' && v.startsWith('http'));
                        if (val) {
                            bestUrl = val;
                            break;
                        }
                    }
                }
            }
        } else if (typeof data.url === 'string' && data.url.startsWith('http')) {
            bestUrl = data.url;
        }

        if (data.status === true && bestUrl) {
            // Return array containing a single best-quality item to match other platform responses
            return [{
                type: 'video',
                mediaUrl: bestUrl,
                thumbnail: bestUrl, // fallback
                title: data.title || 'Twitter Video',
                downloadUrl: bestUrl,
            }];
        }
        
        throw new Error("No media URL found. Twitter video might be private, restricted, or unavailable.");
    } catch (error) {
        throw new Error(`Twitter download failed: ${error.message}`);
    }
}

module.exports = { downloadTwitter };
