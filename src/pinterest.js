const { pinterest } = require("btch-downloader");

async function downloadPinterest(url) {
  try {
    const data = await pinterest(url);
    if (data.result) {
      const pin = data.result;
      return [{
        mediaUrl: pin.video_url || pin.image || null,
        title: pin.title || 'pinterest_media',
        thumbnail: pin.image || pin.video_url || null,
        downloadUrl: pin.video_url || pin.image || null,
        type: pin.video_url ? 'video' : 'image'
      }];
    }
    throw new Error("No media URL found");
  } catch (error) {
    throw new Error(`Pinterest download failed: ${error.message}`);
  }
}

module.exports = { downloadPinterest };
