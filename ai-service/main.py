"""
AI service: OCR (Tesseract when available), rule-based lab value analysis, simple chat replies.
"""
from __future__ import annotations

import io
import re
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Diagnostic AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DISCLAIMER = (
    "This assistant provides general information only and is not medical advice. "
    "Always consult a qualified doctor for diagnosis and treatment."
)

# Reference ranges (simplified; demo / educational)
RANGES: dict[str, tuple[float | None, float | None, str]] = {
    "glucose": (70, 99, "mg/dL (fasting approximate)"),
    "fasting glucose": (70, 99, "mg/dL"),
    "blood glucose": (70, 140, "mg/dL (context-dependent)"),
    "hemoglobin": (12.0, 17.5, "g/dL"),
    "hemoglobin a1c": (4.0, 5.6, "%"),
    "hba1c": (4.0, 5.6, "%"),
    "cholesterol": (0, 200, "mg/dL (total, desirable <200)"),
    "ldl": (0, 100, "mg/dL (optimal <100)"),
    "hdl": (40, 999, "mg/dL (higher often better; minimum ~40)"),
    "triglycerides": (0, 150, "mg/dL"),
    "tsh": (0.4, 4.0, "mIU/L"),
    "creatinine": (0.6, 1.3, "mg/dL (varies by sex/muscle)"),
    "wbc": (4.0, 11.0, "10^3/uL"),
    "rbc": (4.2, 5.9, "10^6/uL"),
    "platelet": (150, 450, "10^3/uL"),
}


def ocr_image_bytes(data: bytes) -> str:
    try:
        import pytesseract
        from PIL import Image

        img = Image.open(io.BytesIO(data))
        return pytesseract.image_to_string(img) or ""
    except Exception:
        return ""


def ocr_pdf_first_page(data: bytes) -> str:
    try:
        from pdf2image import convert_from_bytes
        import pytesseract

        images = convert_from_bytes(data, first_page=1, last_page=1)
        if not images:
            return ""
        return pytesseract.image_to_string(images[0]) or ""
    except Exception:
        return ""


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file")
    mt = (file.content_type or "").lower()
    text = ""
    if "pdf" in mt:
        text = ocr_pdf_first_page(raw)
    else:
        text = ocr_image_bytes(raw)
    return {"text": text.strip()}


class AnalyzeBody(BaseModel):
    text: str = Field(..., min_length=1, max_length=500_000)


def classify_value(low: float | None, high: float | None, val: float) -> str:
    if low is not None and val < low * 0.85:
        return "critical_low"
    if low is not None and val < low:
        return "low"
    if high is not None and val > high * 1.4:
        return "critical_high"
    if high is not None and val > high:
        return "high"
    if low is not None and high is not None and low <= val <= high:
        return "normal"
    return "moderate"


LINE_PATTERNS = [
    re.compile(
        r"(?P<name>[A-Za-z][A-Za-z0-9 /\-]{2,40})\s*[:=]\s*(?P<val>\d+\.?\d*)",
        re.I,
    ),
    re.compile(
        r"(?P<name>[A-Za-z][A-Za-z0-9 /\-]{2,40})\s+(?P<val>\d+\.?\d*)\s*(mg/dl|g/dl|%|mmol/l|miu/l|10\^3)?",
        re.I,
    ),
]


def extract_pairs(text: str) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    for pat in LINE_PATTERNS:
        for m in pat.finditer(text):
            name = m.group("name").strip().lower()
            try:
                val = float(m.group("val"))
            except ValueError:
                continue
            found.append({"raw_name": name, "value": val})
    return found


def analyze_text(text: str) -> dict[str, Any]:
    pairs = extract_pairs(text)
    structured: list[dict[str, Any]] = []
    risk_flags: list[str] = []

    for p in pairs:
        name = p["raw_name"]
        val = p["value"]
        matched_key = None
        for key in RANGES:
            if key in name or name in key:
                matched_key = key
                break
        if not matched_key:
            # fuzzy: first word
            w = name.split()[0] if name else ""
            for key in RANGES:
                if key.startswith(w) or w.startswith(key[:3]):
                    matched_key = key
                    break

        status = "unknown"
        unit_note = ""
        if matched_key:
            low, high, unit_note = RANGES[matched_key]
            status = classify_value(low, high, val)
            display = matched_key.title()
        else:
            display = name.title()

        structured.append(
            {
                "testName": display,
                "value": val,
                "status": status,
                "reference": unit_note,
            }
        )

        if status in ("high", "critical_high", "low", "critical_low"):
            risk_flags.append(f"{display}: value {val} flagged as {status.replace('_', ' ')}")

    if not structured:
        summary = (
            "We could not confidently extract numeric lab values from this document. "
            "Ask your lab or doctor for a structured report, or try a clearer scan."
        )
    else:
        crit = sum(1 for s in structured if "critical" in s["status"])
        abn = sum(1 for s in structured if s["status"] not in ("normal", "unknown"))
        summary = (
            f"Parsed {len(structured)} potential measurements. "
            f"{abn} may be outside typical reference ranges"
            + (f" including {crit} that may need prompt clinical review." if crit else ".")
        )

    return {"structured": structured, "summary": summary, "risk_flags": risk_flags}


@app.post("/analyze")
def analyze(body: AnalyzeBody):
    return analyze_text(body.text)


class ChatBody(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    context: str | None = None


def chat_reply(message: str, context: str | None) -> str:
    m = message.lower()
    if any(k in m for k in ("sugar", "glucose", "blood sugar", "diabetes")):
        return (
            "Fasting blood sugar is often discussed around 70–99 mg/dL for many adults, but targets differ "
            "if you have diabetes, are pregnant, or take medications. Whether your number is 'high' depends on "
            "when the test was taken (fasting vs after eating) and your personal care plan from your clinician."
        )
    if "cholesterol" in m or "ldl" in m or "hdl" in m:
        return (
            "Cholesterol results usually include total cholesterol, LDL, HDL, and triglycerides. "
            "What is 'good' or 'high' depends on your overall heart risk. Your doctor interprets the full panel, "
            "not a single number in isolation."
        )
    if "a1c" in m or "hba1c" in m:
        return (
            "HbA1c reflects average blood sugar over roughly three months. Many guidelines use thresholds for "
            "prediabetes and diabetes, but your target should be individualized by your doctor."
        )
    if "normal" in m and ("range" in m or "value" in m):
        return (
            "Reference ranges vary by lab method, age, sex, and health status. The range printed on your report "
            "is usually the best guide for that specific test."
        )
    if context:
        return (
            "Based on the context you shared, focus on the status labels in your report (normal / high / low / critical) "
            "and discuss any flagged values with your doctor. I can explain general concepts, but I cannot diagnose."
        )
    return (
        "I can explain common lab concepts in plain language. Share a specific test name or value from your report, "
        "and I will describe what it generally measures and why doctors order it—then please confirm details with your clinician."
    )


@app.post("/chat")
def chat(body: ChatBody):
    reply = chat_reply(body.message, body.context)
    return {"reply": reply, "disclaimer": DISCLAIMER}
