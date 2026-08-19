# Security Policy

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, pull requests, or discussions.**

Instead, report them privately using GitHub's private vulnerability reporting: go to the repository's **Security** tab and choose **Report a vulnerability**. This opens a private advisory visible only to you and the maintainer.

Please include:

- A description of the vulnerability and its impact.
- Steps to reproduce (a proof of concept helps).
- The affected project (PG Hub, onlineChess, PG.Play, blog, etc.) and any relevant URLs.

You can expect an initial acknowledgment, and the maintainer will keep you informed as the issue is investigated and fixed. Please give a reasonable amount of time for a fix before any public disclosure, and act in good faith — do not access or modify data that is not yours, and do not degrade the service for others.

## Scope

The live site and every project in this repository are in scope. Common classes of issue worth reporting: authentication or session flaws, broken access control (Supabase Row-Level Security gaps), injection, exposed secrets or keys, and anything that lets one user read or change another user's data.

## Handling of secrets

Client-side Supabase URL and anon key are public by design. Any **server-only** secret (service-role key, Judge0 token, database password) found committed to the repository is a valid report — it will be rotated immediately.
