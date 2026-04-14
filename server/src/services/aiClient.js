import fs from 'fs';

function getApiKey() {
  return process.env.GEMINI_API_KEY || null;
}

export async function aiOcrFile(filePath, mimeType, originalName = '') {
  try {
    const key = getApiKey();
    
    if (!key) {
      console.warn("GEMINI_API_KEY missing. Using Smart Mock OCR.");
      const name = originalName.toLowerCase();
      if (name.includes("bone") || name.includes("fracture") || name.includes("xray") || name.includes("chest") || name.includes("arm") || name.includes("leg")) {
        return { text: "Radiology Report\nModality: X-Ray\nFindings: There is a visible hairline fracture in the mid-shaft of the radius. No displacement observed. Surrounding soft tissue appears swollen. Impression: Undisplaced radial shaft fracture." };
      }
      return { text: "Test: Complete Blood Count\nHemoglobin: 11.2 g/dL (Reference: 13.0-17.0)\nWBC: 6.5 x10^3/uL\nRBC: 4.8 x10^6/uL\nPlatelets: 200 x10^3/uL\nImpression: Mild anemia." };
    }

    const base64Data = fs.readFileSync(filePath).toString('base64');
    const safeMimeType = mimeType || 'application/pdf';
    
    const payload = {
      contents: [{
        parts: [
          { text: "Extract all clinical text, test names, results, and reference ranges from this medical report. Return only the raw text." },
          { 
            inlineData: {
              mimeType: safeMimeType,
              data: base64Data
            }
          }
        ]
      }]
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));

    const text = body.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text };
  } catch (e) {
    console.error("aiOcrFile failed:", e.message);
    throw e;
  }
}

export async function aiAnalyzeText(text) {
  try {
    const key = getApiKey();
    
    if (!key) {
      console.warn("GEMINI_API_KEY missing. Using Smart Mock Analysis.");
      const lower = text.toLowerCase();
      if (lower.includes("fracture") || lower.includes("radiology")) {
        return {
          summary: "The X-Ray report indicates an undisplaced hairline fracture in the radial limb with associated soft tissue swelling.",
          structured: [
            { parameter: "Fracture Type", value: "Hairline", unit: "-", range: "-", status: "abnormal" },
            { parameter: "Location", value: "Mid-shaft radius", unit: "-", range: "-", status: "abnormal" }
          ],
          risk_flags: ["Hairline fracture detected - Orthopedic consultation required immediately"]
        };
      }
      return {
        summary: "Your report indicates slightly low Hemoglobin, suggesting mild anemia. Other blood parameters like WBC and Platelets appear normal.",
        structured: [
          { parameter: "Hemoglobin", value: "11.2", unit: "g/dL", range: "13.0-17.0", status: "low" },
          { parameter: "WBC", value: "6.5", unit: "10^3/uL", range: "4.0-11.0", status: "normal" }
        ],
        risk_flags: ["Low Hemoglobin (11.2) - Mild Anemia Possible"]
      };
    }

    const prompt = `
You are a medical AI assistant.
Analyze the following blood test or lab report text.
Return ONLY a JSON object with this exact structure (no markdown, no backticks, just valid JSON):
{
  "summary": "A 1-2 sentence high-level summary of the patient's health based on the results.",
  "structured": [
    { "parameter": "Hemoglobin", "value": "11.2", "unit": "g/dL", "range": "12.0 - 15.5", "status": "low" }
  ],
  "risk_flags": ["Low hemoglobin indicates anemia"]
}

If no data is present or valid, return empty structured and risk arrays.
Text:
${text}
`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));

    const responseText = body.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    return JSON.parse(responseText.replace(/```json\n|```/g, ''));
  } catch (e) {
    console.error("aiAnalyzeText failed:", e.message);
    throw e;
  }
}

