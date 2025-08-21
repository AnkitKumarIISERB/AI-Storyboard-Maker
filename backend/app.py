import os
import base64
import uuid
import requests
from flask import Flask, request, jsonify, send_from_directory, render_template
from dotenv import load_dotenv

# Load .env from backend folder
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = Flask(__name__, static_folder="../frontend", template_folder="../frontend")

STABILITY_API_KEY = os.getenv("STABILITY_API_KEY")
if not STABILITY_API_KEY:
    raise ValueError("❌ STABILITY_API_KEY is not set. Please set it in your .env file.")

API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image"

STATIC_FOLDER = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_FOLDER, exist_ok=True)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate_image():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "").strip()
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        # Wrap prompt for API clarity
        full_prompt = f"{prompt}"

        payload = {
            "text_prompts": [{"text": full_prompt}],
            "cfg_scale": 7,
            "clip_guidance_preset": "NONE",
            "height": 1024,
            "width": 1024,
            "samples": 1,
            "steps": 30,
        }

        response = requests.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {STABILITY_API_KEY}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            json=payload,
            timeout=60  # add timeout to avoid hanging requests
        )

        # Log response for debugging
        if response.status_code != 200:
            print("Error response from Stability AI:", response.text)
            return jsonify({"error": f"API error: {response.text}"}), response.status_code

        result = response.json()

        if "artifacts" not in result or len(result["artifacts"]) == 0:
            return jsonify({"error": "No image returned from API"}), 500

        image_base64 = result["artifacts"][0].get("base64")
        if not image_base64:
            return jsonify({"error": "Image data missing in API response"}), 500

        filename = f"{uuid.uuid4().hex}.png"
        output_path = os.path.join(STATIC_FOLDER, filename)
        with open(output_path, "wb") as f:
            f.write(base64.b64decode(image_base64))

        return jsonify({"image_url": f"/static/{filename}"})

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Request failed: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory(STATIC_FOLDER, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
