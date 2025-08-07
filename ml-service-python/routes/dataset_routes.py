import os
import asyncio
import aiofiles
import logging
from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Request
from models.response_models import TaskAcceptedResponse
from services import feature_selection_service
import config

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the router
router = APIRouter(prefix="/dataset", tags=["1. Dataset Ingestion & Feature Selection"])


class StreamingMultipartParser:
    """Custom streaming multipart parser that writes directly to file"""

    def __init__(self, boundary: str, output_path: str):
        self.boundary = boundary.encode()
        self.output_path = output_path
        self.boundary_pattern = b"--" + self.boundary
        self.end_boundary_pattern = b"--" + self.boundary + b"--"

    async def parse_and_save(self, request_stream):
        bytes_written = 0
        filename = "dataset.csv"
        state = "searching_headers"
        buffer = b""

        # Create output directory if needed
        os.makedirs(os.path.dirname(self.output_path), exist_ok=True)

        async with aiofiles.open(self.output_path, "wb") as output_file:
            async for chunk in request_stream:
                buffer += chunk

                if state == "searching_headers":
                    # Look for Content-Disposition header
                    if b'Content-Disposition: form-data; name="file"' in buffer:
                        # Extract filename if present
                        filename_start = buffer.find(b'filename="')
                        if filename_start != -1:
                            filename_start += 10  # len('filename="')
                            filename_end = buffer.find(b'"', filename_start)
                            if filename_end != -1:
                                filename = buffer[filename_start:filename_end].decode(
                                    "utf-8", errors="ignore"
                                )

                        # Find end of headers (double CRLF)
                        headers_end = buffer.find(b"\r\n\r\n")
                        if headers_end != -1:
                            # Switch to file content mode
                            state = "reading_file"
                            buffer = buffer[headers_end + 4 :]  # Skip the \r\n\r\n

                elif state == "reading_file":
                    # Look for boundary in buffer
                    while True:
                        boundary_pos = buffer.find(self.boundary_pattern)
                        end_boundary_pos = buffer.find(self.end_boundary_pattern)

                        if end_boundary_pos != -1:
                            # Found end boundary - write remaining data and finish
                            # Look for \r\n before the boundary
                            data_end = end_boundary_pos
                            if buffer[data_end - 2 : data_end] == b"\r\n":
                                data_end -= 2

                            if data_end > 0:
                                await output_file.write(buffer[:data_end])
                                bytes_written += data_end

                            return bytes_written, filename

                        elif boundary_pos != -1:
                            # Found regular boundary - write data before it and finish
                            # Look for \r\n before the boundary
                            data_end = boundary_pos
                            if buffer[data_end - 2 : data_end] == b"\r\n":
                                data_end -= 2

                            if data_end > 0:
                                await output_file.write(buffer[:data_end])
                                bytes_written += data_end

                            return bytes_written, filename

                        else:
                            # No boundary found, but keep some buffer in case boundary spans chunks
                            if len(buffer) > len(self.boundary_pattern) + 10:
                                # Write most of the buffer, keeping some for potential boundary
                                write_amount = (
                                    len(buffer) - len(self.boundary_pattern) - 10
                                )
                                await output_file.write(buffer[:write_amount])
                                bytes_written += write_amount
                                buffer = buffer[write_amount:]

                                # Log progress
                                if (
                                    bytes_written % (50 * 1024 * 1024) == 0
                                ):  # Every 50MB
                                    logger.info(
                                        f"Streamed {bytes_written / (1024*1024):.1f}MB..."
                                    )
                            break

            # Write any remaining buffer
            if buffer:
                await output_file.write(buffer)
                bytes_written += len(buffer)

        return bytes_written, filename


@router.post(
    "/store", response_model=TaskAcceptedResponse, status_code=status.HTTP_202_ACCEPTED
)
async def store_dataset_and_select_features(
    request: Request, background_tasks: BackgroundTasks
):
    """
    Accepts a dataset via streaming, stores it directly to disk without using
    temporary files, and triggers feature selection in the background.
    This approach avoids disk space issues in /tmp and improves performance.
    """
    try:
        # Validate content type
        content_type = request.headers.get("content-type", "")
        if not content_type.startswith("multipart/form-data"):
            raise HTTPException(
                status_code=400, detail="Content-Type must be multipart/form-data"
            )

        # Extract boundary
        boundary = None
        for part in content_type.split(";"):
            part = part.strip()
            if part.startswith("boundary="):
                boundary = part.split("=", 1)[1].strip('"')
                break

        if not boundary:
            raise HTTPException(
                status_code=400, detail="No boundary found in Content-Type header"
            )

        logger.info(f"Starting streaming upload with boundary: {boundary[:20]}...")

        # Use streaming parser
        parser = StreamingMultipartParser(boundary, config.DATASET_FILE_PATH)
        bytes_written, filename = await parser.parse_and_save(request.stream())

        if bytes_written == 0:
            raise HTTPException(status_code=400, detail="No file data received")

        logger.info(
            f"Successfully streamed {filename} ({bytes_written / (1024*1024):.2f}MB) "
            f"to {config.DATASET_FILE_PATH}"
        )

        # Validate CSV extension
        if not filename.lower().endswith((".csv", ".txt")):
            logger.warning(f"File {filename} may not be a CSV file")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to process streaming upload: {e}")
        # Clean up partial file
        try:
            if os.path.exists(config.DATASET_FILE_PATH):
                os.remove(config.DATASET_FILE_PATH)
        except:
            pass
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    # Trigger feature selection in background
    logger.info("Queuing feature selection task")
    background_tasks.add_task(feature_selection_service.run_feature_selection)

    return TaskAcceptedResponse(
        message="Dataset uploaded successfully. Feature selection running in background.",
        dataset_path=config.DATASET_FILE_PATH,
    )
