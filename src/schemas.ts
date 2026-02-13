import { z } from "zod";

// Get issue schema
export const GetIssueArgsSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g., MYQUEUE-123)"),
  response_format: z
    .enum(["json", "markdown"])
    .optional()
    .default("markdown")
    .describe("Response format"),
});

export type GetIssueArgs = z.infer<typeof GetIssueArgsSchema>;

// Update issue schema
export const UpdateIssueArgsSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g., MYQUEUE-123)"),
  summary: z.string().optional().describe("Issue summary/title"),
  description: z.string().optional().describe("Issue description"),
  status: z.string().optional().describe("Status key or name"),
  assignee: z.string().optional().describe("Assignee login or ID"),
  originalEstimation: z
    .string()
    .optional()
    .describe("Original time estimate in ISO 8601 duration format"),
  estimation: z
    .string()
    .optional()
    .describe("Remaining time estimate in ISO 8601 duration format"),
  spent: z
    .string()
    .optional()
    .describe("Time spent in ISO 8601 duration format"),
  priority: z.string().optional().describe("Priority key or name"),
  type: z.string().optional().describe("Issue type key or name"),
});

export type UpdateIssueArgs = z.infer<typeof UpdateIssueArgsSchema>;

// Add worklog schema
export const AddWorklogArgsSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g., MYQUEUE-123)"),
  duration: z
    .string()
    .describe("Time spent in ISO 8601 duration format (e.g., 'PT2H', 'P1D')"),
  start: z
    .string()
    .optional()
    .describe("Start date and time in ISO 8601 format"),
  comment: z.string().optional().describe("Optional comment"),
});

export type AddWorklogArgs = z.infer<typeof AddWorklogArgsSchema>;

// Get worklogs schema
export const GetWorklogsArgsSchema = z.object({
  issue_key: z.string().describe("Issue key (e.g., MYQUEUE-123)"),
  response_format: z
    .enum(["json", "markdown"])
    .optional()
    .default("markdown")
    .describe("Response format"),
});

export type GetWorklogsArgs = z.infer<typeof GetWorklogsArgsSchema>;

// Search issues schema
export const SearchIssuesArgsSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("Search query in Yandex Tracker query language"),
  filter: z
    .record(z.any())
    .optional()
    .describe("Filter as object"),
  order: z
    .array(z.string())
    .optional()
    .describe("Sort order"),
  limit: z
    .number()
    .optional()
    .default(20)
    .describe("Maximum number of results"),
  offset: z
    .number()
    .optional()
    .default(0)
    .describe("Offset for pagination"),
  response_format: z
    .enum(["json", "markdown"])
    .optional()
    .default("markdown")
    .describe("Response format"),
});

export type SearchIssuesArgs = z.infer<typeof SearchIssuesArgsSchema>;
