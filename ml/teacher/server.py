"""HTTP inference service loading the immutable base plus trained LoRA."""
from __future__ import annotations
import json, os, sys, time
from contextlib import asynccontextmanager
from pathlib import Path
import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from peft import PeftModel
from transformers import AutoModelForCausalLM, AutoTokenizer

ROOT=Path(os.getenv("EDULAB_ROOT","/workspace")); MODEL_ID="Qwen/Qwen2.5-0.5B-Instruct"
ADAPTER=ROOT/"models/edulab-teacher-qwen-0.5b-lora"; state={}

sys.path.insert(0, str(ROOT))
from ml.teacher.context_builder import build_teacher_context

class GenerateRequest(BaseModel):
    instruction:str=Field(min_length=3,max_length=2000); context:str=Field(default="",max_length=4000)
    class_name:str="Troisième"; subject:str="Physique-Chimie"; max_new_tokens:int=Field(160,ge=16,le=512)

@asynccontextmanager
async def lifespan(app):
    if not (ADAPTER/"adapter_model.safetensors").exists(): raise RuntimeError("Trained LoRA adapter missing")
    tok=AutoTokenizer.from_pretrained(ADAPTER/"tokenizer")
    base=AutoModelForCausalLM.from_pretrained(MODEL_ID,torch_dtype=torch.float32,low_cpu_mem_usage=True)
    model=PeftModel.from_pretrained(base,ADAPTER); model.eval(); state.update(tokenizer=tok,model=model)
    yield
    state.clear()
app=FastAPI(title="EduLab Teacher Model",lifespan=lifespan)

@app.get("/health")
def health(): return {"status":"ok","model":MODEL_ID,"adapter":str(ADAPTER.name),"device":"cpu","trained":True}

@app.get("/metadata")
def metadata():
    metrics={}
    if (ADAPTER/"metrics.json").exists(): metrics=json.loads((ADAPTER/"metrics.json").read_text(encoding="utf-8"))
    splits={}
    for name in ("train","validation","test"):
        p=ROOT/f"data/processed/edulab_teacher_{name}.jsonl"
        splits[name]=sum(1 for line in p.open(encoding="utf-8") if line.strip()) if p.exists() else 0
    agents=[
      {"id":"retrieval","name":"Agent Recherche","status":"ready","role":"Sélection du contexte traçable"},
      {"id":"pedagogy","name":"Agent Pédagogique","status":"ready","role":"Structure cours et explications"},
      {"id":"exercise","name":"Agent Exercices","status":"ready","role":"Questions et exercices adaptés"},
      {"id":"correction","name":"Agent Correction","status":"ready","role":"Indices et correction progressive"},
      {"id":"exam","name":"Agent Examens","status":"ready","role":"Préparation BEPC et BAC"},
      {"id":"robot","name":"Agent Robot Professeur","status":"connected","role":"JSON, tableau et avatar"},
    ]
    return {"model":{"base":MODEL_ID,"adapter":ADAPTER.name,"trained":bool(metrics),"device":metrics.get("device","cpu"),"method":metrics.get("method","LoRA"),"metrics":metrics},"dataset":{"total":sum(splits.values()),"splits":splits,"classes":["Troisième","Terminale C","Terminale D"],"subjects":["Mathématiques","Physique-Chimie","SVT"]},"agents":agents}

@app.post("/generate")
def generate(p:GenerateRequest):
    tok=state.get("tokenizer"); model=state.get("model")
    if not tok or not model: raise HTTPException(503,"Model not loaded")

    teacher_context=build_teacher_context(p.instruction, p.subject, p.context, academic_class=p.class_name)
    context=teacher_context.as_prompt_context()
    sources=teacher_context.sources

    content=f"Classe: {p.class_name}. Matière: {p.subject}.\n{p.instruction}"
    if context: content+=f"\nContexte fiable: {context}"
    if teacher_context.definitions: content+="\nDéfinitions repérées: "+" | ".join(teacher_context.definitions)
    if teacher_context.formulas: content+="\nFormules repérées: "+", ".join(teacher_context.formulas)
    system=("Tu es le professeur EduLab pour les classes d'examen ivoiriennes. "
            "Utilise uniquement les faits présents dans le contexte fiable. "
            "N'invente jamais de nom, date, source, formule ou résultat. "
            "Si le contexte est insuffisant, dis-le clairement. Réponds en français correct, "
            "au niveau indiqué, avec une définition, la formule utile, un exemple vérifiable "
            "et une courte question de contrôle. Termine par 'Sources: [n]' pour les passages utilisés.")
    prompt=tok.apply_chat_template([{"role":"system","content":system},{"role":"user","content":content}],tokenize=False,add_generation_prompt=True)
    x=tok(prompt,return_tensors="pt"); started=time.time()
    with torch.inference_mode(): y=model.generate(**x,max_new_tokens=p.max_new_tokens,do_sample=False,repetition_penalty=1.08)
    answer=tok.decode(y[0][x.input_ids.shape[1]:],skip_special_tokens=True).strip()
    parsed=None
    try: parsed=json.loads(answer)
    except Exception: pass
    return {"mode":"lora","model":MODEL_ID,"adapter":ADAPTER.name,"answer":answer,"json":parsed,"sources":sources,"latency_seconds":round(time.time()-started,3)}

if __name__=="__main__":
    import uvicorn
    uvicorn.run(app,host="0.0.0.0",port=int(os.getenv("PORT","8010")))
