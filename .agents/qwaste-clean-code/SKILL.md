---
name: qwaste-clean-code
description: Use when implementing, reviewing, or refactoring Qwaste v2 Next.js code, especially endpoint, service, page, CRUD, dashboard, monitoring, permission, navigation, i18n, form, table, React component, or App Router work. Applies Qwaste's local architecture plus React/Next.js performance practices.
---

# Qwaste Clean Code

Use this skill to make agent output fit the Qwaste v2 codebase instead of generic React/Next.js code.

## Required Context

Before editing Qwaste code, read the detailed project guide:

```text
QWASTE_CLEAN_CODE_AGENT_SKILL.md
```

If the task involves writing or refactoring TypeScript implementation code, API calls, submit handlers, store actions, hooks, loading, or error handling, also read:

```text
CODE_STYLE_ASYNC_ERROR.md
```

If the task touches Redux, TanStack Query, server-state caching, shared state, or custom hooks, also read:

```text
STATE_QUERY_HOOKS.md
```

If the task touches React components, Next.js pages, data fetching, bundle size, re-render behavior, hydration, or performance, also read:

```text
REACT_NEXT_PERFORMANCE.md
```

That file contains the working rules for:

- endpoint constants in `src/services/endpoints.ts`
- domain types in `src/types`
- domain services in `src/services`
- CRUD pages under `src/app/(dashboard)`
- dashboard and monitoring pages
- table columns and form config files
- permission, route access, navigation, and i18n
- React and Next.js performance practices
- review checklist and validation rules
- async/await, `try/catch/finally`, no `.then().catch()`, and layer-specific error handling from `CODE_STYLE_ASYNC_ERROR.md`
- Redux Toolkit, TanStack Query, and custom hook conventions when `STATE_QUERY_HOOKS.md` is relevant
- Vercel-style React/Next.js performance rules when `REACT_NEXT_PERFORMANCE.md` is relevant

## Core Rules

- Keep API flow as `Page/Component -> DomainService -> NetworkService -> apiClient -> /api/bff -> backend`.
- Do not call `axios`, `apiClient`, backend URLs, or `/api/bff` directly from page/component.
- Add backend paths to `ENDPOINTS`; keep endpoint values as backend paths like `/api/machines/v1`.
- Keep service methods static, typed, UI-free, and usually without `try/catch`.
- Let page/hook/store handle loading, toast, modal, navigation, permission checks, and error display.
- Prefer alias imports `@/...` over deep relative imports.
- Keep page-owned components in the route `_components` folder unless reused across multiple modules.
- Apply React/Next.js best practices from the detailed guide when writing or refactoring UI.
- Do not add new Zustand stores for Qwaste modules; prefer local state, Redux Toolkit, or TanStack Query based on the data ownership.
- Use `async/await` with `try/catch/finally` for API flows; do not introduce `.then().catch()` chains in new code.
