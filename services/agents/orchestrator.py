from ml.nlp.classifier import classify
from .base import AgentResult, BaseAgent


class OrchestratorAgent(BaseAgent):
    name = "orchestrator"
    allowed_tools = ("rag_search", "source_verify")

    def run(self, payload: dict) -> AgentResult:
        result = classify(str(payload.get("question", "")))
        return AgentResult(
            agent=self.name,
            data={"intent": result.intent, "subject": result.subject, "confidence": result.confidence},
            source_ids=[], validated=True,
        )
