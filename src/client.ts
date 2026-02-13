/**
 * Yandex Tracker API Client
 *
 * Provides methods to interact with Yandex Tracker API v2
 * API Documentation: https://yandex.ru/support/tracker/ru/concepts/access
 */

const API_BASE_URL = "https://api.tracker.yandex.net/v2";

interface YandexTrackerConfig {
  token?: string;
  iamToken?: string;
  orgId?: string;
  cloudOrgId?: string;
}

export class YandexTrackerClient {
  private readonly authHeader: string;
  private readonly orgIdHeaderName: string;
  private readonly orgIdHeaderValue: string;

  constructor(config: YandexTrackerConfig) {
    // Determine authentication method
    if (config.iamToken) {
      this.authHeader = `Bearer ${config.iamToken}`;
    } else if (config.token) {
      this.authHeader = `OAuth ${config.token}`;
    } else {
      throw new Error("Either token or iamToken must be provided");
    }

    // Determine organization ID and header
    // Priority: cloudOrgId > orgId (Cloud Org ID works with both OAuth and IAM)
    if (config.cloudOrgId) {
      this.orgIdHeaderName = "X-Cloud-Org-Id";
      this.orgIdHeaderValue = config.cloudOrgId;
    } else if (config.orgId) {
      this.orgIdHeaderName = "X-Org-Id";
      this.orgIdHeaderValue = config.orgId;
    } else {
      throw new Error("Either orgId or cloudOrgId must be provided");
    }
  }

  /**
   * Make an authenticated request to Yandex Tracker API
   */
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      Authorization: this.authHeader,
      [this.orgIdHeaderName]: this.orgIdHeaderValue,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.errorMessages) {
          errorMessage += `\nDetails: ${errorData.errorMessages.join(", ")}`;
        } else if (errorData.errors) {
          errorMessage += `\nErrors: ${JSON.stringify(errorData.errors)}`;
        }
      } catch {
        // If parsing error response fails, use default message
      }
      throw new Error(errorMessage);
    }

    // Handle empty responses (e.g., 204 No Content)
    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  /**
   * Get issue by key
   * GET /v2/issues/{issueKey}
   */
  async getIssue(issueKey: string): Promise<any> {
    return this.request(`/issues/${issueKey}`);
  }

  /**
   * Update issue
   * PATCH /v2/issues/{issueKey}
   */
  async updateIssue(issueKey: string, updates: Record<string, any>): Promise<any> {
    // Transform simple values to Yandex Tracker format
    const body: Record<string, any> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;

      // Fields that need object format
      if (["status", "type", "priority"].includes(key)) {
        body[key] = { key: value };
      }
      // Assignee can be string (login) or object
      else if (key === "assignee") {
        body[key] = typeof value === "string" ? value : value;
      }
      // Direct fields
      else {
        body[key] = value;
      }
    }

    return this.request(`/issues/${issueKey}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  /**
   * Add worklog (time spent) to issue
   * POST /v2/issues/{issueKey}/worklog
   */
  async addWorklog(
    issueKey: string,
    worklog: {
      duration: string;
      start?: string;
      comment?: string;
    }
  ): Promise<any> {
    const body: Record<string, any> = {
      duration: worklog.duration,
    };

    if (worklog.start) {
      body.start = worklog.start;
    }

    if (worklog.comment) {
      body.comment = worklog.comment;
    }

    return this.request(`/issues/${issueKey}/worklog`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Get worklogs for issue
   * GET /v2/issues/{issueKey}/worklog
   */
  async getWorklogs(issueKey: string): Promise<any[]> {
    return this.request(`/issues/${issueKey}/worklog`);
  }

  /**
   * Search issues
   * POST /v2/issues/_search
   */
  async searchIssues(params: {
    query?: string;
    filter?: Record<string, any>;
    order?: string[];
    limit?: number;
    offset?: number;
  }): Promise<{
    issues: any[];
    total: number;
    count: number;
    offset: number;
  }> {
    const body: Record<string, any> = {};

    if (params.query) {
      body.query = params.query;
    }

    if (params.filter) {
      body.filter = params.filter;
    }

    if (params.order) {
      body.order = params.order;
    }

    // Add pagination parameters as query params
    const queryParams = new URLSearchParams();
    const perPage = params.limit || 20;
    const page = Math.floor((params.offset || 0) / perPage) + 1;

    queryParams.append("perPage", perPage.toString());
    queryParams.append("page", page.toString());

    const endpoint = `/issues/_search?${queryParams.toString()}`;
    const issues = await this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });

    return {
      issues: Array.isArray(issues) ? issues : [],
      total: issues.length, // Note: Yandex Tracker doesn't return total count in all cases
      count: issues.length,
      offset: params.offset || 0,
    };
  }
}
