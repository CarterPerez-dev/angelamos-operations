"""
Angela Wake Word Server - Routes
"""

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from openwakeword.model import Model
from scipy import signal

from .config import (
    DETECTION_THRESHOLD,
    ENABLE_VAD,
    FRAME_SAMPLES,
    MODELS_DIR,
    VAD_THRESHOLD,
)

TARGET_SAMPLES = 1280


router = APIRouter()

model: Model | None = None


def get_model() -> Model:
    global model
    if model is None:
        model_paths = list(MODELS_DIR.glob("*.tflite")) + list(MODELS_DIR.glob("*.onnx"))

        if model_paths:
            model = Model(
                wakeword_models=[str(p) for p in model_paths],
                vad_threshold=VAD_THRESHOLD if ENABLE_VAD else None,
            )
        else:
            model = Model(
                vad_threshold=VAD_THRESHOLD if ENABLE_VAD else None,
            )
    return model


@router.on_event("startup")
async def startup():
    get_model()


@router.get("/health")
async def health():
    m = get_model()
    return {
        "status": "ok",
        "models": list(m.models.keys()),
        "threshold": DETECTION_THRESHOLD,
        "vad_enabled": ENABLE_VAD,
    }


@router.get("/models")
async def list_models():
    m = get_model()
    return {"models": list(m.models.keys())}


@router.websocket("/ws")
async def websocket_detect(websocket: WebSocket):
    await websocket.accept()

    model_paths = list(MODELS_DIR.glob("*.tflite")) + list(MODELS_DIR.glob("*.onnx"))
    if model_paths:
        m = Model(
            wakeword_models=[str(p) for p in model_paths],
            vad_threshold=VAD_THRESHOLD if ENABLE_VAD else None,
        )
    else:
        m = Model(vad_threshold=VAD_THRESHOLD if ENABLE_VAD else None)

    model_names = list(m.models.keys())
    frame_count = 0

    try:
        while True:
            msg = await websocket.receive()

            if msg.get('type') == 'websocket.disconnect':
                break

            if 'text' in msg:
                if msg['text'] == 'reset':
                    m.reset()
                    print("[DEBUG] Model reset")
                continue

            if 'bytes' not in msg:
                continue

            data = msg['bytes']
            audio = np.frombuffer(data, dtype=np.int16)
            frame_count += 1

            orig_len = len(audio)
            orig_amp = np.max(np.abs(audio))

            if len(audio) != TARGET_SAMPLES:
                ratio = len(audio) // TARGET_SAMPLES
                if ratio > 1:
                    audio = audio[::ratio][:TARGET_SAMPLES]
                else:
                    audio = signal.resample_poly(audio, TARGET_SAMPLES, len(audio)).astype(np.int16)

            predictions = m.predict(audio)

            for name in model_names:
                score = predictions.get(name, 0.0)
                if frame_count % 50 == 0:
                    print(f"[DEBUG] Frame {frame_count}: orig_len={orig_len}, orig_amp={orig_amp}, {name}={score:.4f}")
                if score >= DETECTION_THRESHOLD:
                    await websocket.send_json(
                        {
                            "detected": True,
                            "model": name,
                            "score": float(score),
                        }
                    )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close(code = 1011, reason = str(e))


@router.post("/detect")
async def detect_from_audio(audio_data: bytes):
    m = get_model()

    audio = np.frombuffer(audio_data, dtype = np.int16)
    predictions = m.predict(audio)

    detections = []
    for name, score in predictions.items():
        if score >= DETECTION_THRESHOLD:
            detections.append({"model": name, "score": float(score)})

    return {"detections": detections}
