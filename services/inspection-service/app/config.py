from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://cms:cms_secret@localhost:5432/cms"
    redis_url: str = "redis://localhost:6379/2"
    rabbitmq_url: str = "amqp://cms:cms_secret@localhost:5672/"
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "cms-docs"
    minio_secure: bool = False
    jwt_secret_key: str = "change_me"
    jwt_algorithm: str = "HS256"
    cors_origins: str = "http://localhost:3000"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
