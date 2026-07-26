from pathlib import Path
import pytest
ROOT=Path(__file__).resolve().parents[1]
def test_adapter_is_truthful_or_complete():
 d=ROOT/'models/edulab-teacher-qwen-0.5b-lora'; config=d/'adapter_config.json'; weights=d/'adapter_model.safetensors'
 assert config.exists()==weights.exists(), 'partial/fake adapter artifact'
 if not config.exists(): pytest.skip('LoRA training not executed yet; correctly not claimed')

