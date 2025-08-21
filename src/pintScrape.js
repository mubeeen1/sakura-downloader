const axios = require('axios');

// RapidAPI configuration
const RAPID_API_KEY = '53821225a5msh90334724075b02cp156e22jsn4c744101b830';
const RAPID_API_HOST = 'pinterest-video-and-image-downloader.p.rapidapi.com';

async function downloadPinterestVideo(url) {
    const options = {
        method: 'GET',
        url: `https://${RAPID_API_HOST}/pinterest`,
        params: { url: url },
        headers: {
            'x-rapidapi-key': RAPID_API_KEY,
            'x-rapidapi-host': RAPID_API_HOST
        },
        timeout: 15000 // 15 second timeout
    };

    try {
        const response = await axios.request(options);
        const data = response.data;
        
        if (data.success && data.type === 'video') {
            return [{
                mediaUrl: data.data.url,
                title: 'Pinterest Video',
                thumbnail: data.data.thumbnail,
                downloadUrl: data.data.url,
                type: 'video',
                width: data.data.width,
                height: data.data.height,
                duration: data.data.duration,
                quality: 'original'
            }];
        } else {
            throw new Error('Failed to fetch video from API');
        }
    } catch (error) {
        console.error('RapidAPI Error:', error.message);
        
        // Handle timeout specifically
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            throw new Error('Request timeout - please try again');
        }
        
        throw new Error(`API request failed: ${error.message}`);
    }
}

module.exports = { downloadPinterestVideo };
