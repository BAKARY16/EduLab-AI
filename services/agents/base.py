from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any


@dataclass
class AgentResult:
    agent: str
    data: dict[str, Any]
    source_ids: list[str]
    validated: bool


class BaseAgent(ABC):
    name = "base"
    timeout_seconds = 15
    retries = 1
    allowed_tools: tuple[str, ...] = ()

    @abstractmethod
    def run(self, payload: dict[str, Any]) -> AgentResult: ...
