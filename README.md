# 🌸 Sakura-Downloader 🌸

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-AE2F24?style=for-the-badge&logo=ejs&logoColor=white)

```text
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║    ███████╗ █████╗ ██╗  ██╗██╗   ██╗██████╗  ██████╗         ║
║    ██╔════╝██╔══██╗██║ ██╔╝██║   ██║██╔══██╗██╔═══██╗        ║
║    ███████╗███████║█████╔╝ ██║   ██║██████╔╝██║   ██║        ║
║    ╚════██║██╔══██║██╔═██╗ ██║   ██║██╔══██╗██║   ██║        ║
║    ███████║██║  ██║██║  ██╗╚██████╔╝██████╔╝╚██████╔╝        ║
║    ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝  ╚═════╝         ║
║                                                            ║
║      Your Media Downloader in a world of falling petals 🌸   ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

Dive into the neon-lit streets of media downloading with **Multi-Downloader** — your ultimate cyberpunk toolkit to grab videos, images, and audio from the digital matrix. Powered by Node.js and Express, this sleek web app brings you a futuristic, user-friendly interface to hack the media world.

## ✨⚡ Features That Glow in the Dark ⚡✨

-   🕹️ **User-Friendly Web Interface**: Navigate the digital grid with ease, dedicated pages for each platform.
-   🌐 **Wide Platform Support**: Hack into your favorite sites and download media effortlessly.
-   🧠 **Metadata Fetching**: Snatch titles, descriptions, and thumbnails for a slick preview.
-   🔒 **Safe Filenames**: Auto-sanitized filenames to keep your downloads glitch-free.
-   🗑️ **Temporary File Management**: Files live in a temporary server zone, cleaned up to keep the system lean.

### Supported Platforms 🚀

-   ✅ TikTok
-   ✅ YouTube (Video & Audio)
-   ✅ Facebook
-   ✅ Instagram
-   ✅ Twitter
-   ✅ CapCut
-   ✅ Pinterest
-   ✅ Google Drive
-   ✅ MediaFire

## 🛠️ Tech Stack — The Cyber Arsenal

-   ⚙️ **Backend**: Node.js, Express.js
-   🎭 **Template Engine**: EJS
-   📦 **Core Downloader Library**: [btch-downloader](https://www.npmjs.com/package/btch-downloader)
-   🌐 **HTTP Client**: Axios
-   🛠️ **Utilities**: `body-parser`, `chalk`, `mime-types`

## ⚙️ Installation — Jack Into the System

### Prerequisites

-   ⚡ Node.js (v14 or higher recommended)
-   📦 npm (comes with Node.js)

### Setup

```bash
git clone https://github.com/mubeen1/sakura-downloader.git
cd multi-downloader
npm install
node index.js
```

Open your browser and jack into the local server at `http://localhost:3000`.

## 🚀 Usage — Navigate the Neon Grid

1.  From the homepage, click the icon of your target platform.
2.  Get redirected to a dedicated download page (e.g., `/youtube`).
3.  Paste the full media URL into the input field.
4.  Hit the **Download** button.
5.  Watch as the app hacks the link, fetches media, and displays a slick preview with title, description, and download button.

## 📂 Project Structure — The Code Matrix

```
multi-downloader/
├── public/
│   └── images/
│       └── black_placeholder.png  # Placeholder thumbnail
├── tmp/                           # Temporary storage for downloaded files
├── views/
│   ├── main.ejs                   # Homepage
│   ├── platform.ejs               # Generic platform download page
│   └── error.ejs                  # Error page
├── index.js                       # Main Express server file
├── package.json
└── README.md
```

## 🔧 How It Works — Behind the Neon Curtain

1.  🕵️‍♂️ **User Request**: Submit a URL through the platform-specific page.
2.  ⚡ **API Call**: Frontend sends a `POST` request to `/:platform/download` with the URL.
3.  🤖 **Scraping**: Server uses `btch-downloader` to extract direct media and thumbnail links plus metadata.
4.  💾 **Temporary Download**: Media and thumbnails are downloaded to `/tmp` with sanitized filenames.
5.  📡 **Response**: Server sends JSON with local paths to the downloaded files.
6.  🎥 **Display & Download**: Client updates page with media preview and final download link.
7.  🧹 **Serve & Clean**: Server serves the file and deletes it immediately to save space.

## 🛣️ API Endpoints — The Command Console

| Method | Route                      | Description                                                              |
| :----- | :------------------------- | :----------------------------------------------------------------------- |
| `GET`  | `/`                        | Renders the main homepage.                                               |
| `GET`  | `/:platform`               | Renders the download page for the specified platform.                    |
| `POST` | `/:platform/download`      | Processes a URL, downloads the media, and returns file paths.            |
| `GET`  | `/download/:filename`      | Serves a downloaded file to the user and then deletes it.                |
| `POST` | `/clear-tmp`               | Manually clears all files from the temporary directory.                  |
| `GET`  | `/error`                   | Displays a generic error page with a custom message.                     |

---

# 🐳 Docker Deployment

Deploy your neon cyberpunk downloader anywhere with ease. This Docker container is optimized for platforms like Koyeb.

```dockerfile
# Use official Node.js 18 Alpine image for a lightweight container
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Install pm2 globally
RUN npm install pm2 -g

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the app with pm2
CMD ["pm2-runtime", "index.js"]
```

## 🐳 Running with Docker

Build the Docker image:

```bash
docker build -t multi-downloader .
```

Run the Docker container:

```bash
docker run -p 3000:3000 multi-downloader
```

This will start the app inside the container using pm2 for better process management and reliability.

---

✨ Happy Downloading in the Neon Future! ⚡🕶️
