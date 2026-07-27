# TraceRound

TraceRound is a coding interview practice platform built with React, Spring Boot,
PostgreSQL, and a replaceable code-execution provider.

## What is implemented

- Problem catalog with 34 curated algorithm and data-structure problems
- Three server-side test cases and generated starter code for every problem
- Single-problem and custom interview sessions
- Persisted interview messages, source code, submissions, and feedback
- Email/password accounts with BCrypt password hashing
- Database-backed, HttpOnly login sessions and CSRF protection
- Optional Google and GitHub OAuth configuration
- JavaScript, Python, Java, and C++ execution through Docker, Judge0, or JDoodle
- A replaceable AI interface with a key-free mock interviewer
- User submission history and aggregate scores
- Flyway database migrations

## Architecture

The React app calls the Spring Boot JSON API. Spring Boot stores application and
login-session data in PostgreSQL. Code is sent to the configured execution
provider instead of being executed by the Spring process.

```text
React :5173 -> Spring Boot :8080 -> PostgreSQL :5432
                              |
                              +-> local Docker, Judge0, or JDoodle
```

Docker Compose is used locally because it starts PostgreSQL and the code runner
with repeatable versions, ports, storage, and resource limits. You still run
Spring Boot and Vite normally, which keeps development reloads fast.

## Requirements

- Docker Desktop
- Java 21
- Node.js 20 or newer

Maven does not need to be installed; the repository includes the Maven wrapper.

## Run locally

1. Start Docker Desktop.

2. From the repository root, start PostgreSQL and the code runner:

   ```bash
   docker compose up -d --build
   ```

3. In a second terminal, start Spring Boot:

   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

4. In a third terminal, start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173).

The local defaults in
[application.properties](backend/src/main/resources/application.properties)
match `compose.yaml`, so copying `.env.example` is optional unless you want to
change settings.

To use managed Judge0 or JDoodle instead of the local code-runner, PostgreSQL
is the only Docker service required:

```bash
docker compose up -d postgres
```

### Verify the complete backend flow

With all services running:

```bash
backend/scripts/smoke-local.sh
```

This registers a temporary user, creates an interview, sends a message, runs
Python code, submits the interview, reads its feedback, and verifies the saved
submission.

### Stop everything

- Stop Spring Boot or Vite by focusing its terminal and pressing `Control+C`.
- Stop the Docker services with:

  ```bash
  docker compose down
  ```

`docker compose down` preserves the PostgreSQL named volume. Running
`docker compose down -v` also deletes all local TraceRound database data.

## Local PostgreSQL storage

PostgreSQL data is stored in the Docker named volume
`traceround_postgres_data`, not in the repository. It remains available when
containers stop or Docker Desktop restarts. Flyway automatically creates and
updates the schema whenever Spring Boot starts.

To inspect the database:

```bash
docker compose exec postgres psql -U traceround -d traceround
```

## Authentication and OAuth

Email/password registration and login work immediately. To enable OAuth, create
an application with the provider, put its client ID and secret in environment
variables, and activate the matching Spring profile:

```bash
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
export SPRING_PROFILES_ACTIVE="oauth-google"
cd backend
./mvnw spring-boot:run
```

Available profiles are `oauth-google` and `oauth-github`. Combine them with
commas. The local callback URLs are:

```text
http://localhost:8080/login/oauth2/code/google
http://localhost:8080/login/oauth2/code/github
```

Only configured providers appear as enabled buttons in the frontend.
Credentials belong in local environment variables and Render secrets—never in
Git.

## AI provider

The default `mock` provider makes the complete interview and feedback workflow
usable without an API key. The backend reads these environment variables:

```text
TRACEROUND_AI_PROVIDER
TRACEROUND_AI_API_KEY
TRACEROUND_AI_MODEL
TRACEROUND_AI_TIMEOUT_SECONDS
```

The provider interface is isolated in
`backend/src/main/java/com/traceround/backend/ai`. Gemini is implemented using
Google's Interactions API with provider-neutral interview prompts, structured
feedback validation, bounded context, and `store=false`. Enable it with:

```text
TRACEROUND_AI_PROVIDER=gemini
TRACEROUND_AI_API_KEY=<your Google AI Studio key>
TRACEROUND_AI_MODEL=<an available Gemini model ID>
```

Keep these values in the untracked `.env` file locally and in Render secrets
after deployment. Other providers can implement the same `InterviewAiClient`
contract without changing controllers, database entities, or the frontend.

## AI quotas and rate limits

AI admission is enforced with atomic PostgreSQL counters, so the same limits
work across multiple backend instances. Starting an interview reserves enough
daily capacity for all initial prompts, the configured number of discussion
messages per question, and final feedback. When the daily capacity is full,
only new interviews are blocked; already-admitted interviews can finish.

The defaults can be adjusted with:

```text
AI_QUOTAS_ENABLED=true
AI_DAILY_QUOTA_UNITS=1000
AI_MAX_MESSAGES_PER_QUESTION=6
AI_IP_INTERVIEWS_PER_HOUR=10
AI_ACCOUNT_INTERVIEWS_PER_HOUR=20
AI_IP_MESSAGES_PER_MINUTE=20
AI_ACCOUNT_MESSAGES_PER_MINUTE=30
AI_QUOTA_HASH_SALT=<long-random-production-secret>
```

