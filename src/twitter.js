const axios = require('axios');

async function downloadTwitter(url) {
    const API_URL = `https://api-lite.silvatechinc.my.id/download/twitter?url=${encodeURIComponent(url)}`;
    
    try {
        const response = await axios.get(API_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 30000
        });
        
        const data = response.data;
        
        if (data.status === true && data.result.video_hd||data.result.video_sd) {
            // Return array format to match other platform responses
            return [{
                type: 'video',
                mediaUrl: data.result.video_hd || data.result.video_sd,
                thumbnail: data.result.thumb || data.result.nowm,
                title: data.result.desc || 'Twitter Video',
                downloadUrl:data.result.video_hd || data.result.video_sd,
            }];
        }
        
        throw new Error("No media URL found");
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error("Twitter video not found or private");
        } else if (error.response && error.response.status === 403) {
            throw new Error("Access denied to Twitter video");
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new Error("Service temporarily unavailable");
        } else {
            throw new Error(`Twitter download failed: ${error.message}`);
        }
    }
}

module.exports = { downloadTwitter };
