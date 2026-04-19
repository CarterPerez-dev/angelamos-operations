"""
©AngelaMos | 2026
server.py
"""

import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from faster_whisper import WhisperModel

app = FastAPI()

_model: WhisperModel | None = None


def get_model() -> WhisperModel:
    global _model
    if _model is not None:
        return _model

    device = os.getenv("WHISPER_DEVICE", "auto")
    model_name = os.getenv("WHISPER_MODEL", "medium")
    compute_type = "int8"

    if device == "auto":
        try:
            import ctranslate2

            if ctranslate2.get_cuda_device_count() > 0:
                device = "cuda"
                compute_type = "float16"
            else:
                device = "cpu"
        except Exception:
            device = "cpu"
    elif device == "cuda":
        compute_type = "float16"

    print(f"Loading whisper model '{model_name}' on {device} ({compute_type})")

    try:
        _model = WhisperModel(model_name, device=device, compute_type=compute_type)
    except Exception:
        print(f"Failed to load on {device}, falling back to CPU")
        device = "cpu"
        compute_type = "int8"
        _model = WhisperModel(model_name, device=device, compute_type=compute_type)

    return _model


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio_data = await file.read()
    suffix = Path(file.filename or "audio.wav").suffix or ".wav"

    with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
        tmp.write(audio_data)
        tmp.flush()

        model = get_model()
        segments, info = model.transcribe(tmp.name, beam_size=5)
        text_parts = [seg.text for seg in segments]
        full_text = " ".join(text_parts).strip()

    return {
        "text": full_text,
        "language": info.language,
        "duration": info.duration,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
