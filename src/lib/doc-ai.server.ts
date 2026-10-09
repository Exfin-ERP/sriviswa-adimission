// Server-only: Lovable AI Gateway call for document extraction + mismatch checks.
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

export const DocAiSchema = z.object({
  document_type_detected: z.string(),
  readable: z.boolean(),
  summary: z.string(),
  extracted: z.array(z.object({ field: z.string(), value: z.string() })),
  checks: z.array(
    z.object({
      field: z.string(),
      document_value: z.string().nullable(),
      application_value: z.string().nullable(),
      result: z.enum(["match", "mismatch", "not_found"]),
      note: z.string(),
    }),
  ),
});
export type DocAiResult = z.infer<typeof DocAiSchema>;

function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function analyzeDocumentImage(opts: {
  bytes: Uint8Array;
  mimeType: string;
  documentName: string;
  applicationFacts: Record<string, string | null>;
}): Promise<DocAiResult> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured (missing LOVABLE_API_KEY)");
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const dataUrl = `data:${opts.mimeType};base64,${toBase64(opts.bytes)}`;
  const result = streamText({
    model: provider.responses(MODEL),
    instructions:
      "You verify Indian school/college admission documents (Aadhaar, TC, marks memo, study certificate, photos, ID proofs). " +
      "Extract key details visible in the document (names, date of birth, ID numbers, school/board, marks, year, father/mother names). " +
      "Then compare each relevant application field against the document. Use 'match' for equivalent values (ignore case, spacing, initials order, date formats), " +
      "'mismatch' when clearly different, 'not_found' when the document does not show it. Only check fields relevant to this document. " +
      "Keep summary under 40 words. Never invent values; if unreadable set readable=false.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Document type expected: ${opts.documentName}\nSaved application data:\n${JSON.stringify(opts.applicationFacts, null, 2)}`,
          },
          { type: "image", image: new URL(dataUrl) },
        ],
      },
    ],
    output: Output.object({ schema: DocAiSchema }),
    providerOptions: {
      openai: {
        store: false,
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        include: ["reasoning.encrypted_content"],
      },
    },
  } as any);
  try {
    return (await result.output) as DocAiResult;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) throw new Error("AI could not read this document. Please verify manually.");
    const status = (e as any)?.statusCode ?? (e as any)?.cause?.statusCode;
    if (status === 402) throw new Error("AI credits exhausted. Please add credits to the workspace.");
    if (status === 429) throw new Error("AI is busy right now. Please try again in a minute.");
    throw e;
  }
}
