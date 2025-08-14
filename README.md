# 🌸 Sakura Downloader 🌸

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-AE2F24?style=for-the-badge&logo=ejs&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-pink?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-brightgreen?style=for-the-badge)

```text
                    🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸
                   🌸                                    🌸
              🌸       ███████╗  █████╗  ██╗  ██╗██╗   ██╗██████╗   █████╗      🌸
             🌸        ██╔════╝ ██╔══██╗ ██║ ██╔╝██║   ██║██╔══██╗ ██╔══██╗      🌸
            🌸         ███████╗ ███████║ █████╔╝ ██║   ██║██████╔╝ ███████║      🌸
           🌸          ╚════██║ ██╔══██║ ██╔═██╗ ██║   ██║██╔══██╗ ██╔══██║      🌸
          🌸           ███████║ ██║  ██║ ██║  ██╗ ╚██████╔╝██║  ██║ ██║  ██║      🌸
         🌸            ╚══════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝  ╚═════╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝      🌸
        🌸                                                                          🌸
         🌸               ✨ Where Cherry Blossoms Meet Media Magic ✨               🌸
          🌸                  🌸 Download with Elegance & Grace 🌸                   🌸
           🌸                                                                      🌸
            🌸                       🌸 🌸 🌸 🌸 🌸 🌸 🌸                       🌸
             🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸 🌸
```

🌸 **Welcome to Sakura Downloader** - where technology blooms like cherry blossoms in spring! 🌸

Just as sakura petals dance gracefully through the air, your favorite media content flows effortlessly to your device. Experience the perfect harmony of beauty and functionality in this elegant media downloading sanctuary.

## 🌸✨ Features That Bloom with Beauty ✨🌸

-   🎋 **Graceful Web Interface**: Navigate with the elegance of falling cherry blossoms, each platform has its own serene space
-   🌏 **Garden of Platforms**: From the bustling digital gardens to quiet social streams, download from your favorite platforms
-   🏮 **Smart Metadata Extraction**: Like collecting memories, we gather titles, descriptions, and preview images
-   🌺 **Gentle File Handling**: Filenames are purified like morning dew, ensuring perfect compatibility
-   🍃 **Ephemeral Storage**: Files rest briefly like petals on water before gracefully cleaning themselves
-   🎨 **Random Naming Magic**: No more duplicate names! Each file gets a unique alphanumeric identity (7-10 characters)
-   📱 **Responsive Design**: Beautiful on all devices, from desktop gardens to mobile blossoms

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

## 🏗️ Tech Stack — The Blooming Garden 🌸

