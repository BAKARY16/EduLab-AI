from typing import Any, Literal

from pydantic import BaseModel, Field


class SourceCitation(BaseModel):
    source_id: str
    title: str
    url: str | None = None
    page: int | None = None
    official_status: str


class BoardBlock(BaseModel):
    type: Literal["heading", "paragraph", "definition", "formula", "example", "callout", "question"]
    content: str


class AvatarCommand(BaseModel):
    state: Literal["enter", "wave", "idle", "listen", "think", "speak", "write", "point", "explain", "encourage", "congratulate", "warn", "error", "exit"]
    emotion: str = "calm"
    intensity: float = Field(default=0.5, ge=0, le=1)
    target: str | None = None
    duration_ms: int = Field(default=1500, ge=0, le=30000)
    lip_sync_url: str | None = None
    gesture_variant: int = Field(default=1, ge=1, le=5)
    board_target: str | None = None


class TutorStep(BaseModel):
    id: str
    type: Literal["explanation", "formula", "example", "simulation", "checkpoint", "correction", "summary"]
    teacher_text: str
    board_blocks: list[BoardBlock] = []
    avatar_command: AvatarCommand
    voice_instruction: dict[str, Any] = {}
    important: bool = False
    exam_focus: bool = False
    estimated_seconds: int = 30
    source_ids: list[str] = []
    interaction_required: bool = False
