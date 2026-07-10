const { fbdown } = require('btch-downloader');

async function downloadFacebook(url) {
    try {
        const data = await fbdown(url);
        
        if (data.status === true && (data.HD || data.Normal_video)) {
            // Return array format to match other platform responses
            return [{
                type: 'video',
                mediaUrl: data.HD || data.Normal_video,
                thumbnail: data.Normal_video || data.HD || null,
                title: 'Facebook Video',
                downloadUrl: data.HD || data.Normal_video,
            }];
        }
        
        throw new Error(data.message || "No media URL found");
    } catch (error) {
        throw new Error(`Facebook download failed: ${error.message}`);
    }
}

module.exports = { downloadFacebook };
