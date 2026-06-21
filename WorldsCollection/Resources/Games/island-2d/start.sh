#!/bin/bash
cd "$(dirname "$0")"
fuser -k 8181/tcp 2>/dev/null || true
python3 server.py
