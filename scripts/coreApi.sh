#!/bin/bash
# Shared helpers for backup.sh and restore.sh. Source this file, do not run it.
# Requests are sent from inside the core container so they are local to core.
# Core rejects any request that is not local or has been proxied.

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required to run this script." >&2
  exit 1
fi

NODE_ENV=""
if [ -f .env ]; then
  NODE_ENV=$(grep -E "^NODE_ENV=" .env | cut -d= -f2 | tr -d '"' | tr -d "'" || true)
fi

if [ "$NODE_ENV" = "production" ]; then
  COMPOSE_FILE="docker-compose.prod.yml"
else
  COMPOSE_FILE="docker-compose.dev.yml"
fi

# Sets RESPONSE to the response body and STATUS to the http status code.
# STATUS is 000 when core could not be reached.
# usage: core_api METHOD PATH [JSON_BODY]
core_api() {
  local method=$1
  local path=$2
  local body=${3:-}
  local args=(-sS -X "$method" -w $'\n%{http_code}')

  if [ -n "$body" ]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi

  local output
  if ! output=$(docker compose -f docker-compose.yml -f "$COMPOSE_FILE" \
    exec -T core curl "${args[@]}" "http://localhost:3000$path" 2>/dev/null); then
    RESPONSE=""
    STATUS="000"
    return 0
  fi

  STATUS=${output##*$'\n'}
  RESPONSE=${output%$'\n'*}
}

# Print an error message from the last response and exit.
fail_response() {
  local message
  message=$(echo "$RESPONSE" | jq -r '.error // empty' 2>/dev/null || true)
  echo "Request failed (HTTP $STATUS): ${message:-no response from core}" >&2
  exit 1
}

# Print a block of text. When stdout is a terminal the previous block is
# replaced, otherwise the block is only printed when it changed.
RENDERED_LINES=0
LAST_BLOCK=""
print_block() {
  local text=$1

  if [ -t 1 ]; then
    if [ "$RENDERED_LINES" -gt 0 ]; then
      printf '\033[%dA\033[J' "$RENDERED_LINES"
    fi
    echo "$text"
    RENDERED_LINES=$(echo "$text" | wc -l)
  elif [ "$text" != "$LAST_BLOCK" ]; then
    echo "$text"
    echo
    LAST_BLOCK=$text
  fi
}

# Keep the output printed so far and start a new block.
reset_block() {
  RENDERED_LINES=0
  LAST_BLOCK=""
}

# Print the steps of the last status response.
render_steps() {
  print_block "$(echo "$RESPONSE" | jq -r '.steps[] | "  \(.name | .[0:34] | . + " " * (34 - length))  \(.state | . + " " * (16 - length))  \(.progress)%"')"
}

# Poll a status endpoint until it finishes.
# Returns 0 on completion and 1 on failure.
# usage: monitor_status PATH [UNTIL_DRAGONFLY]
# UNTIL_DRAGONFLY=true also returns 0 as soon as every restore has completed and
# the DragonFly restore starts. Restoring DragonFly replaces the job state in
# core, so the status can not be followed any further.
monitor_status() {
  local path=$1
  local until_dragonfly=${2:-false}
  local errors=0
  local restores_done=false
  local deadline=$((SECONDS + 4 * 60 * 60))

  while [ "$SECONDS" -lt "$deadline" ]; do
    core_api GET "$path"

    local state=""
    if [ "$STATUS" = "200" ]; then
      state=$(echo "$RESPONSE" | jq -r '.state')
    fi

    if [ -n "$state" ] && [ "$state" != "not-found" ]; then
      errors=0
      render_steps

      if echo "$RESPONSE" | jq -e '[.steps[] | select(.name != "restore-finish")] | all(.state == "completed")' >/dev/null; then
        restores_done=true
      fi

      case "$state" in
        completed)
          return 0
          ;;
        failed)
          echo
          echo "Failed: $(echo "$RESPONSE" | jq -r '.failedReason')" >&2
          return 1
          ;;
      esac

      if [ "$until_dragonfly" = "true" ] && echo "$RESPONSE" | jq -e '.steps[] | select(.name == "restore-finish" and .state == "active")' >/dev/null; then
        echo
        echo "All restores completed. DragonFly restore started."
        return 0
      fi
    else
      if [ "$until_dragonfly" = "true" ] && [ "$restores_done" = "true" ]; then
        echo
        echo "All restores completed. DragonFly restore started."
        return 0
      fi

      errors=$((errors + 1))
      if [ "$errors" -ge 10 ]; then
        echo "Lost contact with core." >&2
        return 1
      fi
    fi

    sleep 2
  done

  echo "Timed out waiting for completion." >&2
  return 1
}

# Print the state of every container of a compose service, or "missing".
container_states() {
  local service=$1
  local ids
  ids=$(docker compose -f docker-compose.yml -f "$COMPOSE_FILE" ps -a -q "$service" 2>/dev/null || true)

  if [ -z "$ids" ]; then
    echo "missing"
    return 0
  fi

  # shellcheck disable=SC2086
  docker inspect -f '{{.State.Status}}' $ids 2>/dev/null | sort | uniq -c | awk '{ printf "%s%s", sep, $2; sep="," }'
  echo
}

# Show the container states until every service has been running without
# interruption for the given number of seconds.
# Returns 0 when stable and 1 when the timeout is reached.
# usage: monitor_containers TIMEOUT_SECONDS STABLE_SECONDS SERVICE...
monitor_containers() {
  local timeout=$1
  local stable=$2
  shift 2
  local services=("$@")
  local deadline=$((SECONDS + timeout))
  local running_since=""

  while [ "$SECONDS" -lt "$deadline" ]; do
    local text="Containers:"
    local all_running=true

    for service in "${services[@]}"; do
      local states
      states=$(container_states "$service")
      text+=$'\n'"$(printf '  %-14s %s' "$service" "$states")"

      if [ "$states" != "running" ]; then
        all_running=false
      fi
    done

    print_block "$text"

    if [ "$all_running" = "true" ]; then
      running_since=${running_since:-$SECONDS}
      if [ $((SECONDS - running_since)) -ge "$stable" ]; then
        return 0
      fi
    else
      running_since=""
    fi

    sleep 1
  done

  echo "Timed out waiting for the containers to run." >&2
  return 1
}
