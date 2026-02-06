"""
Angela Wake Word Server - Routes
"""

import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from openwakeword.model import Model

from .config import (
    DETECTION_THRESHOLD,
    ENABLE_VAD,
    FRAME_SAMPLES,
    MODELS_DIR,
    VAD_THRESHOLD,
)


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

    m = get_model()
    model_names = list(m.models.keys())

    try:
        while True:
            data = await websocket.receive_bytes()

            audio = np.frombuffer(data, dtype = np.int16)

            predictions = m.predict(audio)

            for name in model_names:
                score = predictions.get(name, 0.0)
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
