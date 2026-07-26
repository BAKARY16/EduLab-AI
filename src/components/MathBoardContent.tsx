"use client";

import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

function normalizeLatex(value: string) {
  return value
    .replaceAll("×", "\\times ").replaceAll("÷", "\\div ").replaceAll("∞", "\\infty")
    .replaceAll("≤", "\\le ").replaceAll("≥", "\\ge ").replaceAll("≠", "\\ne ")
    .replaceAll("∈", "\\in ").replaceAll("√", "\\sqrt ").replaceAll("±", "\\pm ")
    .replaceAll("²", "^{2}").replaceAll("³", "^{3}")
    .replace(/([A-Za-z0-9)]+)\s*\/\s*([A-Za-z0-9(]+)/g, "\\frac{$1}{$2}")
    .replace(/\bln\b/g, "\\ln").replace(/\bexp\b/g, "\\exp");
}

const FORMULA_LINE = /^(?:FORMULE|CALCUL|ÉQUATION|SOLUTION)\s*:\s*(.+)$/i;
const INLINE_FORMULA = /(ln\s*\([^\n,;.]+\)|[A-Za-z][A-Za-z0-9]*(?:\([^)]*\))?\s*[=<>≤≥]\s*[^,;.]+)/g;

export function MathBoardContent({ text }: { text: string }) {
  return <div className="space-y-2">{text.split("\n").map((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={index} className="h-2"/>;
    const formula = trimmed.match(FORMULA_LINE);
    if (formula) return <div key={index} className="my-3 overflow-x-auto rounded-lg bg-black/10 px-3 py-2 text-center text-[1.08rem]"><BlockMath math={normalizeLatex(formula[1])}/></div>;
    const numberedFormula = trimmed.match(/^\d+\.\s*(.+[=<>≤≥].*)$/);
    if (numberedFormula) return <div key={index} className="my-3 overflow-x-auto rounded-lg bg-black/10 px-3 py-2 text-center text-[1.08rem]"><BlockMath math={normalizeLatex(numberedFormula[1])}/></div>;
    const parts = trimmed.split(INLINE_FORMULA);
    return <p key={index} className="leading-7">{parts.map((part, partIndex) => part.match(INLINE_FORMULA) ? <span key={partIndex} className="mx-1 inline-block rounded bg-black/10 px-1.5"><InlineMath math={normalizeLatex(part)}/></span> : <span key={partIndex}>{part}</span>)}</p>;
  })}</div>;
}
