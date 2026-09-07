import { z } from "zod";

// ---- Objective filters (structured, applied locally against profiles.json) ----
export const FiltersSchema = z.object({
  skills_any: z.array(z.string()).default([]),
  skills_all: z.array(z.string()).default([]),
  min_years_experience: z.number().nullable().default(null),
  max_years_experience: z.number().nullable().default(null),
  locations: z.array(z.string()).default([]),
  company_types: z
    .array(z.enum(["startup", "scaleup", "enterprise", "agency"]))
    .default([]),
  notes: z
    .string()
    .default("")
    .describe("Short human-readable summary of what these filters mean"),
});
export type Filters = z.infer<typeof FiltersSchema>;

// ---- Subjective fit rubric ----
export const RubricCriterionSchema = z.object({
  label: z.string(),
  description: z.string(),
  weight: z.number().min(1).max(5),
});
export const RubricSchema = z.object({
  summary: z.string().describe("One-line description of what 'a great fit' looks like"),
  criteria: z.array(RubricCriterionSchema).min(1).max(6),
});
export type Rubric = z.infer<typeof RubricSchema>;

// ---- LLM: query -> filters + rubric ----
export const GenerateResultSchema = z.object({
  filters: FiltersSchema,
  rubric: RubricSchema,
});
export type GenerateResult = z.infer<typeof GenerateResultSchema>;

// ---- LLM: score a batch of profiles against the rubric ----
export const ProfileScoreSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(100),
  explanation: z
    .string()
    .describe("Short explanation citing specific fields from this profile"),
});
export const ScoreBatchSchema = z.object({
  scores: z.array(ProfileScoreSchema),
});
export type ProfileScore = z.infer<typeof ProfileScoreSchema>;

// ---- LLM: refine filters + rubric from recruiter feedback ----
export const RefineResultSchema = z.object({
  filters: FiltersSchema,
  rubric: RubricSchema,
  change_summary: z
    .string()
    .describe("1-3 sentences, plain language, telling the recruiter what changed and why"),
});
export type RefineResult = z.infer<typeof RefineResultSchema>;

// ---- Profile shape (from data/profiles.json) ----
export const PastCompanySchema = z.object({
  company: z.string(),
  company_type: z.enum(["startup", "scaleup", "enterprise", "agency"]),
  title: z.string(),
  years: z.number(),
});
export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  current_title: z.string(),
  years_experience: z.number(),
  location: z.string(),
  current_company: z.string(),
  current_company_type: z.enum(["startup", "scaleup", "enterprise", "agency"]),
  skills: z.array(z.string()),
  past_companies: z.array(PastCompanySchema),
  education: z.string(),
  summary: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;
