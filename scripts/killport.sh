#!/bin/bash

set -e

# Check if the user provided a port number
if [ -z "$1" ]; then
  echo "Error: No port provided."
  echo "Usage: $0 <port>"
  exit 1
fi

PORT=$1

# Find the PIDs (Process IDs) utilizing the given port.
# We append "|| true" to prevent the script from exiting if lsof finds nothing
# (which lsof considers an error code 1).
PIDS=$(lsof -t -i:$PORT || true)

# Check if any PIDs were found
if [ -z "$PIDS" ]; then
  exit 0
fi

# Loop through each PID found (handles multiple processes on one port)
for pid in $PIDS; do
  # Get the process name safely for just this PID
  PROCESS_NAME=$(ps -p "$pid" -o comm=)

  echo "Found process '$PROCESS_NAME' (PID: $pid) on port $PORT."

  # Kill the process
  kill -15 "$pid"

  if [ $? -eq 0 ]; then
    echo "Process $pid has been terminated successfully."
  else
    echo "Failed to terminate process $pid. You may need sudo privileges."
    exit 1
  fi
done