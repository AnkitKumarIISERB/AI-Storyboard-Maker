import os
import base64
import uuid
import requests
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

# Load .env from backend folder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__)

# Get Stability API key
STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
if not STABILITY_API_KEY:
    raise ValueError("❌ STABILITY_API_KEY is not set. Please set it in your .env file.")

API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"

# Folder to save generated images
STATIC_FOLDER = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_FOLDER, exist_ok=True)

@app.route("/generate", methods=["POST"])
def generate_image():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        # Request image from Stability AI
        response = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {STABILITY_API_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json={
                "text_prompts": [{"text": prompt}],
                "cfg_scale": 7,
                "clip_guidance_preset": "NONE",
                "height": 1024,
                "width": 1024,
                "samples": 1,
                "steps": 30,
            },
        )

        if response.status_code != 200:
            return jsonify({"error": response.text}), response.status_code

        result = response.json()
        image_base64 = result["artifacts"][0]["base64"]

        # Save image to static folder
        filename = f"{uuid.uuid4().hex}.png"
        output_path = os.path.join(STATIC_FOLDER, filename)
        with open(output_path, "wb") as f:
            f.write(base64.b64decode(image_base64))

        # Return URL (Flask serves static files)
        return jsonify({"image_url": f"/static/{filename}"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(STATIC_FOLDER, filename)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
