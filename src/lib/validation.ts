import * as z from "zod";

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, "الاسم مطلوب").max(60, "الاسم طويل جداً"),
  email: z.union([z.email("بريد إلكتروني غير صحيح"), z.literal("")]).optional(),
  agreedToRules: z.literal(true, { error: "يجب الموافقة على القوانين" }),
});

export const recoverSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  email: z.email("بريد إلكتروني غير صحيح"),
});

// Empty/whitespace-only free-text guesses collapse to null so "no guess" is stored consistently.
const optionalName = z
  .string()
  .trim()
  .max(80, "الاسم طويل جداً")
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

export const predictionSchema = z.object({
  matchId: z.string().min(1),
  predHomeScore: z.number().int().min(0).max(99),
  predAwayScore: z.number().int().min(0).max(99),
  predBestPlayerName: optionalName,
  predFirstScorerName: optionalName,
});

export const chatMessageSchema = z.object({
  body: z.string().trim().min(1, "الرسالة فارغة").max(500, "الرسالة طويلة جداً"),
});
