#!/usr/bin/env bash
set -euo pipefail

# Builds and runs the docker linux postinstall harness: packs the current
# working tree of @dxfrontier/cds-ts-dispatcher, installs it as a Linux/Node
# consumer would (GITHUB_ACTIONS=true, colored TTY-ish env), and asserts the
# `@dispatcher/` setup came out right. A successful `docker build` is a PASS.
#
# Usage:
#   bash test/postinstall/docker/run.sh
#   NODE_VERSION=20 bash test/postinstall/docker/run.sh
#   EXPECT_INDEX_JS=false bash test/postinstall/docker/run.sh
#
# See README.md for what this reproduces and the EXPECT_INDEX_JS nuance.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"
DOCKER_DIR="${SCRIPT_DIR}"
CONSUMER_DIR="${DOCKER_DIR}/consumer"
TARBALL_NAME="cds-ts-dispatcher.tgz"
TARBALL_PATH="${CONSUMER_DIR}/${TARBALL_NAME}"
IMAGE_TAG="cds-ts-dispatcher-postinstall-test"

NODE_VERSION="${NODE_VERSION:-22}"
EXPECT_INDEX_JS="${EXPECT_INDEX_JS:-true}"

cleanup() {
  rm -f "${TARBALL_PATH}"
}
trap cleanup EXIT

echo "==> Packing @dxfrontier/cds-ts-dispatcher from ${REPO_ROOT}"
cd "${REPO_ROOT}"

PACK_JSON="$(npm pack --pack-destination "${CONSUMER_DIR}" --json)"
PACKED_FILENAME="$(node -e "console.log(JSON.parse(process.argv[1])[0].filename)" "${PACK_JSON}")"

if [[ -z "${PACKED_FILENAME}" || ! -f "${CONSUMER_DIR}/${PACKED_FILENAME}" ]]; then
  echo "!! npm pack did not produce the expected tarball (got filename: '${PACKED_FILENAME}')" >&2
  exit 1
fi

mv "${CONSUMER_DIR}/${PACKED_FILENAME}" "${TARBALL_PATH}"
echo "==> Packed ${PACKED_FILENAME} -> ${TARBALL_NAME}"

echo "==> Building docker image '${IMAGE_TAG}' (node:${NODE_VERSION}-slim, EXPECT_INDEX_JS=${EXPECT_INDEX_JS})"
docker build \
  --progress=plain \
  --tag "${IMAGE_TAG}" \
  --build-arg "NODE_VERSION=${NODE_VERSION}" \
  --build-arg "EXPECT_INDEX_JS=${EXPECT_INDEX_JS}" \
  "${DOCKER_DIR}"

echo ""
echo "PASS: docker postinstall harness (node:${NODE_VERSION}-slim, EXPECT_INDEX_JS=${EXPECT_INDEX_JS}) - consumer install + verification succeeded."
