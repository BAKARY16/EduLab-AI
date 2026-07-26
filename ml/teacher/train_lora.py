"""Train a small but real LoRA adapter for Qwen2.5-0.5B-Instruct.

Defaults deliberately perform a proof training run suitable for CPU. Increase
EDULAB_MAX_STEPS and EDULAB_TRAIN_EXAMPLES on a Colab GPU for the full run.
"""
from __future__ import annotations
import json, math, os, platform, time
from pathlib import Path
import torch
from torch.utils.data import Dataset
from peft import LoraConfig, get_peft_model
from transformers import (
    AutoModelForCausalLM, AutoTokenizer, DataCollatorForLanguageModeling,
    Trainer, TrainingArguments, set_seed,
)

ROOT=Path(os.getenv("EDULAB_ROOT","/workspace"))
MODEL_ID="Qwen/Qwen2.5-0.5B-Instruct"
OUT=ROOT/"models/edulab-teacher-qwen-0.5b-lora"
SEED=20260723

def rows(name: str, limit: int):
    path=ROOT/f"data/processed/edulab_teacher_{name}.jsonl"
    data=[json.loads(x) for x in path.read_text(encoding="utf-8").splitlines() if x]
    return data[:limit]

class TokenDataset(Dataset):
    def __init__(self, items): self.items=items
    def __len__(self): return len(self.items)
    def __getitem__(self,index): return self.items[index]

def main():
    set_seed(SEED)
    max_steps=int(os.getenv("EDULAB_MAX_STEPS","1"))
    train_limit=int(os.getenv("EDULAB_TRAIN_EXAMPLES","8"))
    eval_limit=int(os.getenv("EDULAB_EVAL_EXAMPLES","4"))
    max_length=int(os.getenv("EDULAB_MAX_LENGTH","96"))
    started=time.time()
    tokenizer=AutoTokenizer.from_pretrained(MODEL_ID)
    tokenizer.pad_token=tokenizer.eos_token
    base=AutoModelForCausalLM.from_pretrained(MODEL_ID,torch_dtype=torch.float32,low_cpu_mem_usage=True)
    linear_names=sorted({n.rsplit(".",1)[-1] for n,m in base.named_modules() if isinstance(m,torch.nn.Linear)})
    targets=[n for n in ("q_proj","k_proj","v_proj","o_proj") if n in linear_names]
    if not targets: raise RuntimeError(f"No Qwen attention targets in {linear_names}")
    model=get_peft_model(base,LoraConfig(r=4,lora_alpha=8,lora_dropout=.05,target_modules=targets,bias="none",task_type="CAUSAL_LM"))
    def dataset(name,limit):
        texts=[]
        for r in rows(name,limit):
            texts.append(tokenizer.apply_chat_template([
                {"role":"user","content":r["instruction"]+"\nContexte: "+r["context"]},
                {"role":"assistant","content":r["response"]}],tokenize=False))
        encoded=tokenizer(texts,truncation=True,max_length=max_length)
        return TokenDataset([{key:encoded[key][i] for key in encoded} for i in range(len(texts))])
    train_ds=dataset("train",train_limit); eval_ds=dataset("validation",eval_limit)
    args=TrainingArguments(
        output_dir=str(OUT/"checkpoints"),max_steps=max_steps,learning_rate=2e-4,
        per_device_train_batch_size=1,per_device_eval_batch_size=1,
        gradient_accumulation_steps=1,eval_strategy="steps",eval_steps=max_steps,
        save_strategy="steps",save_steps=max_steps,save_total_limit=1,logging_steps=1,
        load_best_model_at_end=True,seed=SEED,report_to="none",use_cpu=not torch.cuda.is_available(),
    )
    trainer=Trainer(model=model,args=args,train_dataset=train_ds,eval_dataset=eval_ds,
                    data_collator=DataCollatorForLanguageModeling(tokenizer,mlm=False))
    before=trainer.evaluate(); result=trainer.train(); after=trainer.evaluate()
    OUT.mkdir(parents=True,exist_ok=True)
    model.save_pretrained(OUT,safe_serialization=True); tokenizer.save_pretrained(OUT/"tokenizer")
    metrics={"model_id":MODEL_ID,"method":"LoRA","targets":targets,"rank":4,"seed":SEED,
             "max_steps":max_steps,"train_examples":len(train_ds),"eval_examples":len(eval_ds),
             "max_length":max_length,"eval_loss_before":before.get("eval_loss"),
             "eval_loss_after":after.get("eval_loss"),"train_loss":result.metrics.get("train_loss"),
             "duration_seconds":time.time()-started,"device":"cuda" if torch.cuda.is_available() else "cpu",
             "torch":torch.__version__,"python":platform.python_version()}
    for key in ("eval_loss_before","eval_loss_after"):
        if metrics[key] is not None: metrics[key.replace("loss","perplexity")]=math.exp(min(metrics[key],20))
    (OUT/"metrics.json").write_text(json.dumps(metrics,indent=2),encoding="utf-8")
    (OUT/"training_args.json").write_text(json.dumps(args.to_dict(),indent=2,default=str),encoding="utf-8")
    (OUT/"model_card.md").write_text(f"# EduLab Teacher Qwen2.5-0.5B LoRA\n\nReal proof LoRA run on `{MODEL_ID}`. Synthetic curriculum-anchored French examples; human validation required. See `metrics.json`.\n",encoding="utf-8")
    (OUT/"dataset_card.md").write_text("# EduLab Teacher Dataset\n\n369 synthetic, source-traceable French examples for Troisième, Terminale C and Terminale D. Grouped lesson splits; not official exam content.\n",encoding="utf-8")
    print(json.dumps(metrics,indent=2))
if __name__=="__main__": main()
