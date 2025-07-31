const express = require("express");
const bodyParser = require("body-parser");
const {igdl, youtube, ttdl, pinterest, twitter, fbdown , gdrive, capcut, mediafire} = require("btch-downloader");
const app = express();

const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json()); // For API requests
app.use(bodyParser.urlencoded({ extended: true })); // For form submissions
app.set('view engine', 'ejs');

app.get("/", (req, res) => {
  res.render('main');
});

// New error route to render error.ejs with dynamic error message
app.get("/error", (req, res) => {
  const errorMessage = req.query.message || "An unknown error occurred.";
  res.status(500).render('error', { errorMessage });
});

// Supported platforms and their corresponding functions from btch-downloader
const platformFunctions = {
  tiktok: ttdl,
  youtube: youtube,
  facebook: fbdown,
  instagram: igdl,
  twitter: twitter,
  capcut: capcut,
  pinterest: pinterest,
  gdrive: gdrive,
  mediafire: mediafire,
  spotify: null // No function imported for spotify, handle accordingly
};

app.get("/:platform", async (req, res) => {
  const platform = req.params.platform.toLowerCase();

  if (!platformFunctions.hasOwnProperty(platform)) {
    return res.redirect(`/error?message=${encodeURIComponent("Platform not supported")}`);
  }

  // Render the platform page with dynamic h1
  res.render("platform", { platform });
});

// Required modules
const chalk = require('chalk').default;
const mime = require('mime-types');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const tmpDir = path.join(__dirname, 'tmp');

// Ensure tmp directory exists
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir);
}

// Helper function to download a file from url and save to filepath
async function downloadFile(fileUrl, filepath) {
  console.log(chalk.blue(`[INFO] Downloading file from URL: ${fileUrl} to path: ${filepath}`));
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url: fileUrl,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log(chalk.green(`[INFO] Finished downloading file to: ${filepath}`));
      resolve();
    });
    writer.on('error', (err) => {
      console.error(chalk.red(`[ERROR] Error writing file to: ${filepath}`), err);
      reject(err);
    });
  });
}

async function sanitizeFilename(title, mediaUrl) {
  const timestamp = Date.now();
  let safeTitle = title ? title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : timestamp.toString();

  // Limit filename length to 50 characters to avoid ENAMETOOLONG errors
  const maxLength = 50;
  if (safeTitle.length > maxLength) {
    safeTitle = safeTitle.substring(0, maxLength);
  }

  // Extract extension from mediaUrl without query parameters
  let ext = '';
  try {
    const urlObj = new URL(mediaUrl);
    ext = path.extname(urlObj.pathname);
    // Validate extension with mime-types
    if (!mime.extensions.includes(ext.replace('.', ''))) {
      ext = '';
    }
    if (!ext) {
      // Perform HEAD request to get content-type
      const headResp = await axios.head(mediaUrl);
      const contentType = headResp.headers['content-type'];
      if (contentType) {
        ext = '.' + mime.extension(contentType);
      }
    }
  } catch (e) {
    ext = '';
  }

  // Additional check to avoid .html extension for media files
  if (ext === '.html' || ext === '.htm') {
    try {
      const headResp = await axios.head(mediaUrl);
      const contentType = headResp.headers['content-type'];
      if (contentType) {
        if (contentType.startsWith('video/')) {
          ext = '.mp4';
        } else if (contentType.startsWith('audio/')) {
          ext = '.mp3';
        } else if (contentType.startsWith('image/')) {
          ext = '.jpg';
        } else {
          ext = '';
        }
      }
    } catch (e) {
      ext = '';
    }
  }

  // If no valid extension, default to .mp4 or .jpg based on content type
  if (!ext) {
    if (mediaUrl) {
      try {
        const headResp = await axios.head(mediaUrl);
        const contentType = headResp.headers['content-type'];
        if (contentType && contentType.startsWith('image/')) {
          ext = '.jpg';
        } else {
          ext = '.mp4';
        }
      } catch (e) {
        ext = '.mp4';
      }
    } else {
      ext = '.mp4';
    }
  }

  return safeTitle + ext;
}

