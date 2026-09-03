from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://cms:cms_secret@localhost:5432/cms"
    redis_url: str = "redis://localhost:6379/1"
    rabbitmq_url: str = "amqp://cms:cms_secret@localhost:5672/"
    jwt_secret_key: str = "change_me"
    jwt_algorithm: str = "HS256"
    cors_origins: str = "http://localhost:3000"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
