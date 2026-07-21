# Reproduces the exact environment that broke consumer installs of
# @dxfrontier/cds-ts-dispatcher: Linux, Node 22, and the CI-like env vars
# (GITHUB_ACTIONS/CI/FORCE_COLOR) that used to make `cds env get` (without
# --json) emit a colored `util.inspect` dump instead of JSON, crashing the
# postinstall type generator and failing the whole consumer `npm install`.
#
# A successful `docker build` IS the pass signal: `npm install` must exit 0
# and the verification step below must confirm `@dispatcher/` was generated
# correctly. See run.sh for how this is driven and README.md for details.
#
# consumer/ deliberately includes @sap/cds-dk (devDependency): the `cds` CLI
# binary that `cds env get` shells out to ships ONLY in @sap/cds-dk, never in
# the @sap/cds runtime. Omitting it would replace the real incident (colored
# `cds env get` output crashing the type generator) with an unrelated one
# (the `cds` binary not resolving at all) - see README.md.

ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim

# Toggles the `@dispatcher/index.js` existence assertion.
#
# Default ON: the runtime stub is expected to be produced by a normal
# `npm install`. Flip to "false" (via `--build-arg EXPECT_INDEX_JS=false` /
# the run.sh EXPECT_INDEX_JS env var) only while validating a tree whose
# compiled postinstall/PostInstall.js bundle predates the index.js-writing
# fix (it is a source-only change until rebuilt) — see README.md.
ARG EXPECT_INDEX_JS=true
ENV EXPECT_INDEX_JS=${EXPECT_INDEX_JS}

# The env combination that triggered the original incident (see
# postinstall/util/EnvGenerator.ts): a detected CI provider plus a forced
# color depth, the combination that used to push `cds env get` off the JSON
# code path and onto the colored inspect rendering.
ENV GITHUB_ACTIONS=true \
    CI=true \
    FORCE_COLOR=3

# Debian slim ships bash; use it so `set -o pipefail` makes `npm install`'s
# exit code (not `tee`'s) decide whether the RUN step - and thus the build -
# fails.
SHELL ["/bin/bash", "-o", "pipefail", "-c"]

WORKDIR /workspace

# Fixture first (small, changes rarely), tarball second - keeps the docker
# layer cache useful across repeated `run.sh` invocations while iterating.
COPY consumer/package.json consumer/tsconfig.json consumer/.gitignore ./
COPY consumer/cds-ts-dispatcher.tgz ./

# Must exit 0 - this is the actual regression check. `--foreground-scripts`
# is required: npm >=7 buffers and discards a DEPENDENCY's lifecycle-script
# output by default (only the top-level project's scripts stream live), so
# without it the postinstall warning we grep for below would never reach the
# log regardless of whether it fired - silently defeating that assertion.
# Output is tee'd to a log file so the verification step can assert the
# primary (non-skip-with-warning) code path was taken, not just that the
# install merely survived.
RUN npm install --foreground-scripts 2>&1 | tee /tmp/npm-install.log

COPY verify.js ./verify.js
RUN node ./verify.js
