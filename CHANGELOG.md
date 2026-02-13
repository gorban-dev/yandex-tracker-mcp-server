# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-02-10

### Fixed
- **Critical:** Fixed 403 "Organization is not available, not ready or not found" error
  - Server now correctly uses `X-Org-Id` header for regular Org IDs
  - Server now correctly uses `X-Cloud-Org-Id` header for Cloud Org IDs
  - Previously used incorrect `X-Org-ID` header (with capital D) for all cases
- **Flexible authentication:** Server now supports any combination of token and org ID:
  - OAuth Token + Regular Org ID
  - OAuth Token + Cloud Org ID
  - IAM Token + Regular Org ID
  - IAM Token + Cloud Org ID

### Changed
- Improved error handling to provide clearer messages about organization configuration
- Enhanced README with troubleshooting section for common 403 errors
- Simplified authentication logic to automatically detect correct header based on org ID format

## [1.0.0] - 2026-02-10

### Added
- Initial release
- Support for OAuth and IAM token authentication
- Tools for managing Yandex Tracker issues:
  - `yandex_tracker_get_issue` - Get issue details
  - `yandex_tracker_update_issue` - Update issue fields
  - `yandex_tracker_add_worklog` - Add time tracking records
  - `yandex_tracker_get_worklogs` - Get time logs
  - `yandex_tracker_search_issues` - Search issues with query language
- Dual response formats (JSON and Markdown)
- Published to npm as `@gor-dev/yandex-tracker-mcp`
