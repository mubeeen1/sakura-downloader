const axios = require('axios');

async function downloadFacebook(url) {
    const API_URL = `https://api-lite.silvatechinc.my.id/download/fbdown?url=${encodeURIComponent(url)}`;
    
    try {
        const response = await axios.get(API_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 30000
        });
        
        const data = response.data;
        
        if (data.status === true && data.result>3) {
            // Return array format to match other platform responses
            return [{
                type: 'video',
                mediaUrl: data.result.hd || data.result.sd,
                thumbnail: data.result.thumb || data.result.nowm,
                title: data.result.title || 'Facebook Video',
                downloadUrl:data.result.hd || data.result.sd,
            }];
        }
        
        throw new Error("No media URL found");
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error("Facebook video not found or private");
        } else if (error.response && error.response.status === 403) {
            throw new Error("Access denied to Facebook video");
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new Error("Service temporarily unavailable");
        } else {
            throw new Error(`Facebook download failed: ${error.message}`);
        }
    }
}

module.exports = { downloadFacebook };
