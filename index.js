const express = require("express" );
const bodyParser = require("body-parser");
const session = require("express-session");
const fs = require('fs');
const path = require('path');
const ytdown = require('./src/ytdown'); 
const app = express();
const port = process.env.PORT || 3000;

// Simplified logging utility
class Logger {
  constructor() {
    this.colors = this.detectColors();
  }

  detectColors() {
    const identity = (s) => s;
    const colors = {
      red: identity,
      green: identity,
      yellow: identity,
      blue: identity,
      cyan: identity,
      magenta: identity,
      gray: identity,
      white: identity,
      bold: identity
    };

    import('chalk').then((chalk) => {
      const chalkInstance = chalk.default || chalk;
      if (chalkInstance) {
        colors.red = chalkInstance.red || identity;
        colors.green = chalkInstance.green || identity;
        colors.yellow = chalkInstance.yellow || identity;
        colors.blue = chalkInstance.blue || identity;
        colors.cyan = chalkInstance.cyan || identity;
        colors.magenta = chalkInstance.magenta || identity;
        colors.gray = chalkInstance.gray || identity;
        colors.white = chalkInstance.white || identity;
        colors.bold = chalkInstance.bold || identity;
      }
    }).catch((error) => {
      console.warn('Chalk not available or incompatible, using fallback colors:', error.message);
    });

    return colors;
  }

  getTimestamp() {
    return new Date().toISOString().replace('T', ' ').substr(0, 19);
  }

  log(level, message, context = 'APP') {
    const timestamp = this.getTimestamp();
    const levels = {
      info: { symbol: 'ℹ️', color: this.colors.blue },
      success: { symbol: '✅', color: this.colors.green },
      warning: { symbol: '⚠️', color: this.colors.yellow },
      error: { symbol: '❌', color: this.colors.red }
    };

    const levelConfig = levels[level] || levels.info;
    const formattedMessage = `${levelConfig.symbol} [${level.toUpperCase()}] [${timestamp}] [${context}] ${message}`;
    
    // Safety check: ensure color function is callable
    const colorFn = typeof levelConfig.color === 'function' ? levelConfig.color : (s) => s;
    
    if (level === 'error') {
      console.error(colorFn(formattedMessage));
    } else if (level === 'warning') {
      console.warn(colorFn(formattedMessage));
    } else {
      console.log(colorFn(formattedMessage));
    }
  }

  info(message, context) { this.log('info', message, context); }
  success(message, context) { this.log('success', message, context); }
  warning(message, context) { this.log('warning', message, context); }
  error(error, context) { 
    const message = error.message || 'Unknown error';
    this.log('error', message, context);
    if (error.stack) {
      console.error(this.colors.gray(error.stack));
    }
  }
}

const logger = new Logger();

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const level = status >= 500 ? 'error' : status >= 400 ? 'warning' : 'info';
    
    logger.log(level, `${req.method.padEnd(4)} ${req.url} ${status} ${duration}ms`, 'REQUEST');
  });
  
  next();
};

// User-friendly error messages
const getUserFriendlyError = (error) => {
  const errorMap = {
    'ENOTFOUND': 'Network connection failed. Please check your internet connection.',
    'ECONNREFUSED': 'Service is temporarily unavailable. Please try again later.',
    'ETIMEDOUT': 'Request timed out. Please try again.',
    'Invalid URL': 'The URL you provided is not valid. Please check and try again.',
    'Network Error': 'Network error occurred. Please check your connection.',
    'Parse Error': 'Unable to process the content. Please try a different URL.',
    'Rate Limited': 'Too many requests. Please wait a moment and try again.',
    'Not Found': 'The requested content could not be found.',
    'Access Denied': 'Access to this content is restricted.',
    'Service Unavailable': 'Service is temporarily unavailable. Please try again later.'
  };

  const errorMessage = error.message || error.toString();
  return Object.entries(errorMap).find(([pattern]) => 
    errorMessage.includes(pattern)
  )?.[1] || 'An unexpected error occurred. Please try again or contact support if the problem persists.';
};

