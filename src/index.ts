#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { YandexTrackerClient } from "./client.js";
import {
  GetIssueArgsSchema,
  UpdateIssueArgsSchema,
  AddWorklogArgsSchema,
  GetWorklogsArgsSchema,
  SearchIssuesArgsSchema,
} from "./schemas.js";

// Environment variables
const API_TOKEN = process.env.YANDEX_TRACKER_TOKEN;
const ORG_ID = process.env.YANDEX_TRACKER_ORG_ID;
const IAM_TOKEN = process.env.YANDEX_TRACKER_IAM_TOKEN;
const CLOUD_ORG_ID = process.env.YANDEX_TRACKER_CLOUD_ORG_ID;

if (!API_TOKEN && !IAM_TOKEN) {
  console.error(
    "Error: YANDEX_TRACKER_TOKEN or YANDEX_TRACKER_IAM_TOKEN must be set",
    { stdio: "inherit" }
  );
  process.exit(1);
}

if (!ORG_ID && !CLOUD_ORG_ID) {
  console.error(
    "Error: YANDEX_TRACKER_ORG_ID or YANDEX_TRACKER_CLOUD_ORG_ID must be set",
    { stdio: "inherit" }
  );
  process.exit(1);
}

// Initialize Yandex Tracker client
const client = new YandexTrackerClient({
  token: API_TOKEN,
  iamToken: IAM_TOKEN,
  orgId: ORG_ID,
  cloudOrgId: CLOUD_ORG_ID,
});

