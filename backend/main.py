import asyncio
import json
import subprocess

from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, UploadFile, File, HTTPException



app = FastAPI()

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Storage directories
STAGING_DIR = BASE_DIR / "staging"
UPLOAD_DIR = BASE_DIR / "uploads"
METADATA_DIR = BASE_DIR / "metadata"

# Create directories if they don't exist
for directory in [STAGING_DIR, UPLOAD_DIR, METADATA_DIR]:
    directory.mkdir(parents=True, exist_ok=True)


# Upload configuration
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
CHUNK_SIZE = 1024 * 1024           # 1 MB

FFPROBE_TIMEOUT = 20
FFMPEG_TIMEOUT = 300

MAX_FILE_SIZE = 500 * 1024 * 1024  # 500 MB
CHUNK_SIZE = 1024 * 1024           # 1 MB

ALLOWED_MIME_TYPES = {
    ".mp4": {"video/mp4"},
    ".mov": {"video/quicktime", "video/mp4"},
    ".webm": {"video/webm"}
}

ALLOWED_FORMATS = {
    ".mp4": {"mov", "mp4", "m4a", "3gp", "3g2", "mj2"},
    ".mov": {"mov", "mp4", "m4a", "3gp", "3g2", "mj2"},
    ".webm": {"matroska", "webm"}
}
# Allowed extensions and MIME types
ALLOWED_EXTENSIONS = {
    ".mp4": "mp4",
    ".mov": "mov",
    ".webm": "webm"
}


def validate_video(file_path: Path, original_filename: str, mime_type: str):

    # STEP 1: Extension validation
    extension = Path(original_filename).suffix.lower()

    if extension not in ALLOWED_FORMATS:
        raise HTTPException(415, "Unsupported file extension")

    # STEP 2: MIME validation
    mime_type = (mime_type or "").split(";")[0].strip().lower()

    allowed_mimes = ALLOWED_MIME_TYPES[extension]

    if mime_type and mime_type != "application/octet-stream":
        if mime_type not in allowed_mimes:
            raise HTTPException(415, "Unsupported MIME type")

    try:
        # STEP 3: FFprobe validation
        probe = subprocess.run(
            [
                "ffprobe",
                "-v", "error",
                "-show_format",
                "-show_streams",
                "-of", "json",
                str(file_path)
            ],
            capture_output=True,
            text=True,
            timeout=20
        )

        if probe.returncode != 0:
            raise HTTPException(422, "Invalid video file")

        data = json.loads(probe.stdout)

        # STEP 4: Validate actual container format
        format_name = data.get("format", {}).get("format_name", "")
        detected_formats = set(format_name.split(","))

        if not detected_formats.intersection(ALLOWED_FORMATS[extension]):
            raise HTTPException(415, "Invalid video container")

        # STEP 5: Check for actual video stream
        video_streams = [
            stream for stream in data.get("streams", [])
            if stream.get("codec_type") == "video"
            and not stream.get("disposition", {}).get("attached_pic", 0)
        ]

        if not video_streams:
            raise HTTPException(422, "No video stream found")

        # STEP 6: FFmpeg decoding validation
        result = subprocess.run(
            [
                "ffmpeg",
                "-nostdin",
                "-v", "error",
                "-xerror",
                "-i", str(file_path),
                "-map", "0:{}".format(video_streams[0]["index"]),
                "-f", "null", "-"
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300
        )

        if result.returncode != 0:
            print("FFmpeg error:", result.stderr[-1000:])
            raise HTTPException(422, "Video decoding failed")

        return True

    except subprocess.TimeoutExpired:
        raise HTTPException(422, "Video validation timed out")

    except FileNotFoundError:
        raise HTTPException(500, "FFmpeg or FFprobe not found")

    except json.JSONDecodeError:
        raise HTTPException(422, "Invalid video metadata")



@app.post("/upload", status_code=201)
async def upload_video(file: UploadFile = File(...)):

    original_filename = Path(file.filename or "").name
    extension = Path(original_filename).suffix.lower()

    temp_id = uuid4().hex
    staging_path = STAGING_DIR / f"{temp_id}.part"

    try:
        # STEP 1: Temporary upload with size validation
        total_size = 0

        with staging_path.open("wb") as buffer:
            while chunk := await file.read(CHUNK_SIZE):

                total_size += len(chunk)

                if total_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        413,
                        "File exceeds 500 MB limit"
                    )

                buffer.write(chunk)

        if total_size == 0:
            raise HTTPException(400, "Empty file")

        # STEP 2: Video validation
        await asyncio.to_thread(
            validate_video,
            staging_path,
            original_filename,
            file.content_type or ""
        )

        # STEP 3: UUID generation and permanent storage
        video_id = uuid4().hex
        filename = f"{video_id}{extension}"

        destination = UPLOAD_DIR / filename

        staging_path.replace(destination)

        return {
            "video_id": video_id
        }

    finally:
        await file.close()

        if staging_path.exists():
            staging_path.unlink()