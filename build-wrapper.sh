#!/bin/bash

set -euo pipefail

cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" .

GOOS=js GOARCH=wasm go build \
  -ldflags="-s -w" \
  -trimpath \
  -o bip322.wasm .
