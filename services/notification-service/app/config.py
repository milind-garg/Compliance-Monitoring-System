from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://cms:cms_secret@localhost:5432/cms"
    redis_url: str = "redis://localhost:6379/4"
    rabbitmq_url: str = "amqp://cms:cms_secret@localhost:5672/"
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@compliance.local"
    jwt_secret_key: str = "change_me"
    jwt_algorithm: str = "HS256"
    cors_origins: str = "http://localhost:3000"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