-   🌿 **Backend**: Node.js, Express.js - The strong roots of our digital tree
-   🎨 **Template Engine**: EJS - Painting beautiful web pages like cherry blossom art
-   📦 **Core Downloader**: [btch-downloader](https://www.npmjs.com/package/btch-downloader) - The magic that makes petals fall gracefully
-   🌐 **HTTP Client**: Axios - Swift messengers carrying data like spring breeze
-   🛠️ **Utilities**: `body-parser`, `chalk`, `mime-types` - Essential tools in our gardener's toolkit

## 🌱 Installation — Plant Your Sakura Tree

### Prerequisites 🌸

-   🌿 Node.js (v14 or higher recommended) - The fertile soil for our app
-   📦 npm (comes with Node.js) - The gardening tools we need

### Setup 🎋

```bash
git clone https://github.com/mubeen1/sakura-downloader.git
cd sakura-downloader
npm install
node index.js
```

Open your browser and step into the serene garden at `http://localhost:3000` 🌸

## 🌸 Usage — Walk Through the Cherry Blossom Path

1.  🏮 From the main garden (homepage), choose your favorite platform shrine
2.  🎋 Enter the dedicated temple for your platform (e.g., `/youtube`)
3.  📝 Gracefully paste your media URL into the sacred input field
4.  🌸 Press the **Download** button and watch the magic unfold
5.  ✨ Witness as the app extracts your media with the precision of a master gardener, complete with beautiful thumbnail preview

## 📁 Project Structure — The Sacred Garden Layout 🏮

```
sakura-downloader/
├── public/                        # 🎨 Static assets shrine
│   └── images/
│       └── black_placeholder.png  # 🖼️ Gentle placeholder for thumbnails
├── tmp/                           # 🍃 Ephemeral storage for media files
├── views/                         # 🏮 Temple views and layouts
│   ├── main.ejs                   # 🌸 Beautiful homepage garden
│   ├── platform.ejs               # 🎋 Platform-specific download shrine
│   └── error.ejs                  # 🚩 Graceful error handling page
├── index.js                       # 🌿 The heart of our blooming server
├── package.json                   # 📜 Project essence and dependencies
└── README.md                      # 📚 This beautiful guide you're reading
```

## 🔧 How The Magic Works — Behind the Cherry Blossom Veil 🌸

1.  🎋 **User's Wish**: Submit a URL through the platform's sacred page
2.  ⚡ **Digital Messenger**: Frontend sends a gentle `POST` request to `/:platform/download`
3.  🌸 **Content Extraction**: Server uses `btch-downloader` to delicately extract media and thumbnail links
4.  💎 **Temporary Sanctuary**: Media and thumbnails rest briefly in `/tmp` with purified names
5.  📡 **Response Delivery**: Server responds with paths to the downloaded treasures
6.  🎥 **Beautiful Preview**: Client displays media preview with elegant thumbnail and download button
7.  🍃 **Graceful Cleanup**: Files are served and then fade away like falling petals

## 🛤️ API Endpoints — The Sacred Pathways

| Method | Route                      | Description                                                              |
| :----- | :------------------------- | :----------------------------------------------------------------------- |
| `GET`  | `/`                        | Renders the main homepage.                                               |
| `GET`  | `/:platform`               | Renders the download page for the specified platform.                    |
| `POST` | `/:platform/download`      | Processes a URL, downloads the media, and returns file paths.            |
| `GET`  | `/download/:filename`      | Serves a downloaded file to the user and then deletes it.                |
| `POST` | `/clear-tmp`               | Manually clears all files from the temporary directory.                  |
| `GET`  | `/error`                   | Displays a generic error page with a custom message.                     |

---

# 🌏 Docker Deployment — Spread the Sakura Magic Everywhere 🌸

Like cherry blossoms traveling on the wind, deploy your beautiful downloader anywhere with grace. This containerized garden blooms perfectly on platforms like Koyeb, Heroku, and beyond! 🌱

```dockerfile
# Use the most elegant Node.js Alpine image 🏔️
FROM node:18-alpine

# Create our sacred workspace 🏮
WORKDIR /app

# Gather the essential seeds (dependencies) 🌱
COPY package*.json ./
RUN npm install --production

# Install pm2 for graceful process management 🌿
RUN npm install pm2 -g

# Plant the complete Sakura tree 🌸
COPY . .

# Open the garden gate 🚹
EXPOSE 3000

# Let the Sakura tree bloom with pm2 🌸
CMD ["pm2-runtime", "index.js"]
```

## 🌱 Cultivating Your Docker Garden

Plant the Sakura seeds (build the image):

```bash
docker build -t sakura-downloader .
```

Let your garden bloom (run the container):

```bash
docker run -p 3000:3000 sakura-downloader
```

Watch as your containerized cherry blossom garden starts blooming with pm2 managing the petals! 🌸✨

---

## 🌸 Contributing to the Garden

We welcome all gardeners to contribute to this blooming sanctuary! Whether you're:

- 🌿 Adding new platform support
- 🐛 Fixing bugs (removing pests from the garden)
- 🎨 Improving the UI (making the blossoms more beautiful)
- 📚 Writing documentation (sharing gardening wisdom)

Your contributions help the Sakura garden grow stronger and more beautiful! 🌱

---

## 🌸 License

This project is released under the MIT License - as free and beautiful as cherry blossoms in the wind.

---

```text
                        🌸 Thank you for visiting our garden! 🌸
                       🌱 May your downloads be as swift as 🌱
                      🍃 falling petals and twice as beautiful 🍃
                       🌸 🌸 🌸 🌸 🌸 🌸 🌸
```

✨ Happy Downloading in the Beautiful Sakura Season! 🌸🌱✨
