"""
Angela Wake Word Server - Configuration
"""

import os
from pathlib import Path


APP_TITLE = "Angela Wake Word Server"
APP_VERSION = "1.0.0"

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "5003"))

MODELS_DIR = Path(os.getenv("WAKE_MODELS_DIR", "/app/models"))

DETECTION_THRESHOLD = float(os.getenv("WAKE_THRESHOLD", "0.5"))

ENABLE_VAD = os.getenv("WAKE_ENABLE_VAD", "true").lower() == "true"
VAD_THRESHOLD = float(os.getenv("WAKE_VAD_THRESHOLD", "0.5"))

SAMPLE_RATE = 16000
FRAME_MS = 80
FRAME_SAMPLES = int(SAMPLE_RATE * FRAME_MS / 1000)
