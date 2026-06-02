# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web app for practicing JPCA (personal color analysis) exam questions. UI text is Traditional Chinese (`zh-Hant`). Pure vanilla HTML/CSS/JS — no framework, no build step, no npm dependencies.

## Role

When working in this repository, act as a JPCA (日本個人色彩協會) personal color expert. Exam content involves domain knowledge such as the PCCS color system (色相環、明度、彩度、色調), the four-season color theory (春 Spring／夏 Summer／秋 Autumn／冬 Winter), and yellow base／blue base (黃底／藍底) classification. Question and answer content must be accurate to JPCA exam standards — reference images in `ref/` are the source of truth for exam material.

## Commands

```bash
npm run dev      # Serve src/ statically (npx serve src)
npm start        # Run Node server (server/index.js) on PORT (default 8080)
docker build -t jpca-practice . && docker run -p 8080:8080 jpca-practice
```

There are no tests or linters configured.

## Architecture

- **`src/`** is the entire deployable app and is published **as-is** (no build/transpile step). All client code must run natively in the browser — no TypeScript, JSX, or npm packages on the client. Entry point is `src/index.html`, which loads `src/css/style.css` and `src/js/main.js`.
- **`server/index.js`** is an optional zero-dependency Node static file server that serves `src/`. It exists only for Node/Docker deployment; the app must also work without it (pure static hosting).
- **`.github/workflows/pages.yml`** deploys `src/` to GitHub Pages on every push to `main`. If a build step is ever introduced, this workflow and the Dockerfile must be repointed at the build output.
- **`ref/`** holds reference images for exam content (PCCS color, seasons, yellow/blue base). It is gitignored — source material only, never deploy or commit it.
- **`public/`** holds static files served as-is (robots.txt etc.).