// Middleware
app.use(requestLogger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Updated home route to render main.ejs instead of maintenance
app.get("/", (req, res) => {
  res.render('main');
});

// Error page route
app.get("/error", (req, res) => {
  let errorMessage = req.query.message || "An unknown error occurred.";
  try {
    errorMessage = decodeURIComponent(errorMessage);
  } catch (e) {
    logger.warning('Failed to decode error message', 'ERROR_PAGE');
    errorMessage = "An unknown error occurred.";
  }
  
  logger.info(`Error page accessed: ${errorMessage}`, 'ERROR_PAGE');
  res.status(500).render('error', { errorMessage });
});

// New API routes for YouTube scraping
app.post("/api/youtube/info", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logger.warning('YouTube API called without URL', 'YOUTUBE_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logger.info(`Fetching video info for: ${url}`, 'YOUTUBE_API');
    const result = await ytdown.getVideoInfo(url);
    
    if (result.success) {
      logger.success(`Video info fetched successfully: ${result.data?.title || 'Unknown title'}`, 'YOUTUBE_API');
    }
    
    res.json(result);
  } catch (error) {
    logger.error(error, 'YOUTUBE_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

app.post("/api/youtube/convert", async (req, res) => {
  try {
    const { vid, k } = req.body;
    
    if (!vid || !k) {
      logger.warning('YouTube convert API called without required parameters', 'YOUTUBE_API');
      return res.status(400).json({ success: false, error: 'Video ID and key are required' });
    }

    logger.info(`Converting video: ${vid} with key: ${k}`, 'YOUTUBE_API');
    const result = await ytdown.convertVideo(vid, k);
    
    if (result.success) {
      logger.success(`Video converted successfully: ${result.data?.title || 'Unknown title'}`, 'YOUTUBE_API');
    }
    
    res.json(result);
  } catch (error) {
    logger.error(error, 'YOUTUBE_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});



app.get("/:platform", (req, res) => {
  const platform = req.params.platform.toLowerCase();
  
  if (platform === 'favicon.ico') {
    return res.status(404).end();
  }

  if (!['instagram', 'youtube' ,'pinterest', 'tiktok', "facebook", "twitter"].includes(platform)) {
    logger.warning(`Unsupported platform requested: ${platform}`, 'ROUTING');
    return res.redirect(`/error?message=${encodeURIComponent("Platform not supported")}`);
  }
  
  logger.info(`Platform page accessed: ${platform}`, 'ROUTING');
  res.render(`${platform}`, { platform });
});

// Instagram download route
app.post("/instagram/download", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logger.warning('Instagram download called without URL', 'INSTAGRAM_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logger.info(`Instagram download requested for: ${url}`, 'INSTAGRAM_API');
    const instagram = require('./src/instagram');
    const mediaItems = await instagram.downloadInstagram(url);
    
    logger.success(`Instagram media downloaded: ${mediaItems?.length || 0} items`, 'INSTAGRAM_API');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logger.error(error, 'INSTAGRAM_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// Pinterest download route
app.post("/pinterest/download", async (req, res) => {
  try {
    const { url, mediaType } = req.body;
    
    if (!url) {
      logger.warning('Pinterest download called without URL', 'PINTEREST_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logger.info(`Pinterest download requested for: ${url} (type: ${mediaType})`, 'PINTEREST_API');
    
    const pinterest = require('./src/pinterest');
    let mediaItems = [];
    let errorToThrow = null;

    try {
      mediaItems = await pinterest.downloadPinterest(url);
    } catch (err) {
      logger.warning(`btch-downloader failed for Pinterest: ${err.message}`, 'PINTEREST_API');
      errorToThrow = err;
    }

    // If it was supposed to be a video, but we got no items, or we got an image instead of a video,
    // and pintScrape is available, try pintScrape as a fallback
    const gotVideo = mediaItems.length > 0 && mediaItems[0].type === 'video';
    if (mediaType === 'video' && !gotVideo && fs.existsSync('./src/pintScrape.js')) {
      logger.info('Falling back to RapidAPI pintScrape for Pinterest video', 'PINTEREST_API');
      try {
        const pintscrape = require('./src/pintScrape');
        mediaItems = await pintscrape.downloadPinterestVideo(url);
      } catch (scrapeErr) {
        logger.error(scrapeErr, 'PINTEREST_API');
        // If both failed, throw the primary error or fallback error
        throw errorToThrow || scrapeErr;
      }
    }

    if (!mediaItems || mediaItems.length === 0) {
      throw errorToThrow || new Error('No media URL found');
    }

    logger.success(`Pinterest ${mediaType} downloaded: ${mediaItems?.length || 0} items`, 'PINTEREST_API');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logger.error(error, 'PINTEREST_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// TikTok download route
app.post("/tiktok/download", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logger.warning('TikTok download called without URL', 'TIKTOK_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logger.info(`TikTok download requested for: ${url}`, 'TIKTOK_API');
    
    const tiktok = require('./src/tiktok');
    const mediaItems = await tiktok.downloadTikTok(url);
    
    logger.success(`TikTok media downloaded: ${mediaItems?.length || 0} items`, 'TIKTOK_API');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logger.error(error, 'TIKTOK_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// Facebook download route
app.post("/facebook/download", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logger.warning('Facebook download called without URL', 'FACEBOOK_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logger.info(`Facebook download requested for: ${url}`, 'FACEBOOK_API');
    
    const facebook = require('./src/facebook');
    const mediaItems = await facebook.downloadFacebook(url);
    
    logger.success(`Facebook media downloaded: ${mediaItems?.length || 0} items`, 'FACEBOOK_API');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logger.error(error, 'FACEBOOK_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});

// Twitter download route
app.post("/twitter/download", async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      logger.warning('Twitter download called without URL', 'TWITTER_API');
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    logger.info(`Twitter download requested for: ${url}`, 'TWITTER_API');
    
    const twitter = require('./src/twitter');
    const mediaItems = await twitter.downloadTwitter(url);
    
    logger.success(`Twitter media downloaded: ${mediaItems?.length || 0} items`, 'TWITTER_API');
    res.json({ success: true, mediaItems });
  } catch (error) {
    logger.error(error, 'TWITTER_API');
    const userFriendlyMessage = getUserFriendlyError(error);
    res.status(500).json({ success: false, error: userFriendlyMessage });
  }
});


// Global error handling middleware
app.use((err, req, res, next) => {
  logger.error(err, 'GLOBAL');
  
  const userFriendlyMessage = getUserFriendlyError(err);
  const errorMessage = encodeURIComponent(userFriendlyMessage);
  
  // Don't redirect API calls, send JSON response instead
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ 
      success: false, 
      error: userFriendlyMessage
    });
  }
  
  // For web routes, redirect to error page
  res.redirect(`/error?message=${errorMessage}`);
});

// 404 handler
app.use((req, res) => {
  logger.warning(`404 - Page not found: ${req.path}`, '404_HANDLER');
  const errorMessage = encodeURIComponent(`Page not found: ${req.path}`);
  res.status(404).redirect(`/error?message=${errorMessage}`);
});

app.listen(port, () => {
  logger.success(`🌸 Sakura Downloader server running at http://localhost:${port}`, 'SERVER');
  logger.info('📱 Available platforms: /instagram, /pinterest, /tiktok, /facebook, /twitter, /youtube', 'SERVER');
  logger.info('✨ Enhanced logging and error handling enabled', 'SERVER');
});
