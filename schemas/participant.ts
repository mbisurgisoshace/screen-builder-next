import { z } from "zod";

export const participantFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  role: z.string().optional(),
  contact_info: z.string().optional(),
  rationale: z.string().optional(),
  blocking_issues: z.string().optional(),
  hypothesis_to_validate: z.string().optional(),
  learnings: z.string().optional(),
  market_segment: z.string().optional(),
  scheduled_date: z.date().optional(),
});
