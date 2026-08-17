from langchain_openai import ChatOpenAI

from app.config import settings


def get_chat_model(temperature: float = 0.3, max_tokens: int = 1024) -> ChatOpenAI:
    """Chat model routed through OpenRouter (OpenAI-compatible API)."""
    return ChatOpenAI(
        model=settings.openrouter_model,
        api_key=settings.openrouter_api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=temperature,
        max_tokens=max_tokens,
        default_headers={
            "HTTP-Referer": settings.openrouter_site_url,
            "X-Title": settings.openrouter_site_name,
        },
    )
