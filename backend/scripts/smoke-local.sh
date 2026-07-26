#!/usr/bin/env bash

set -euo pipefail

api_base="${TRACEROUND_API_BASE:-http://localhost:8080/api}"
cookie_jar="$(mktemp "${TMPDIR:-/tmp}/traceround-smoke-cookies.XXXXXX")"
email="smoke-$(date +%s)@example.com"
password="TraceRoundSmoke123!"
python_solution='class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for index, value in enumerate(nums):
            complement = target - value
            if complement in seen:
                return [seen[complement], index]
            seen[value] = index
        return []'

cleanup() {
  rm -f "$cookie_jar"
}
trap cleanup EXIT

json_get() {
  curl -fsS -b "$cookie_jar" -c "$cookie_jar" "$1"
}

csrf_token() {
  json_get "$api_base/auth/csrf" | jq -r '.token'
}

json_post() {
  local path="$1"
  local body="$2"
  local token
  token="$(csrf_token)"
  curl -fsS \
    -b "$cookie_jar" \
    -c "$cookie_jar" \
    -H "Content-Type: application/json" \
    -H "X-XSRF-TOKEN: $token" \
    --data "$body" \
    "$api_base$path"
}

health="$(json_get "$api_base/health" | jq -r '.status')"
problem_count="$(json_get "$api_base/problems" | jq 'length')"

user="$(json_post "/auth/register" \
  "{\"name\":\"Smoke Test\",\"email\":\"$email\",\"password\":\"$password\"}")"
user_email="$(jq -r '.email' <<<"$user")"

session="$(json_post "/interview-sessions/problem" \
  '{"problemSlug":"two-sum"}')"
session_id="$(jq -r '.id' <<<"$session")"

message="$(json_post "/interview-sessions/$session_id/messages" \
  '{"problemSlug":"two-sum","message":"I would use a hash map for a linear-time solution."}')"
message_role="$(jq -r '.role' <<<"$message")"

run_body="$(jq -n --arg code "$python_solution" \
  '{problemSlug:"two-sum",language:"Python",code:$code}')"
run="$(json_post "/interview-sessions/$session_id/runs" "$run_body")"
run_status="$(jq -r '.status' <<<"$run")"
run_output="$(jq -r '.output' <<<"$run" | tr -d '\r\n')"

submission_body="$(jq -n --arg code "$python_solution" \
  '{answers:[{problemSlug:"two-sum",language:"Python",code:$code,endedBy:"submitted"}]}')"
submission="$(json_post "/interview-sessions/$session_id/submit" "$submission_body")"
feedback_id="$(jq -r '.feedbackId' <<<"$submission")"
feedback_status="$(json_get "$api_base/feedback/$feedback_id" | jq -r '.status')"
saved_submissions="$(json_get "$api_base/me/submissions?limit=4" | jq '.submissions | length')"

jq -n \
  --arg health "$health" \
  --argjson problemCount "$problem_count" \
  --arg user "$user_email" \
  --arg sessionId "$session_id" \
  --arg messageRole "$message_role" \
  --arg runStatus "$run_status" \
  --arg runOutput "$run_output" \
  --arg feedbackStatus "$feedback_status" \
  --argjson savedSubmissions "$saved_submissions" \
  '{
    health: $health,
    problemCount: $problemCount,
    registeredUser: $user,
    sessionId: $sessionId,
    messageRole: $messageRole,
    codeRun: {status: $runStatus, output: $runOutput},
    feedbackStatus: $feedbackStatus,
    savedSubmissions: $savedSubmissions
  }'
