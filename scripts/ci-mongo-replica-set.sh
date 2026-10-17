#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
state=.local/ci-mongo-state
mkdir -p .local
command=${1:-start}
if [[ "$command" == stop ]]; then
  [[ -f "$state" ]] || exit 0
  read -r container_id owner < "$state"
  actual=$(docker inspect --format '{{ index .Config.Labels "harvest-ci-owner" }}' "$container_id")
  [[ "$actual" == "$owner" ]] || { echo 'Container ownership mismatch' >&2; exit 1; }
  docker rm --force "$container_id" >/dev/null
  rm "$state"
  exit 0
fi
[[ "$command" == start ]] || exit 2
[[ ! -e "$state" ]] || { echo 'Existing CI Mongo ownership state; inspect and stop it first' >&2; exit 1; }
port=${CI_MONGO_PORT:-27017}
[[ "$port" =~ ^[0-9]+$ ]] && (( port >= 1024 && port <= 65535 )) || exit 2
owner="harvest-${RANDOM}-${RANDOM}-$$"
container_id=$(docker run --detach --label "harvest-ci-owner=$owner" --publish "127.0.0.1:$port:$port" --memory 1g mongo:8.0.17@sha256:9814652e33f0cf8b9fddea8b46dfc9d8e19b130dcfdd7b510ca58bb0d40c8b71 mongod --port "$port" --replSet rs0 --bind_ip_all --wiredTigerCacheSizeGB 0.25)
printf '%s %s\n' "$container_id" "$owner" > "$state"
cleanup_failed() { docker rm --force "$container_id" >/dev/null; rm -f "$state"; }
trap cleanup_failed EXIT
ready=false
for attempt in {1..60}; do
  if docker exec "$container_id" mongosh --quiet --port "$port" --eval 'quit(db.adminCommand({ping:1}).ok ? 0 : 1)' >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
[[ "$ready" == true ]] || { echo 'Mongo ping timed out' >&2; exit 1; }
docker exec "$container_id" mongosh --quiet --port "$port" --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'127.0.0.1:$port'}]})" >/dev/null
ready=false
for attempt in {1..60}; do
  if docker exec "$container_id" mongosh --quiet --port "$port" --eval 'quit(db.hello().isWritablePrimary ? 0 : 1)' >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
[[ "$ready" == true ]] || { echo 'Replica-set election timed out' >&2; exit 1; }
trap - EXIT
url="mongodb://127.0.0.1:$port/?replicaSet=rs0&directConnection=true"
if [[ -n "${GITHUB_ENV:-}" ]]; then printf 'TEST_MONGO_URL=%s\n' "$url" >> "$GITHUB_ENV"; fi
printf 'TEST_MONGO_URL=%s\n' "$url"
