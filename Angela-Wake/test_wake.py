#!/usr/bin/env python3
"""
Quick test script for Angela wake word detection.
Say "angela" into your mic and watch for detections.
"""

import asyncio
import json
import numpy as np
import sounddevice as sd
import websockets

SAMPLE_RATE = 16000
CHUNK_MS = 80
CHUNK_SAMPLES = int(SAMPLE_RATE * CHUNK_MS / 1000)

async def test_wake_word():
    uri = "ws://localhost:5003/ws"

    print("Connecting to Angela-Wake server...")
    async with websockets.connect(uri) as ws:
        print("Connected! Say 'angela' into your mic...")
        print("Press Ctrl+C to stop\n")

        def audio_callback(indata, frames, time, status):
            if status:
                print(f"Audio status: {status}")
            audio_bytes = (indata[:, 0] * 32767).astype(np.int16).tobytes()
            asyncio.run_coroutine_threadsafe(ws.send(audio_bytes), loop)

        loop = asyncio.get_event_loop()

        with sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype=np.float32,
            blocksize=CHUNK_SAMPLES,
            callback=audio_callback
        ):
            while True:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=0.1)
                    data = json.loads(msg)
                    if data.get("detected"):
                        print(f">>> DETECTED: {data['model']} (score: {data['score']:.3f})")
                except asyncio.TimeoutError:
                    pass

if __name__ == "__main__":
    try:
        asyncio.run(test_wake_word())
    except KeyboardInterrupt:
        print("\nStopped.")
