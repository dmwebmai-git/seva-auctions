# Seva Auctions - Repository

This repository holds the code for the **Seva Auctions** website ("Bid for a Cause").

## Getting started (moving to your own hosting)

Follow the step-by-step guide **Seva_Auctions_Railway_Migration_Guide.pdf**
(kept alongside this repository / provided separately). It walks you through
moving the site onto Railway + GitHub + Cloudflare R2, in plain English, with
all commands written for Windows PowerShell.

## What is in here

- `app/`, `components/`, `lib/`, `prisma/`, `scripts/`, `public/` - the app code
- `cron/run-settle.js` - the small runner for the scheduled "close auctions" job (Step 8)
- `.env.example` - a template of every environment variable you must set (Step 7)
- `.gitignore` - makes sure secrets (`.env`) and build files are never committed

## Before you push to GitHub

1. Copy `.env.example` to `.env` and fill in your real values (for local runs).
2. Confirm `.env` is listed in `.gitignore` (it is) so it never leaves your PC.
3. Then run the commands in **Step 1** of the migration guide.

## Important notes

- This app targets **Next.js 14** - do not upgrade the framework version.
- The two small storage changes for Cloudflare R2 are described in **Step 6**
  of the guide (in `lib/aws-config.ts` and `lib/s3.ts`).
- Keep `NEXTAUTH_SECRET` identical to your current value, or all users get
  logged out.