export async function aiChat(message, context) {
  try {
    const key = getApiKey();
    
    if (!key) {
      console.warn("GEMINI_API_KEY missing. Using Smart Mock Chat.");
      const msg = message.toLowerCase();
      
      // Multilingual & Contextual Detection
      const isTelugu = msg.includes('ela') || msg.includes('cheppu') || msg.includes('endi') || msg.includes('undali') || msg.includes('kadu') || msg.includes('bagunda') || msg.includes('enti');
      const isHindi = msg.includes('kya') || msg.includes('hai') || msg.includes('nahi') || msg.includes('kaise') || msg.includes('karo');
      
      const isTip = msg.includes("tip") || msg.includes("how") || msg.includes("tips") || msg.includes("jagratha");
      const isDiet = msg.includes("diet") || msg.includes("food") || msg.includes("eat") || msg.includes("thinali") || msg.includes("khao");
      const isFracture = context && context.toLowerCase().includes("fracture");

      let reply = "";
      let disclaimer = "";

      if (isTelugu) {
        disclaimer = "Idi hackathon demo AI mathrame. Antha safe gane handle chesthunna project! Doctor ni tappakunda kalavandi.";
        if (isFracture) {
           reply = "Mee X-Ray report lo chinna hairline fracture (bone daggara) undi andi. Kangarupadakandi, kani ventane oka Orthopedic doctor ni kalisi treatment theesukondi.";
           if (isDiet || isTip) reply += " Calcium and Vitamin-D unna food (Paalu, Gudlu) theesukunte bone twaraga atthukuntundi. Cheyyi ni ekkuva kadapakandi.";
        } else {
           reply = "Mee blood report lo Hemoglobin (11.2) thakkuva ga undi, idi mild anemia ni soochisthundi. Doctor ni kalavadam manchidi.";
           if (isDiet) reply = "Hemoglobin penchukodaniki Aaku kooralu (Spinach), Dates, and Iron-rich food theesukondi andi.";
           else if (isTip) reply = "Baga rest theesukondi, neellu baaga thagandi, amina doubts unte doctor ni adagandi.";
        }
      } else if (isHindi) {
        disclaimer = "Yeh AI sirf ek hackathon demo hai. Kripaya apne doctor se sampark karein.";
        if (isFracture) {
           reply = "Aapke X-Ray report mein ek chota hairline fracture dikh raha hai. Ghabrayein nahi, par jald hi Orthopedic doctor se miliye.";
           if (isDiet || isTip) reply += " Calcium aur Vitamin-D wali cheezein (Doodh, Ande) khayein. Apne limb ko aaram dein.";
        } else {
           reply = "Aapke blood report mein Hemoglobin (11.2) thoda kam hai, jo mild anemia ho sakta hai.";
           if (isDiet) reply = "Hemoglobin badhane ke liye Palak, Khajoor, aur Iron-rich khana shuru karein.";
           else if (isTip) reply = "Aaram karein aur swasth aahar lein. Kuch problem ho toh doctor se baat karein.";
        }
      } else {
        disclaimer = "This AI provides demo insights only based on your low hemoglobin or fractures context. Safely handled demo!.";
        if (isFracture) {
           reply = "I see an undisplaced hairline fracture in your report. You should immediately consult an Orthopedic specialist.";
           if (isDiet || isTip) reply += " Ensure you consume enough Calcium and Vitamin D. Keep the fractured area immobilized.";
        } else {
           reply = "Your hemoglobin level (11.2) is slightly below the reference range. I'd recommend discussing this with your physician during your next visit.";
           if (isDiet) reply = "To improve hemoglobin, try increasing iron-rich foods like spinach, red meat, lentils, and fortified cereals. Combining them with Vitamin C helps absorption!";
           else if (isTip) reply = "Getting enough rest, staying hydrated, and eating a balanced diet rich in iron and vitamin B12 can help maintain healthy blood levels.";
        }
      }
      
      return { reply, disclaimer };
    }

    const prompt = `
You are a helpful, professional health assistant AI. 
Keep your answers brief, empathetic, and informative. 
Context from patient's latest report: ${context || 'None provided'}
Patient message: ${message}
`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(body));

    const text = body.candidates?.[0]?.content?.parts?.[0]?.text || 'I could not process your request.';
    return { 
      reply: text,
      disclaimer: "This AI assistant provides general information based on your reports. Always consult your verified physical doctor.",
    };
  } catch(e) {
    console.error("aiChat failed:", e.message);
    throw e;
  }
}
