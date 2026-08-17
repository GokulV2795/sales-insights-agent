"""Tool-calling LangChain agent that powers the sales chatbot, with simple
in-memory per-session conversation history (fine for a single-instance demo
deployment; swap for Redis/Firestore-backed memory for multi-instance prod)."""

from datetime import date

from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from app.llm import get_chat_model
from app.tools import ALL_TOOLS

SYSTEM_PROMPT = f"""You are Aria, a helpful and precise sales analytics assistant for a
mid-size e-commerce company. You have tools to query the company's real sales
database (regions, stores, categories, products, customers, orders).

Today's date is {date.today().isoformat()}.

Guidelines:
- Always use the tools to answer questions about sales figures, trends, products,
  regions, customers, etc. Never invent numbers.
- Prefer the curated aggregation tools (get_kpi_summary, get_revenue_trend,
  get_top_products, get_region_breakdown, get_category_breakdown,
  get_channel_breakdown) for common questions; fall back to run_sql_query for
  anything more specific.
- When asked for a "cumulative" or "running total" report, use
  get_revenue_trend and sum progressively, or run_sql_query.
- Give concise, business-friendly answers. Use currency formatting ($1,234.56)
  and percentages where relevant. Use short bullet points for multi-part answers.
- If a question is ambiguous about the date range, default to all-time data
  and mention that you did so.
"""

_SESSION_HISTORY: dict[str, list] = {}
MAX_HISTORY_MESSAGES = 20


def _build_executor() -> AgentExecutor:
    llm = get_chat_model()
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ]
    )
    agent = create_tool_calling_agent(llm, ALL_TOOLS, prompt)
    return AgentExecutor(agent=agent, tools=ALL_TOOLS, verbose=False, max_iterations=6)


_executor: AgentExecutor | None = None


def get_executor() -> AgentExecutor:
    global _executor
    if _executor is None:
        _executor = _build_executor()
    return _executor


def chat(message: str, session_id: str = "default") -> str:
    history = _SESSION_HISTORY.setdefault(session_id, [])
    executor = get_executor()
    result = executor.invoke({"input": message, "chat_history": history})
    reply = result["output"]

    history.append(HumanMessage(content=message))
    history.append(AIMessage(content=reply))
    if len(history) > MAX_HISTORY_MESSAGES:
        del history[: len(history) - MAX_HISTORY_MESSAGES]

    return reply


def reset_session(session_id: str) -> None:
    _SESSION_HISTORY.pop(session_id, None)
