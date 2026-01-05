#!/bin/bash

set -e

# Check if the user provided a port number
if [ -z "$1" ]; then
  echo "Error: No port provided."
  echo "Usage: ./scripts/killport.sh <port>"
  exit 1
fi

PORT=$1

# Find the PID (Process ID) utilizing the given port.
# lsof flags:
# -t: Terse mode (outputs only the PID numbers)
# -i: Selects the listing of files any of whose Internet address matches
PID=$(lsof -t -i:$PORT)

# Check if a PID was found
if [ -z "$PID" ]; then
  echo "No process found running on port $PORT."
  exit 0
fi

# detailed info for the user before killing
PROCESS_NAME=$(ps -p $PID -o comm=)

echo "Found process '$PROCESS_NAME' (PID: $PID) on port $PORT."

# Kill the process
# Using SIGTERM (-15) allows the process to clean up. 
# Change to -9 for SIGKILL (force kill) if necessary.
kill -15 $PID

if [ $? -eq 0 ]; then
  echo "Process $PID has been terminated successfully."
else
  echo "Failed to terminate process $PID. You may need sudo privileges."
  exit 1
fi