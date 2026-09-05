#!/usr/bin/env bash
# 用系统 curl 作为 git 的 HTTP 代理运输层，绕过 git 内置 libcurl 在此环境的 TLS 握手 bug
exec curl --http1.1 -sS -x "http://127.0.0.1:51466" "$@"
