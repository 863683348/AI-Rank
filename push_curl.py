#!/usr/bin/env python3
"""
用 subprocess 调系统 curl（走代理稳定）+ git pack-objects 生成 pack，
推送 GitHub git-receive-pack。绕开 git 自带坏 libcurl。
用法: python push_curl.py <GITHUB_TOKEN>
"""
import subprocess
import sys
import os
import tempfile

PROXY = "http://127.0.0.1:51466"
TOKEN = sys.argv[1]
REPO = "863683348/AI-Rank"
WORKDIR = r"D:\WorkBuddyData\2026-08-12-17-30-29\ai-rank"
LOCAL_REF = "refs/heads/main"

os.chdir(WORKDIR)
print(f"Working in: {os.getcwd()}")


def run_git(*args):
    r = subprocess.run(["git", *args], capture_output=True, text=True)
    if r.returncode != 0:
        print(f"git {args} failed:\n{r.stderr}", file=sys.stderr)
        raise RuntimeError(r.stderr)
    return r.stdout


def curl(url, out_file=None, body_file=None, extra_headers=None):
    cmd = ["curl", "--http1.1", "-sS", "-x", PROXY]
    for h in (extra_headers or []):
        cmd += ["-H", h]
    if body_file:
        cmd += ["--data-binary", f"@{body_file}"]
    if out_file:
        cmd += ["-o", out_file]
    cmd += [url]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0:
        print(f"curl failed: {r.stderr.decode(errors='replace')[:500]}", file=sys.stderr)
        raise RuntimeError(r.stderr)
    return r.stdout


def parse_pkt_lines(data: bytes):
    i = 0
    out = []
    while i + 4 <= len(data):
        head = data[i : i + 4]
        if head == b"0000":
            break
        try:
            length = int(head, 16)
        except ValueError:
            break
        if length < 4:
            break
        out.append(data[i + 4 : i + length])
        i += length
    return out


def pkt_line(content: bytes) -> bytes:
    return f"{len(content) + 4:04x}".encode() + content


# === Phase 1: ref discovery ===
print("\n=== Phase 1: GET /info/refs?service=git-receive-pack ===")
ads_path = tempfile.mktemp(suffix=".bin")
curl(
    f"https://github.com/{REPO}.git/info/refs?service=git-receive-pack",
    out_file=ads_path,
    extra_headers=[f"Authorization: token {TOKEN}"],
)
with open(ads_path, "rb") as f:
    remote_ads = f.read()
os.unlink(ads_path)
print(f"remote ads bytes: {len(remote_ads)}")

remote_refs = {}
for ln in parse_pkt_lines(remote_ads):
    if not ln or b"\x00" not in ln:
        continue
    try:
        sha_part, rest = ln.split(b" ", 1)
        sha = sha_part.decode()
        refname = rest.split(b"\x00", 1)[0].decode()
        if refname.startswith("refs/"):
            remote_refs[refname] = sha
    except Exception:
        continue

remote_main = remote_refs.get(LOCAL_REF)
print(f"Remote {LOCAL_REF}: {remote_main}")

# === Phase 2: local ===
local_main = run_git("rev-parse", "HEAD").strip()
print(f"Local  HEAD:        {local_main}")

if remote_main == local_main:
    print("\n>>> Already up to date.")
    sys.exit(0)

# === Phase 3: pack unique objects ===
print("\n=== Phase 3: git pack-objects ===")
rev_list = run_git("rev-list", "--objects", f"{remote_main}..{local_main}")
obj_lines = [ln for ln in rev_list.splitlines() if ln.strip()]
print(f"Objects to send: {len(obj_lines)}")

pack_data = b""
if obj_lines:
    sha_input = "\n".join(line.split()[0] for line in obj_lines) + "\n"
    p = subprocess.run(
        ["git", "pack-objects", "--stdout", "--no-reuse-object"],
        input=sha_input.encode(),
        capture_output=True,
    )
    if p.returncode != 0:
        print(f"pack-objects failed: {p.stderr.decode()}", file=sys.stderr)
        sys.exit(1)
    pack_data = p.stdout
    print(f"Pack size: {len(pack_data)} bytes")

# === Phase 4: POST /git-receive-pack ===
print("\n=== Phase 4: POST /git-receive-pack ===")
old_sha = remote_main or ("0" * 40)
update_cmd = f"{old_sha} {local_main} {LOCAL_REF}\x00report-status\n".encode()
body = pkt_line(update_cmd) + b"0000" + pack_data

body_path = tempfile.mktemp(suffix=".bin")
with open(body_path, "wb") as f:
    f.write(body)
resp_path = tempfile.mktemp(suffix=".bin")

curl(
    f"https://github.com/{REPO}.git/git-receive-pack",
    body_file=body_path,
    out_file=resp_path,
    extra_headers=[
        f"Authorization: token {TOKEN}",
        "Content-Type: application/x-git-receive-pack-request",
    ],
)
os.unlink(body_path)

with open(resp_path, "rb") as f:
    resp_data = f.read()
os.unlink(resp_path)

text = resp_data.decode("utf-8", errors="replace")
print("Push response (first 800 chars):")
print(text[:800])

# === Verify remote HEAD updated ===
print("\n=== Verify ===")
chk = curl(
    f"https://api.github.com/repos/{REPO}/git/ref/heads/main",
    extra_headers=[f"Authorization: token {TOKEN}"],
)
print(chk.decode("utf-8", errors="replace")[:500])
print(f"\n>>> Done. Expected remote main SHA: {local_main}")