const { pinterest } = require("btch-downloader");

async function downloadPinterest(url) {
  try {
    const data = await pinterest(url);
    let pin = null;
    
    if (data && data.result) {
      pin = data.result;
      if (pin.result) {
        pin = pin.result;
      }
    }
    
    if (pin && (pin.video_url || pin.image)) {
      return [{
        mediaUrl: pin.video_url || pin.image,
        title: pin.title || 'pinterest_media',
        thumbnail: pin.image || pin.video_url || null,
        downloadUrl: pin.video_url || pin.image,
        type: pin.video_url ? 'video' : 'image'
      }];
    }
    throw new Error("No media URL found");
  } catch (error) {
    throw new Error(`Pinterest download failed: ${error.message}`);
  }
}

module.exports = { downloadPinterest };
