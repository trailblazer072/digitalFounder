import boto3
from botocore.exceptions import NoCredentialsError
from fastapi import UploadFile
from app.core.config import settings

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket = settings.AWS_BUCKET_NAME

    async def upload_file(self, file_obj: UploadFile, key: str) -> str:
        """
        Uploads a file to S3 and returns the public URL (or S3 URI).
        """
        if not self.bucket:
            return "S3 Bucket not configured"

        try:
            # Reset cursor since it might have been read
            await file_obj.seek(0)
            
            # We use upload_fileobj for efficient streaming
            self.s3_client.upload_fileobj(
                file_obj.file,
                self.bucket,
                key,
                ExtraArgs={'ContentType': file_obj.content_type}
            )
            
            # Reset cursor after reading for S3 so other services can read it if needed
            # But usually we consume it. If we need it again, we might need to seek(0).
            # await file_obj.seek(0)

            # Construct URL (assuming public or standard S3 structure)
            url = f"https://{self.bucket}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
            return url
        except Exception as e:
            print(f"S3 Upload Error: {e}")
            raise e

s3_service = S3Service()