IP addresses and account IDs are stored only as salted SHA-256 hashes. Set a
stable, private `AI_QUOTA_HASH_SALT` in Render so counters remain consistent
across restarts. Rate-limit responses use HTTP 429 and include `Retry-After`
when a timed window has a known reset.

## Code execution safety

`CodeExecutionClient` keeps three execution providers behind one backend
interface. The local provider is a separate read-only Docker container with
memory, CPU, process, output, and time limits. Judge0 and JDoodle send an
isolated, generated program to their managed APIs. All providers support only
JavaScript, Python, Java, and C++.

This runner is appropriate for local development, not for executing hostile
public code in production. A production deployment should use a dedicated
sandbox platform or short-lived per-execution containers/VMs with no secrets,
no network access, strict quotas, and abuse controls. Do not place untrusted
execution inside the Spring Boot process.

The runner builds a language-specific test harness around the selected
problem's method, executes the server-side test cases, and stops at the first
failure. A failure reports the input, expected value, and actual value without
sending the complete test-case dataset to the browser.

The initial catalog intentionally excludes SQL, shell, concurrency, system
design, stateful class-design, and randomized problems. It supports regular
functions plus arrays, strings, matrices, linked lists, binary trees, and
graph/grid inputs.

### Enable managed Judge0

Subscribe to the managed Judge0 API, copy `.env.example` to `.env`, and place
the values from its API dashboard in the untracked `.env`:

```text
CODE_EXECUTION_PROVIDER=judge0
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=<your private key>
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com
JUDGE0_AUTH_MODE=rapidapi
```

Restart Spring Boot after changing these values. The key is read only by
Spring Boot and is never returned to the browser. The default language IDs are
configurable with `JUDGE0_JAVASCRIPT_LANGUAGE_ID`,
`JUDGE0_PYTHON_LANGUAGE_ID`, `JUDGE0_JAVA_LANGUAGE_ID`, and
`JUDGE0_CPP_LANGUAGE_ID` if the managed service lists different compiler
versions.

When starting Spring Boot from a new terminal, load the root `.env` first:

```bash
cd backend
set -a
source ../.env
set +a
./mvnw spring-boot:run
```

Every Run click combines all server-side test cases into one Judge0 submission.
PostgreSQL-backed limits default to 45 total submissions per day, 20 per IP,
30 per account, and short per-minute burst limits. This leaves a small buffer
on a 50-submission plan. Adjust the `CODE_EXECUTION_*` variables in
`.env.example` if the plan or reset timezone changes.

Keep `CODE_EXECUTION_PROVIDER=local` until a live run succeeds with your key.
The Docker runner remains a development fallback and can be removed from
`compose.yaml` after that verification.

### Enable managed JDoodle

Create a JDoodle account, subscribe to its free Compiler API plan, and copy the
Client ID and Secret from the API dashboard into the untracked `.env`:

```text
CODE_EXECUTION_PROVIDER=jdoodle
JDOODLE_API_URL=https://api.jdoodle.com/v1
JDOODLE_CLIENT_ID=<your client ID>
JDOODLE_CLIENT_SECRET=<your private secret>
```

Load `.env` and restart Spring Boot using the commands above. TraceRound uses
Node 20, Python 3.11, Java 21, and C++17 by default; every runtime code and
version index can be overridden with the `JDOODLE_*_LANGUAGE` and
`JDOODLE_*_VERSION_INDEX` variables if JDoodle changes its catalog.

JDoodle currently provides 20 free API credits per day. TraceRound defaults to
18 JDoodle runs per day, leaving two credits for testing or provider-side
accounting. One Run click still bundles every problem test case into one API
request.

## Neon, Render, and Vercel later

The application is already database-provider independent at the PostgreSQL
level. For Neon, set Render secrets using the connection details Neon gives
you:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>/<database>?sslmode=require
SPRING_DATASOURCE_USERNAME=<username>
SPRING_DATASOURCE_PASSWORD=<password>
```

Flyway will create the same schema in Neon. The local Docker volume remains a
separate development database and is not uploaded to Neon automatically.

The backend includes a production Dockerfile for Render. Typical production
settings are:

```text
FRONTEND_URL=https://<your-vercel-site>
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=none
CODE_EXECUTION_PROVIDER=judge0
JUDGE0_API_URL=<managed-api-url>
JUDGE0_API_KEY=<Render secret>
JUDGE0_API_HOST=<managed-api-host>
```

For JDoodle, use `CODE_EXECUTION_PROVIDER=jdoodle` and store
`JDOODLE_CLIENT_ID` and `JDOODLE_CLIENT_SECRET` as Render secrets instead.

Set `VITE_API_BASE_URL` and `VITE_BACKEND_ORIGIN` in Vercel to the Render
backend URL. Before public launch, use a custom same-site API domain where
possible and deploy a production-grade code execution service.

## Tests

```bash
cd backend
./mvnw test

cd ../frontend
npm run lint
npm run build
```
