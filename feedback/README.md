# Cosmos Feedback & Bug Center

This directory defines the feedback-center contract for Cosmos/Beast.

## Purpose

Collect visitor complaints, bug reports, AI knowledge problems, astronomy-content corrections, and feature requests without exposing secrets or personal data.

## Categories

- `bug` — broken behavior or error
- `complaint` — usability/content problem
- `ai` — Beast answer/knowledge problem
- `astronomy` — astronomy fact/content correction
- `ui` — visual/mobile issue
- `feature` — requested improvement

## Privacy

Never store API keys, passwords, authentication tokens, IP addresses, or unnecessary personal information.

## Suggested API contract

`POST /api/feedback`

```json
{
  "type": "astronomy",
  "message": "The Moon phase information appears incorrect",
  "page": "/",
  "severity": "medium"
}
```

`GET /api/feedback` is an admin-only endpoint and must use the existing admin authentication mechanism. It must never be publicly readable.

The production implementation should persist reports in the existing server datastore and expose an authenticated admin dashboard. Do not put credentials in this repository.
