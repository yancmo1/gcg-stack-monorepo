#!/bin/zsh
# Script to run Docker Compose and monitor logs for errors

echo "Starting Docker Compose..."
docker-compose up --build &
DOCKER_PID=$!

sleep 5

echo "Tailing logs for backend and frontend containers..."
docker-compose logs -f backend frontend |
  while read line; do
    echo "$line"
    if echo "$line" | grep -iE 'error|exception|traceback|exited'; then
      echo "\n[!] ERROR DETECTED:\n$line\n"
    fi
  done

wait $DOCKER_PID
