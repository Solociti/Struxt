#!/bin/bash
# Restore data from a backup. All logic lives in core, this script only sends
# requests to it and shows the progress.
#
# usage: scripts/restore.sh [--list] [--id <date/hour>] [--components a,b]
#                           [--include-sessions] [--dry-run] [--yes]
#
# Components: mongo, victoriametrics, grafana, nginx, uploads, sites, dragonfly
# DragonFly is only restored when it is selected.
# Requires RESTORE_ENABLED=true in the .env file of the server.

set -euo pipefail
source "$(dirname "$0")/coreApi.sh"

POINT_ID=""
COMPONENTS=""
INCLUDE_SESSIONS=false
DRY_RUN=false
ASSUME_YES=false
LIST_ONLY=false

while [ $# -gt 0 ]; do
  case "$1" in
    --id) POINT_ID=$2; shift 2 ;;
    --components) COMPONENTS=$2; shift 2 ;;
    --include-sessions) INCLUDE_SESSIONS=true; shift ;;
    --dry-run) DRY_RUN=true; shift ;;
    --yes) ASSUME_YES=true; shift ;;
    --list) LIST_ONLY=true; shift ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

core_api GET /restore/points
[ "$STATUS" = "200" ] || fail_response

POINTS=$(echo "$RESPONSE" | jq -r '.[] | "\(.id)\t\(.source)\t\(.sizeBytes)\t\(.components | join(","))"')

if [ -z "$POINTS" ]; then
  echo "No restore points found."
  exit 1
fi

format_points() {
  while IFS=$'\t' read -r id source size components; do
    printf '%-14s %-6s %8s  %s\n' "$id" "$source" "$(numfmt --to=iec "$size")" "$components"
  done <<< "$POINTS"
}

if [ "$LIST_ONLY" = "true" ]; then
  printf '%-14s %-6s %8s  %s\n' "ID" "SOURCE" "SIZE" "COMPONENTS"
  format_points
  exit 0
fi

if [ -z "$POINT_ID" ]; then
  echo "Select a restore point (newest first):"
  mapfile -t OPTIONS < <(format_points)
  PS3="Restore point number: "
  select OPTION in "${OPTIONS[@]}"; do
    if [ -n "${OPTION:-}" ]; then
      POINT_ID=${OPTION%% *}
      break
    fi
  done
fi

if ! echo "$POINTS" | cut -f1 | grep -qx "$POINT_ID"; then
  echo "Unknown restore point: $POINT_ID" >&2
  exit 1
fi

if [ -z "$COMPONENTS" ]; then
  COMPONENTS=$(echo "$POINTS" | awk -F'\t' -v id="$POINT_ID" '$1 == id { print $4 }' | tr ',' '\n' | grep -vx dragonfly | paste -sd, -)

  if [ "$ASSUME_YES" = "false" ] && [ -t 0 ]; then
    read -r -p "Also restore DragonFly (queues and caches, normally not needed)? (y/N): " -n 1 REPLY
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      COMPONENTS="$COMPONENTS,dragonfly"
    fi
  fi
fi

echo
echo "Restore point: $POINT_ID"
echo "Components:    $COMPONENTS"
echo "Sessions:      $([ "$INCLUDE_SESSIONS" = "true" ] && echo restored || echo skipped)"
echo
echo "web-host, editor-api and puppeteer will be stopped during the restore."
echo "No backup of the current data is made first. Run scripts/backup.sh first if you need one."

if [ "$DRY_RUN" = "false" ] && [ "$ASSUME_YES" = "false" ]; then
  read -r -p "Start restore (y/N): " CONFIRM
  if [ "$CONFIRM" != "y" ]; then
    echo "Cancelled."
    exit 1
  fi
fi

BODY=$(jq -n \
  --arg id "$POINT_ID" \
  --arg components "$COMPONENTS" \
  --argjson includeSessions "$INCLUDE_SESSIONS" \
  --argjson dryRun "$DRY_RUN" \
  '{id: $id, components: ($components | split(",")), includeSessions: $includeSessions, dryRun: $dryRun}')

core_api POST /restore "$BODY"
[ "$STATUS" = "202" ] || fail_response

RUN_ID=$(echo "$RESPONSE" | jq -r '.runId')
echo "Restore started (run $RUN_ID)"
echo

RESTORE_DRAGONFLY=false
if [[ ",$COMPONENTS," == *",dragonfly,"* ]]; then
  RESTORE_DRAGONFLY=true
fi

if ! monitor_status "/restore/$RUN_ID/status" "$RESTORE_DRAGONFLY"; then
  echo
  echo "The restore failed. web-host, editor-api and puppeteer remain stopped, and scheduled backups remain paused."
  echo "Fix the problem and run this script again. A completed restore starts the services and resumes the backups."
  exit 1
fi

if [ "$DRY_RUN" = "true" ]; then
  echo
  echo "Dry run completed."
  exit 0
fi

SERVICES=(web-host editor-api puppeteer)
CONTAINER_TIMEOUT=120
if [ "$RESTORE_DRAGONFLY" = "true" ]; then
  SERVICES+=(dragonfly)
  CONTAINER_TIMEOUT=300
fi

echo
reset_block
if monitor_containers "$CONTAINER_TIMEOUT" 10 "${SERVICES[@]}"; then
  echo
  echo "Restore completed."
else
  echo
  echo "The services did not start. Check the core job logs and the container logs."
  exit 1
fi
