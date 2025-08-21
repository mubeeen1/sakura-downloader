const axios = require('axios');

async function downloadTikTok(url) {
    const API_URL = `https://api-lite.silvatechinc.my.id/download/tiktokdl?url=${encodeURIComponent(url)}`;
    
    try {
        const response = await axios.get(API_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 30000
        });
        
        const data = response.data;
        
        if (data.status === true && data.result) {
            // Return array format to match other platform responses
            return [{
                type: 'video',
                mediaUrl: data.result.nowm,
                thumbnail: data.result.nowm,
                title: data.result.title || 'TikTok Video',
                downloadUrl:data.result.nowm,
            }];
        }
        
        throw new Error("No media URL found");
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error("TikTok video not found or private");
        } else if (error.response && error.response.status === 403) {
            throw new Error("Access denied to TikTok video");
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new Error("Service temporarily unavailable");
        } else {
            throw new Error(`TikTok download failed: ${error.message}`);
        }
    }
}

module.exports = { downloadTikTok };
