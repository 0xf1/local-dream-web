import os
import json
import threading
import subprocess
import time
import requests
from flask import Flask, request, Response, send_from_directory, abort

# Notes directory
NOTES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'Notes')
os.makedirs(NOTES_DIR, exist_ok=True)

# Forbidden characters in Windows filenames
FORBIDDEN_CHARS = '<>:"|?*/\\'

def validate_filename(filename):
    """Validates filename for filesystem safety. Returns error message or None."""
    if not filename:
        return "Filename required"
    for char in FORBIDDEN_CHARS:
        if char in filename:
            return f"Invalid filename: character '{char}' is not allowed in filenames"
    return None


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
        res = requests.post(
            f"{GENERATION_URL}/generate",
            data=request.get_data(),
            headers={"Content-Type": "application/json"},
            stream=True
        )
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


@app.route("/api/notes", methods=["GET"])
def notes_list():
    """Returns a list of all text files in the Notes directory."""
    try:
        files = [f.replace(".txt", "") for f in os.listdir(NOTES_DIR) if f.endswith(".txt")]
        return json.dumps({"files": files})
    except Exception as e:
        return json.dumps({"error": str(e)}), 500

@app.route("/api/notes/create", methods=["POST"])
def notes_create():
    """Creates a new text file in the Notes directory."""
    try:
        data = request.get_json()
        filename = data.get("filename", "")
        if not filename:
            return json.dumps({"error": "Invalid filename"}), 400
        # Ensure .txt extension is always added
        if not filename.endswith(".txt"):
            filename = filename + ".txt"
        filepath = os.path.join(NOTES_DIR, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(data.get("content", ""))
        return json.dumps({"success": True})
    except Exception as e:
        return json.dumps({"error": str(e)}), 500

@app.route("/api/notes/read", methods=["POST"])
def notes_read():
    """Reads the content of a text file from the Notes directory."""
    try:
        data = request.get_json()
        filename = data.get("filename", "")
        if not filename:
            return json.dumps({"error": "Filename required"}), 400
        # Validate filename for filesystem safety
        error = validate_filename(filename)
        if error:
            return json.dumps({"error": error}), 400
        # Ensure .txt extension is always added
        if not filename.endswith(".txt"):
            filename = filename + ".txt"
        filepath = os.path.join(NOTES_DIR, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        return json.dumps({"content": content})
    except Exception as e:
        return json.dumps({"error": str(e)}), 500

@app.route("/api/notes/check", methods=["POST"])
def notes_check():
    """Checks if a file exists in the Notes directory."""
    try:
        data = request.get_json()
        filename = data.get("filename", "")
        if not filename:
            return json.dumps({"error": "Filename required"}), 400
        # Validate filename for filesystem safety
        error = validate_filename(filename)
        if error:
            return json.dumps({"error": error}), 400
        # Ensure .txt extension is always added
        if not filename.endswith(".txt"):
            filename = filename + ".txt"
        filepath = os.path.join(NOTES_DIR, filename)
        exists = os.path.exists(filepath)
        return json.dumps({"exists": exists})
    except Exception as e:
        return json.dumps({"error": str(e)}), 500

@app.route("/api/notes/update", methods=["POST"])
def notes_update():
    """Updates the content of a text file in the Notes directory."""
    try:
        data = request.get_json()
        filename = data.get("filename", "")
        content = data.get("content", "")
        overwrite = data.get("overwrite", False)
        if not filename:
            return json.dumps({"error": "Filename required"}), 400
        # Validate filename for filesystem safety
        error = validate_filename(filename)
        if error:
            return json.dumps({"error": error}), 400
        # Ensure .txt extension is always added
        if not filename.endswith(".txt"):
            filename = filename + ".txt"
        filepath = os.path.join(NOTES_DIR, filename)
        # Check if file exists and user hasn't confirmed overwrite
        if os.path.exists(filepath) and not overwrite:
            return json.dumps({"error": "File already exists", "exists": True}), 409
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        return json.dumps({"success": True})
    except Exception as e:
        return json.dumps({"error": str(e)}), 500

@app.route("/api/notes/rename", methods=["POST"])
def notes_rename():
    """Renames a text file in the Notes directory."""
    try:
        data = request.get_json()
        old_name = data.get("old_name", "")
        new_name = data.get("new_name", "")
        if not old_name or not new_name:
            return json.dumps({"error": "Both old_name and new_name required"}), 400
        # Validate filenames for filesystem safety
        error = validate_filename(old_name)
        if error:
            return json.dumps({"error": error}), 400
        error = validate_filename(new_name)
        if error:
            return json.dumps({"error": error}), 400
        # Ensure .txt extension is always added
        if not old_name.endswith(".txt"):
            old_name = old_name + ".txt"
        if not new_name.endswith(".txt"):
            new_name = new_name + ".txt"
        old_path = os.path.join(NOTES_DIR, old_name)
        new_path = os.path.join(NOTES_DIR, new_name)
        os.rename(old_path, new_path)
        return json.dumps({"success": True})
    except Exception as e:
        return json.dumps({"error": str(e)}), 500

@app.route("/api/notes/delete", methods=["POST"])
def notes_delete():
    """Deletes a text file from the Notes directory."""
    try:
        data = request.get_json()
        filename = data.get("filename", "")
        if not filename:
            return json.dumps({"error": "Filename required"}), 400
        # Validate filename for filesystem safety
        error = validate_filename(filename)
        if error:
            return json.dumps({"error": error}), 400
        # Ensure .txt extension is always added
        if not filename.endswith(".txt"):
            filename = filename + ".txt"
        filepath = os.path.join(NOTES_DIR, filename)
        os.remove(filepath)
        return json.dumps({"success": True})
    except Exception as e:
        return json.dumps({"error": str(e)}), 500

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