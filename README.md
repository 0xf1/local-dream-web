# LocalDreamWeb

A lightweight web interface for the [Local Dream](https://github.com/xororz/local-dream) Android app, providing a seamless bridge between your browser and your Android device's local AI image generation server.

## Overview

LocalDreamWeb is a Python-based Flask server that proxies requests to your Local Dream Android app running on a local network, exposing a clean, modern web UI built with vanilla JavaScript. It enables users to interact with their local AI models for image generation directly from the browser without needing the mobile interface.

## Features

- **Proxy Server**: Transparently forwards API calls to your local Dream server's control and generation endpoints
- **Canvas Editor**: Full-featured image editing canvas with drawing tools, layers, masks, and visual filters
- **AI Generation Integration**: Direct integration with local AI models for text-to-image and image-to-image generation
- **Model Selection**: Browse and switch between available AI models through the UI
- **Streaming Support**: Real-time progress updates via Server-Sent Events (SSE) during generation
- **Zero Dependencies**: Pure vanilla JavaScript frontend — no build tools, no frameworks, no npm

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Browser    │◀──▶│  LocalDreamWeb   │◀──▶│  Local Dream Server │
│  (Frontend) │     │  (Flask Backend) │     │  (Control + Gen)    │
└─────────────┘     └──────────────────┘     └─────────────────────┘
```

## Project Structure

```
LocalDreamWeb/
├── start-server.py          # Flask application entry point
├── config_default.py        # Default configuration values
├── config_user.py           # User overrides (optional)
├── README.md
└── web-sources/             # Frontend assets
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/                  # Vanilla JavaScript modules (ESM)
        ├── main.js          # Application entry point
        ├── canvas/          # Canvas editing tools
        ├── editor/          # Drawing, layers, filters
        ├── generation/      # AI model integration & API calls
        └── ui/              # UI components and controls
```

## Installation

First, clone the repository:

```bash
git clone https://github.com/0xf1/local-dream-web.git
cd local-dream-web
```

Then simply run the provided batch script:

```powershell
.\start-server.bat
```

The script will automatically set up a Python virtual environment and install all required dependencies (`flask`, `requests`). After installation, it starts the web server.

## Configuration

Edit `config_user.py` (create it from `config_default.py`) to customize:

| Setting | Description | Default |
|---------|-------------|---------|
| `WEB_SERVER_PORT` | Port for the Flask web server | `8084` |
| `LOCAL_DREAM_HOST` | IP address of your local Dream server | `"192.168.0.100"` |
| `LOCAL_DREAM_CONTROL_PORT` | Control API port | `8808` |
| `LOCAL_DREAM_GENERATION_PORT` | Generation API port | `8081` |

## Usage

Start the server:

```powershell
.\start-server.bat
```

The script will automatically open your default browser pointing to the interface. The Flask app listens on all network interfaces (`0.0.0.0`), allowing access from other devices on your local network.

> **Important:** Before using LocalDreamWeb, make sure you have pressed **"Enter host mode"** in the [Local Dream](https://github.com/xororz/local-dream) Android app. This enables the server to accept incoming connections from your computer.

## Frontend Development Notes

- **ESM Modules**: All JavaScript uses native ES modules with explicit `.js` extensions in imports
- **File Size Limit**: Each file is kept under 250 lines for maintainability
- **No Build Tools**: Pure vanilla JS — no TypeScript, webpack, or bundlers required
- **Modular Design**: Strict separation between data/API logic and DOM manipulation

## License

This project is open source and available under the [MIT](https://opensource.org/licenses/MIT) License.