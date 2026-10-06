import os
import threading
import subprocess
import time
import requests
from flask import Flask, request, Response, send_from_directory, abort

try:
    from config_user import (
        WEB_SERVER_PORT,
        LOCAL_DREAM_HOST,
        LOCAL_DREAM_CONTROL_PORT,
        LOCAL_DREAM_GENERATION_PORT
    )
except ImportError:
    from config_default import (
        WEB_SERVER_PORT,
        LOCAL_DREAM_HOST,
        LOCAL_DREAM_CONTROL_PORT,
        LOCAL_DREAM_GENERATION_PORT
    )

# Root folder for static content
STATIC_DIR = "web-sources"

app = Flask(
    __name__,
    static_folder=STATIC_DIR,
    static_url_path=''
)

# Base URLs for proxying internal services
CONTROL_URL = f"http://{LOCAL_DREAM_HOST}:{LOCAL_DREAM_CONTROL_PORT}"
GENERATION_URL = f"http://{LOCAL_DREAM_HOST}:{LOCAL_DREAM_GENERATION_PORT}"

@app.route('/control/select', methods=['POST'])
def control_select():
    """Proxies a POST request to change the model selection."""
    try:
        response = requests.post(
            f"{CONTROL_URL}/select",
            data=request.get_data(),
            headers={"Content-Type": "application/json"}
        )
        return Response(response.content, response.status_code, response.headers.items())
    except Exception as e:
        return f"Control server error: {str(e)}", 500


@app.route('/control/stop', methods=['POST'])
def control_stop():
    """Proxies the POST request to stop processes."""
    try:
        response = requests.post(
            f"{CONTROL_URL}/stop",
            data=request.get_data(),
            headers={"Content-Type": "application/json"}
        )
        return Response(response.content, response.status_code, response.headers.items())
    except Exception as e:
        return f"Control server error: {str(e)}", 500


@app.route('/control/models', methods=['GET'])
def control_models():
    """Retrieves a list of available models."""
    try:
        response = requests.get(f"{CONTROL_URL}/models")
        return Response(response.content, response.status_code, response.headers.items())
    except Exception as e:
        return f"Control server error: {str(e)}", 500


@app.route('/control/status', methods=['GET'])
def control_status():
    """Retrieves the current status of the management server."""
    try:
        response = requests.get(f"{CONTROL_URL}/status")
        return Response(response.content, response.status_code, response.headers.items())
    except Exception as e:
        return f"Control server error: {str(e)}", 500

@app.route('/generation/generate', methods=['POST'])
def generation_generate():
    """Proxies the POST request for generation. Supports data streaming for SSE."""
    try:
        # Execute the request with stream=True to read the generation server's response line by line.
        res = requests.post(
            f"{GENERATION_URL}/generate",
            data=request.get_data(),
            headers={"Content-Type": "application/json"},
            stream=True
        )
        
        # Generator for reading data from a socket as it arrives
        def generate_stream():
            for chunk in res.iter_content(chunk_size=4096):
                if chunk:
                    yield chunk

        content_type = res.headers.get('Content-Type', 'text/event-stream')
        return Response(generate_stream(), status=res.status_code, content_type=content_type)
    except Exception as e:
        return f"Generation streaming error: {str(e)}", 500


@app.route('/generation/tokenize', methods=['POST'])
def generation_tokenize():
    """Proxies the POST request for text tokenization."""
    try:
        response = requests.post(
            f"{GENERATION_URL}/tokenize",
            data=request.get_data(),
            headers={"Content-Type": "application/json"}
        )
        return Response(response.content, response.status_code, response.headers.items())
    except Exception as e:
        return f"Generation server error: {str(e)}", 500

@app.route('/')
def serve_index():
    """Serves the main interface file, index.html, from the static files folder."""
    try:
        return send_from_directory(STATIC_DIR, 'index.html')
    except Exception:
        abort(404, description="File index.html not found")


@app.route('/<path:path>')
def serve_static(path):
    """
    Automatically serves any static files (JS, CSS, images),
    preserving the subdirectory structure within web-sources.
    """
    if not path or path.strip() == "":
        abort(400, description="Bad Request")
    try:
        return send_from_directory(STATIC_DIR, path)
    except Exception:
        abort(404, description=f"File {path} not found")


def open_browser_via_os(port):
    """Pauses for 1.5 seconds while Flask starts up, and opens the default browser using standard Windows methods."""
    time.sleep(1.5)
    url = f"http://localhost:{port}/"
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    subprocess.Popen([chrome_path, url])    

if __name__ == '__main__':
    # Start a background thread to open the browser
    # daemon=True ensures that the thread does not block the application from closing
    threading.Thread(target=open_browser_via_os, args=[WEB_SERVER_PORT], daemon=True).start()

    # Start a local web server on the port specified in the configuration
    # host='0.0.0.0' allows accepting connections from the local network
    app.run(host='0.0.0.0', port=WEB_SERVER_PORT, debug=False)
