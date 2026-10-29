#!/bin/bash
# Start a manual backup. The backup jobs are the same as the scheduled ones and
# run in core, this script only sends the request and shows the progress.
#
# usage: scripts/backup.sh

set -euo pipefail
source "$(dirname "$0")/coreApi.sh"

core_api POST /backup
[ "$STATUS" = "202" ] || fail_response

IDS=$(echo "$RESPONSE" | jq -r '.ids | join(",")')
echo "Backup started"
echo

if monitor_status "/backup/status?ids=$IDS"; then
  echo
  echo "Backup completed."
else
  echo
  echo "The backup failed. See the job logs of the cron queue for details."
  exit 1
fi