app.post("/:platform/download", async (req, res) => {
  const platform = req.params.platform.toLowerCase();
  const url = req.body.url;

  if (!platformFunctions.hasOwnProperty(platform)) {
    return res.status(404).render('error', { errorMessage: "Platform not supported" });
  }

  if (!url) {
    return res.redirect(`/error?message=${encodeURIComponent("URL missing")}`);
  }

  const downloadFunction = platformFunctions[platform];

  if (!downloadFunction) {
    return res.redirect(`/error?message=${encodeURIComponent(`Download functionality for ${platform} is not implemented.`)}`);
  }

  try {
    console.log(chalk.blue(`[INFO] Starting download for platform: ${platform}, URL: ${url}`));
    const data = await downloadFunction(url);
    console.log(chalk.blue('[INFO] Download function returned data:'), data);

    let mediaUrl = null;
    let thumbnailUrl = null;
    let title = null;
    let description = null;

    switch(platform) {
      case 'instagram':
        if (data.result && data.result.length > 0) {
          mediaUrl = data.result[0].url;
          thumbnailUrl = data.result[0].thumbnail;
          title = 'instagram_media';
        }
        break;
      case 'tiktok':
        mediaUrl = data.video && data.video.length > 0 ? data.video[0] : null;
        thumbnailUrl = data.thumbnail || null;
        title = data.title || 'tiktok_media';
        break;
      case 'twitter':
        mediaUrl = data.url || null;
        thumbnailUrl = null;
        title = data.title || 'twitter_media';
        break;
      case 'youtube':
        mediaUrl = data.mp4 || data.mp3 || null;
        thumbnailUrl = data.thumbnail || null;
        title = data.title || 'youtube_media';
        break;
      case 'facebook':
        mediaUrl = data.HD || data.Normal_video || null;
        thumbnailUrl = null;
        title = 'facebook_media';
        break;
      case 'mediafire':
        if (data.result && data.result.url) {
          mediaUrl = data.result.url;
          thumbnailUrl = null;
          title = data.result.filename || 'mediafire_media';
        }
        break;
      case 'capcut':
        mediaUrl = data.url || (data.data && data.data.contentUrl) || null;
        thumbnailUrl = (data.data && data.data.thumbnailUrl && data.data.thumbnailUrl[0]) || null;
        title = (data.data && data.data.name) || 'capcut_media';
        description = data.data && data.data.description || null;
        break;
      case 'gdrive':
        if (data.result) {
          mediaUrl = data.result.downloadUrl || null;
          thumbnailUrl = null;
          title = data.result.filename || 'gdrive_media';
        }
        break;
      case 'pinterest':
        if (data.result) {
          const pin = data.result;
          mediaUrl = pin.video_url || pin.image || null;
          thumbnailUrl = pin.image; // Do not download thumbnail as per user request
          title = pin.title || 'pinterest_media';
          description = pin.description || null;
        }
        break;
      default:
        mediaUrl = null;
        thumbnailUrl = null;
        title = null;
    }

      if (!mediaUrl) {
        console.error(chalk.red(`[ERROR] No media URL found in the download data for platform: ${platform}`));
        return res.redirect(`/error?message=${encodeURIComponent("No media URL found in the download data.")}`);
      }

    console.log(chalk.blue(`[INFO] Extracted media URL: ${mediaUrl}`));
    console.log(chalk.blue(`[INFO] Extracted thumbnail URL: ${thumbnailUrl}`));
    console.log(chalk.blue(`[INFO] Extracted title: ${title}`));

    const safeMediaFilename = await sanitizeFilename(title, mediaUrl);
    const mediaFilePath = path.join(tmpDir, safeMediaFilename);

    await downloadFile(mediaUrl, mediaFilePath);

    let thumbnailFilename = null;
    let thumbnailFilePath = null;
    if (thumbnailUrl) {
      const thumbExt = path.extname(thumbnailUrl.split('?')[0]) || '.jpg';
      thumbnailFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_thumb' + thumbExt;
      thumbnailFilePath = path.join(tmpDir, thumbnailFilename);
      await downloadFile(thumbnailUrl, thumbnailFilePath);
    } else {
      thumbnailFilename = 'black_placeholder.png';
      thumbnailFilePath = path.join(tmpDir, thumbnailFilename);
      if (!fs.existsSync(thumbnailFilePath)) {
        // Use a static black image file as placeholder instead of canvas
        const blackPlaceholderPath = path.join(__dirname, 'public', 'images', 'black_placeholder.png');
        if (fs.existsSync(blackPlaceholderPath)) {
          fs.copyFileSync(blackPlaceholderPath, thumbnailFilePath);
        } else {
          // If static file not found, create an empty file as fallback
          fs.writeFileSync(thumbnailFilePath, '');
        }
      }
    }

    console.log(chalk.green(`[INFO] Sending response with media file: /tmp/${safeMediaFilename} and thumbnail file: /tmp/${thumbnailFilename}`));
    res.status(200).json({
      message: 'Media and thumbnail downloaded',
      mediaFile: '/tmp/' + safeMediaFilename,
      thumbnailFile: '/tmp/' + thumbnailFilename,
      title: title,
      description: description
    });

  } catch (error) {
    console.error(chalk.red(`[ERROR] Error downloading from ${platform} with URL ${url}:`), error);
    res.redirect(`/error?message=${encodeURIComponent(error.message || "Error processing download request.")}`);
  }
});

// Serve files from tmp folder
app.use('/tmp', express.static(tmpDir));

// Route to clear tmp folder (optional, can be called after download)
app.post('/clear-tmp', (req, res) => {
  fs.readdir(tmpDir, (err, files) => {
    if (err) {
      console.error(chalk.red('Error clearing tmp folder:'), err);
      return res.status(500).json({ message: 'Error clearing tmp folder' });
    }
    for (const file of files) {
      fs.unlink(path.join(tmpDir, file), err => {
        if (err) console.error(chalk.red('Error deleting file:'), file, err);
      });
    }
    console.log(chalk.green('Tmp folder cleared'));
    res.json({ message: 'Tmp folder cleared' });
  });
});

// Middleware to serve tmp folder statically
app.use('/tmp', express.static(tmpDir));

// Middleware to auto-clean tmp folder after media download
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(tmpDir, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`[ERROR] File not found for download: ${filePath}`);
      return res.status(404).send('File not found');
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error(`[ERROR] Error sending file: ${filePath}`, err);
      } else {
        // Delete the file after sending
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`[ERROR] Error deleting file after download: ${filePath}`, err);
          } else {
            console.log(`[INFO] Deleted file after download: ${filePath}`);
          }
        });
      }
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
