"""Opt-in publication of LoRA-only artifacts to a private HF repository."""
import argparse
from pathlib import Path
from huggingface_hub import HfApi
p=argparse.ArgumentParser(); p.add_argument('--repo-id',required=True); p.add_argument('--confirm-legal-review',action='store_true'); a=p.parse_args()
if not a.confirm_legal_review: raise SystemExit('Refused: legal review confirmation required')
folder=Path(__file__).resolve().parents[1]/'models/edulab-teacher-qwen-0.5b-lora'
if not (folder/'adapter_model.safetensors').exists(): raise SystemExit('No trained adapter weights')
api=HfApi(); api.create_repo(a.repo_id,private=True,exist_ok=True); api.upload_folder(repo_id=a.repo_id,folder_path=folder,ignore_patterns=['checkpoints/**']); print(a.repo_id)

