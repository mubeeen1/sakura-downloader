# 🚀 Multi-Downloader

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![EJS](https://img.shields.io/badge/EJS-AE2F24?style=for-the-badge&logo=ejs&logoColor=white)

An all-in-one media downloader web application built with Node.js and Express. This project provides a simple and clean user interface to download videos, images, and audio from a wide variety of popular platforms.

## ✨ Features

-   **User-Friendly Web Interface**: Easy to navigate, with dedicated pages for each platform.
-   **Wide Platform Support**: Download media from your favorite sites.
-   **Metadata Fetching**: Retrieves title, description, and thumbnail for a better user experience.
-   **Safe Filenames**: Automatically sanitizes filenames to prevent errors.
-   **Temporary File Management**: Downloads files to a temporary server location and provides a cleanup mechanism.

### Supported Platforms

-   ✅ TikTok
-   ✅ YouTube (Video & Audio)
-   ✅ Facebook
-   ✅ Instagram
-   ✅ Twitter
-   ✅ CapCut
-   ✅ Pinterest
-   ✅ Google Drive
-   ✅ MediaFire

## 🛠️ Tech Stack

-   **Backend**: Node.js, Express.js
-   **Template Engine**: EJS
-   **Core Downloader Library**: [btch-downloader](https://www.npmjs.com/package/btch-downloader)
-   **HTTP Client**: Axios
-   **Utilities**: `body-parser`, `chalk`, `mime-types`

## ⚙️ Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

-   Node.js (v14 or higher recommended)
-   npm (comes with Node.js)

### Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/mubeen1/sakura-downloader.git
    cd multi-downloader
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Run the server:**
    ```sh
    node index.js
    ```

4.  **Open your browser** and navigate to `http://localhost:3000`.

## 🚀 Usage

1.  From the homepage, click on the icon of the platform you wish to download from.
2.  You will be redirected to a dedicated page for that platform (e.g., `/youtube`).
3.  Paste the full URL of the media you want to download into the input field.
4.  Click the "Download" button.
5.  The application will process the link, fetch the media, and display a preview with the title, description, and a download button for the media file.

## 📂 Project Structure

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

## 🔧 How It Works

The application follows a straightforward server-side download process:

1.  **User Request**: The user submits a URL through the web interface on a platform-specific page.
2.  **API Call**: The frontend sends a `POST` request to the `/:platform/download` endpoint with the URL.
3.  **Scraping**: The Express server uses the `btch-downloader` library to scrape the provided URL and extract direct download links for the media and its thumbnail, along with metadata like title and description.
4.  **Temporary Download**: The server uses `axios` to download the media and thumbnail from the extracted URLs and saves them into a local `/tmp` directory with sanitized filenames.
5.  **Response to Client**: The server sends a JSON response back to the client containing the local paths to the downloaded media and thumbnail (e.g., `/tmp/video.mp4`).
6.  **Display & Download**: The client-side JavaScript dynamically updates the page to show the media preview, title, and a final download link pointing to the server's temporary file.
7.  **Serve & Clean**: When the user clicks the final download link (`/download/:filename`), the server serves the file and immediately deletes it from the `/tmp` directory to save space.

## 🛣️ API Endpoints

| Method | Route                      | Description                                                              |
| :----- | :------------------------- | :----------------------------------------------------------------------- |
| `GET`  | `/`                        | Renders the main homepage.                                               |
| `GET`  | `/:platform`               | Renders the download page for the specified platform.                    |
| `POST` | `/:platform/download`      | Processes a URL, downloads the media, and returns file paths.            |
| `GET`  | `/download/:filename`      | Serves a downloaded file to the user and then deletes it.                |
| `POST` | `/clear-tmp`               | Manually clears all files from the temporary directory.                  |
| `GET`  | `/error`                   | Displays a generic error page with a custom message.                     |

---

Happy Downloading! ✨
