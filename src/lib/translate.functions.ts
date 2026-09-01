import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  texts: z.array(z.string().min(1).max(600)).min(1).max(120),
  target: z.enum(["hi"]).default("hi"),
});

export const translateTexts = createServerFn({ method: "POST" })
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { translations: data.texts };

    const prompt = [
      "Translate each string of the JSON array from English to Hindi (Devanagari).",
      "Rules: keep brand/product names (FixNear India, Aadhaar, PAN, GST, WhatsApp) as-is,",
      "keep numbers, symbols, emails and currency untouched, keep the same array length and order,",
      "translate UI labels naturally and concisely.",
      'Respond ONLY with JSON: {"translations": ["..."]}',
      "",
      JSON.stringify(data.texts),
    ].join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a precise UI localisation engine. Output JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Translation failed (${response.status}): ${detail.slice(0, 200)}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "{}";

    let translations: string[] = [];
    try {
      const parsed = JSON.parse(content) as { translations?: unknown };
      if (Array.isArray(parsed.translations)) {
        translations = parsed.translations.map((value, index) =>
          typeof value === "string" && value.trim() ? value : data.texts[index],
        );
      }
    } catch {
      translations = [];
    }

    if (translations.length !== data.texts.length) {
      translations = data.texts;
    }

    return { translations };
  });
