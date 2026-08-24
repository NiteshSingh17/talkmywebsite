# Contributing to TalkMyWebsite

Thank you for your interest in contributing! This guide explains how to get set up, what conventions to follow, and how to get your changes merged.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Commit Conventions](#commit-conventions)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Code Style](#code-style)
- [Testing](#testing)
- [License](#license)

---

## Code of Conduct

By participating in this project, you agree to be respectful and constructive in all interactions. Harassment or exclusionary behaviour of any kind will not be tolerated.

---

## Getting Started

### Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 20.x |
| npm | 10.x |
| Chrome | 120+ (for testing the extension) |

### Fork & Clone

```bash
git clone https://github.com/<your-username>/talkmywebsite.git
cd talkmywebsite
```

### Install Dependencies

```bash
# API
cd api && npm install && cd ..

# Extension
cd newExtension && npm install && cd ..
```

### Environment Setup

**API:**
```bash
cd api
cp .env.example .env
# Edit PORT and SCRAPE_TIMEOUT_MS if needed
```

**Extension:**
```bash
cd newExtension
cp .env.example .env
# Set VITE_API_PUBLIC_URL and VITE_WS_URL
```

### Start the Development Servers

```bash
# Terminal 1 — API (watch mode)
cd api && npm run start:dev

# Terminal 2 — Extension (watch mode)
cd newExtension && npm run dev:chrome
```

Load the extension in Chrome: `chrome://extensions` → **Developer mode** → **Load unpacked** → select `newExtension/dist_chrome/`.

---

## Project Structure

```
webchat/
  api/              NestJS scrape API + WebSocket gateway
  newExtension/     TalkMyWebsite Chrome extension (Vite + MV3)
  CONTRIBUTING.md   This file
  LICENSE           MIT License
  README.md         Project overview
```

See the individual `README.md` files in each sub-package for deeper details.

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** — keep commits focused and atomic.

3. **Run tests** before opening a PR:
   ```bash
   # API
   cd api && npm run test && npm run test:e2e

   # Extension (lint)
   cd newExtension && npm run lint
   ```

4. **Push and open a Pull Request** against `main`.

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace — no logic change |
| `refactor` | Code change that is neither a fix nor a feature |
| `test` | Adding or updating tests |
| `chore` | Build scripts, deps, tooling |
| `perf` | Performance improvements |

### Scopes

Use the sub-package name: `api`, `ext`, `docs`, `ci`.

**Examples:**
```
feat(ext): add keyboard shortcut for sidebar toggle
fix(api): handle missing roomId on WS disconnect
docs: update API README with endpoint table
chore(api): bump @nestjs/core to v11
```

---

## Pull Request Process

1. **Title** — follow the commit convention format.
2. **Description** — explain *what* changed and *why*. Link any related issue with `Closes #<number>`.
3. **Checklist** (copy into your PR description):

```markdown
- [ ] Tests pass locally (`npm run test`)
- [ ] Lint passes (`npm run lint`)
- [ ] I have updated documentation if needed
- [ ] I have added/updated tests for my changes
- [ ] My branch is up to date with `main`
```

4. Request a review from a maintainer.
5. Address review feedback with follow-up commits (no force-push after review starts).
6. A maintainer will squash-merge once approved.

---

## Reporting Bugs

Open a [GitHub Issue](../../issues) and include:

- **Environment**: OS, Chrome version, Node.js version
- **Steps to reproduce** — minimal and specific
- **Expected behaviour**
- **Actual behaviour**
- **Relevant logs** — extension console output, API terminal output, DevTools network tab

---

## Suggesting Features

Open a [GitHub Discussion](../../discussions) or an Issue labelled `enhancement`. Describe:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you considered

For large changes, please discuss before starting implementation to avoid wasted effort.

---

## Code Style

### TypeScript

- **Strict mode** is enabled — no implicit `any`.
- Prefer `const` over `let`; avoid `var`.
- Use `async/await` over raw Promise chains.
- Export types and interfaces at module boundaries.

### Formatting

Both packages use **Prettier** with the project defaults. Run before committing:

```bash
# API
cd api && npm run format

# Extension
cd newExtension && npm run lint
```

### Naming

| Context | Convention |
|---|---|
| Files | `kebab-case.ts` |
| Classes / Interfaces | `PascalCase` |
| Functions / variables | `camelCase` |
| Constants | `UPPER_SNAKE_CASE` |
| Chrome message types | `snake_case` string literals |

---

## Testing

### API

```bash
cd api

# Unit tests
npm run test

# E2E tests (API must be running on :3000)
npm run test:e2e

# Integration — WS + scrape round-trip
npm run test:integration

# Coverage
npm run test:cov
```

### Extension

Manual testing checklist:

- [ ] Popup shows green **Connected**
- [ ] `Alt+Shift+W` opens the ChatGPT sidebar
- [ ] ChatGPT sidebar receives live page content automatically
- [ ] Scrape URL returns HTML (not 401/424/503)
- [ ] Extension works in Incognito mode

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
