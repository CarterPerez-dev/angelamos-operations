"""
Angela TTS Server - Routes
"""

import io

import edge_tts
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from .config import VOICE

router = APIRouter()


class SynthesizeRequest(BaseModel):
    text: str


@router.get("/health")
async def health():
    return {"status": "ok", "model": "edge-tts", "voice": VOICE}


@router.post("/synthesize")
async def synthesize(request: SynthesizeRequest):
    if not request.text.strip():
        raise HTTPException(status_code = 400, detail = "Empty text")

    communicate = edge_tts.Communicate(request.text, VOICE)

    buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buffer.write(chunk["data"])

    buffer.seek(0)
    return Response(content = buffer.read(), media_type = "audio/mpeg")


@router.get("/voices")
async def list_voices():
    voices = await edge_tts.list_voices()
    return {
        "voices": [
            {
                "voice_id": v["ShortName"],
                "name": v["FriendlyName"]
            } for v in voices
        ]
    }
