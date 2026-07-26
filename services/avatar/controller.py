from dataclasses import dataclass

STATES = {"enter", "wave", "idle", "listen", "think", "speak", "write", "point", "explain", "encourage", "congratulate", "warn", "error", "exit"}
TRANSITIONS = {
    "idle": {"listen", "think", "speak", "write", "point", "exit"},
    "listen": {"think", "idle", "error"},
    "think": {"speak", "write", "error"},
    "speak": {"idle", "listen", "point", "write"},
}


@dataclass(frozen=True)
class AvatarCommand:
    state: str
    emotion: str = "calm"
    intensity: float = 0.5
    target: str | None = None
    duration_ms: int = 1500
    lip_sync_url: str | None = None
    gesture_variant: int = 1
    board_target: str | None = None


class AvatarController:
    def __init__(self) -> None:
        self.state = "idle"

    def transition(self, command: AvatarCommand) -> AvatarCommand:
        if command.state not in STATES:
            raise ValueError("État avatar inconnu")
        allowed = TRANSITIONS.get(self.state, STATES)
        if command.state not in allowed:
            self.state = "idle"
        self.state = command.state
        return command
