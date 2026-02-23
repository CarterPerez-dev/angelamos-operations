"""
Angela TTS Server - Configuration
"""

APP_TITLE = "Angela TTS Server"
APP_VERSION = "3.0.0"

HOST = "0.0.0.0"  # Bind to all interfaces (for local dev or container)
PORT = 5002  # Also used in tts.compose.yml ports mapping

VOICE = "en-GB-LibbyNeural"