// Initialize MCP server
const server = new Server(
  {
    name: "yandex-tracker-mcp-server",
    version: "1.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: "yandex_tracker_get_issue",
    description:
      "Get detailed information about a specific issue by its key (e.g., MYQUEUE-123). Returns issue data including status, assignee, description, estimates, and more.",
    inputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: "Issue key (e.g., MYQUEUE-123)",
        },
        response_format: {
          type: "string",
          enum: ["json", "markdown"],
          description: "Response format: 'json' for structured data or 'markdown' for human-readable format",
          default: "markdown",
        },
      },
      required: ["issue_key"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "yandex_tracker_update_issue",
    description:
      "Update an existing issue. Can modify fields like summary, description, status, assignee, estimates (originalEstimation, estimation), spent time, priority, and more. Use ISO 8601 duration format for time fields (e.g., 'PT8H' for 8 hours, 'P1D' for 1 day, 'P1W' for 1 week).",
    inputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: "Issue key (e.g., MYQUEUE-123)",
        },
        summary: {
          type: "string",
          description: "Issue summary/title",
        },
        description: {
          type: "string",
          description: "Issue description",
        },
        status: {
          type: "string",
          description: "Status key or name (e.g., 'open', 'inProgress', 'closed')",
        },
        assignee: {
          type: "string",
          description: "Assignee login or ID",
        },
        originalEstimation: {
          type: "string",
          description: "Original time estimate in ISO 8601 duration format (e.g., 'PT8H', 'P1D', 'P1W')",
        },
        estimation: {
          type: "string",
          description: "Remaining time estimate in ISO 8601 duration format (e.g., 'PT4H', 'P2D')",
        },
        spent: {
          type: "string",
          description: "Time spent in ISO 8601 duration format (e.g., 'PT2H')",
        },
        priority: {
          type: "string",
          description: "Priority key or name (e.g., 'minor', 'normal', 'critical')",
        },
        type: {
          type: "string",
          description: "Issue type key or name (e.g., 'task', 'bug', 'improvement')",
        },
      },
      required: ["issue_key"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "yandex_tracker_add_worklog",
    description:
      "Add a time tracking record (worklog) to an issue. Records how much time was spent working on the issue. Duration is in ISO 8601 format (e.g., 'PT2H30M' for 2 hours 30 minutes, 'PT8H' for 8 hours). Note: Yandex Tracker uses business weeks (5 days) and business days (8 hours).",
    inputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: "Issue key (e.g., MYQUEUE-123)",
        },
        duration: {
          type: "string",
          description: "Time spent in ISO 8601 duration format (e.g., 'PT2H', 'PT30M', 'P1D')",
        },
        start: {
          type: "string",
          description: "Start date and time in ISO 8601 format (e.g., '2024-01-15T10:00:00+03:00'). If not specified, current time is used.",
        },
        comment: {
          type: "string",
          description: "Optional comment describing the work done",
        },
      },
      required: ["issue_key", "duration"],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  {
    name: "yandex_tracker_get_worklogs",
    description:
      "Get all time tracking records (worklogs) for a specific issue. Returns a list of all logged time entries with duration, start time, author, and comments.",
    inputSchema: {
      type: "object",
      properties: {
        issue_key: {
          type: "string",
          description: "Issue key (e.g., MYQUEUE-123)",
        },
        response_format: {
          type: "string",
          enum: ["json", "markdown"],
          description: "Response format: 'json' for structured data or 'markdown' for human-readable format",
          default: "markdown",
        },
      },
      required: ["issue_key"],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  {
    name: "yandex_tracker_search_issues",
    description:
      "Search for issues using Yandex Tracker query language. Supports filters like queue, assignee, status, etc. Returns a list of matching issues with pagination support.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query in Yandex Tracker query language (e.g., 'Queue: MYQUEUE Assignee: me() Status: open')",
        },
        filter: {
          type: "object",
          description: "Alternative to query: filter as object (e.g., {queue: 'MYQUEUE', assignee: 'user123'})",
        },
        order: {
          type: "array",
          items: { type: "string" },
          description: "Sort order (e.g., ['updated', '-status', '+priority']). Prefix with '-' for descending, '+' for ascending",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 20, max: 100)",
          default: 20,
        },
        offset: {
          type: "number",
          description: "Offset for pagination (default: 0)",
          default: 0,
        },
        response_format: {
          type: "string",
          enum: ["json", "markdown"],
          description: "Response format: 'json' for structured data or 'markdown' for human-readable format",
          default: "markdown",
        },
      },
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
];

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "yandex_tracker_get_issue": {
        const parsed = GetIssueArgsSchema.parse(args);
        const issue = await client.getIssue(parsed.issue_key);
        const format = parsed.response_format || "markdown";

        if (format === "json") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(issue, null, 2),
              },
            ],
          };
        } else {
          const markdown = formatIssueAsMarkdown(issue);
          return {
            content: [
              {
                type: "text",
                text: markdown,
              },
            ],
          };
        }
      }

      case "yandex_tracker_update_issue": {
        const parsed = UpdateIssueArgsSchema.parse(args);
        const { issue_key, ...updates } = parsed;
        const updatedIssue = await client.updateIssue(issue_key, updates);

        return {
          content: [
            {
              type: "text",
              text: `✓ Issue ${issue_key} updated successfully\n\n${formatIssueAsMarkdown(updatedIssue)}`,
            },
          ],
        };
      }

      case "yandex_tracker_add_worklog": {
        const parsed = AddWorklogArgsSchema.parse(args);
        const { issue_key, ...worklogData } = parsed;
        const worklog = await client.addWorklog(issue_key, worklogData);

        return {
          content: [
            {
              type: "text",
              text: `✓ Worklog added to ${issue_key}\n\nDuration: ${worklog.duration}\nStart: ${worklog.start}${worklog.comment ? `\nComment: ${worklog.comment}` : ""}`,
            },
          ],
        };
      }

      case "yandex_tracker_get_worklogs": {
        const parsed = GetWorklogsArgsSchema.parse(args);
        const worklogs = await client.getWorklogs(parsed.issue_key);
        const format = parsed.response_format || "markdown";

        if (format === "json") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(worklogs, null, 2),
              },
            ],
          };
        } else {
          const markdown = formatWorklogsAsMarkdown(worklogs);
          return {
            content: [
              {
                type: "text",
                text: markdown,
              },
            ],
          };
        }
      }

      case "yandex_tracker_search_issues": {
        const parsed = SearchIssuesArgsSchema.parse(args);
        const result = await client.searchIssues(parsed);
        const format = parsed.response_format || "markdown";

        if (format === "json") {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } else {
          const markdown = formatSearchResultsAsMarkdown(result);
          return {
            content: [
              {
                type: "text",
                text: markdown,
              },
            ],
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Formatting helpers
function formatIssueAsMarkdown(issue: any): string {
  let md = `# ${issue.key}: ${issue.summary}\n\n`;
  md += `**Status:** ${issue.status?.display || issue.status?.key || "N/A"}\n`;
  md += `**Type:** ${issue.type?.display || issue.type?.key || "N/A"}\n`;
  md += `**Priority:** ${issue.priority?.display || issue.priority?.key || "N/A"}\n`;
  md += `**Assignee:** ${issue.assignee?.display || "Unassigned"}\n`;
  md += `**Created:** ${issue.createdAt || "N/A"}\n`;
  md += `**Updated:** ${issue.updatedAt || "N/A"}\n\n`;

  if (issue.originalEstimation) {
    md += `**Original Estimate:** ${issue.originalEstimation}\n`;
  }
  if (issue.estimation) {
    md += `**Remaining Estimate:** ${issue.estimation}\n`;
  }
  if (issue.spent) {
    md += `**Time Spent:** ${issue.spent}\n`;
  }

  if (issue.description) {
    md += `\n## Description\n\n${issue.description}\n`;
  }

  return md;
}

function formatWorklogsAsMarkdown(worklogs: any[]): string {
  if (!worklogs || worklogs.length === 0) {
    return "No worklog entries found.";
  }

  let md = `# Worklog Entries (${worklogs.length})\n\n`;

  for (const log of worklogs) {
    md += `## ${log.createdBy?.display || "Unknown"}\n`;
    md += `**Duration:** ${log.duration}\n`;
    md += `**Start:** ${log.start}\n`;
    md += `**Created:** ${log.createdAt}\n`;
    if (log.comment) {
      md += `**Comment:** ${log.comment}\n`;
    }
    md += `\n`;
  }

  return md;
}

function formatSearchResultsAsMarkdown(result: any): string {
  const { issues, total, count, offset } = result;

  if (!issues || issues.length === 0) {
    return "No issues found.";
  }

  let md = `# Search Results\n\n`;
  md += `Found ${total} issues (showing ${count} from offset ${offset})\n\n`;

  for (const issue of issues) {
    md += `## ${issue.key}: ${issue.summary}\n`;
    md += `**Status:** ${issue.status?.display || "N/A"} | `;
    md += `**Priority:** ${issue.priority?.display || "N/A"} | `;
    md += `**Assignee:** ${issue.assignee?.display || "Unassigned"}\n`;
    md += `**Updated:** ${issue.updatedAt}\n\n`;
  }

  if (offset + count < total) {
    md += `\n---\n*Use offset=${offset + count} to see more results*\n`;
  }

  return md;
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Yandex Tracker MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
