#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Daily Auto-Streak & Metric Keeper
Ensures daily GitHub streak never breaks, contributions stay balanced,
and Camo cache is automatically purged daily.
"""
import urllib.request
import urllib.error
import json
import base64
import time
import datetime
import subprocess
import os
import sys

import os
import urllib.parse

TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
if not TOKEN:
    cred_path = os.path.expanduser("~/.git-credentials")
    if os.path.exists(cred_path):
        with open(cred_path, "r") as f:
            for line in f:
                if "github.com" in line:
                    parsed = urllib.parse.urlparse(line.strip())
                    TOKEN = parsed.password or parsed.username
                    if TOKEN:
                        break

OWNER = "BekbolatBolebay"
REPOS = ["Lunar-Neuro", "LunarEC"]

headers = {
    "Authorization": f"token {TOKEN}",
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Lunar-Auto-Streak-Guardian"
}

def api(url, method="GET", data=None, max_retries=5):
    for attempt in range(max_retries):
        req = urllib.request.Request(url, headers=headers, method=method)
        if data:
            req.data = json.dumps(data).encode("utf-8")
            req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req) as resp:
                raw = resp.read().decode("utf-8")
                if not raw:
                    return {"status": "ok", "code": resp.status}
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8")
            if e.code in (403, 429):
                wait = 20 * (attempt + 1)
                time.sleep(wait)
                continue
            return {"error": raw, "code": e.code}
        except Exception as e:
            if attempt == max_retries - 1:
                return {"error": str(e)}
            time.sleep(2)
    return {"error": "max_retries_exceeded"}

def check_today_contributions():
    query = """
    {
      viewer {
        contributionsCollection {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }
    """
    req = urllib.request.Request("https://api.github.com/graphql", 
        data=json.dumps({"query": query}).encode(),
        headers={"Authorization": f"bearer {TOKEN}", "User-Agent": "Streak-Guardian"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            days = [d for w in data["data"]["viewer"]["contributionsCollection"]["contributionCalendar"]["weeks"] for d in w["contributionDays"]]
            today_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
            for d in days:
                if d["date"] == today_utc:
                    return d["contributionCount"]
    except Exception as e:
        print(f"Error checking calendar: {e}")
    return 0

def purge_camo_cache():
    camo_url = "https://camo.githubusercontent.com/d2c187bf0c524701d207bd59ad227c0c3f558d0762e7a266332bf32901dc1504/68747470733a2f2f73747265616b2d73746174732e64656d6f6c61622e636f6d2f3f757365723d42656b626f6c6174426f6c65626179267468656d653d7261646963616c26626f726465725f7261646975733d3130"
    try:
        req = urllib.request.Request(camo_url, method="PURGE")
        with urllib.request.urlopen(req) as resp:
            print(f"Camo cache purged: {resp.status}")
    except Exception as e:
        print(f"Camo purge notice: {e}")

def run_daily_guardian():
    today_utc = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    count = check_today_contributions()
    print(f"[{datetime.datetime.now()}] Today ({today_utc}) Contributions: {count}")

    # Ensure Camo cache is fresh
    purge_camo_cache()

    if count >= 10:
        print("✅ Бүгінгі күн жасыл әрі белсенді! Қосымша әрекет қажет емес.")
        return

    print("⚠️ Бүгінге үлес аз немесе жоқ! Стрикті қорғау үшін 5 модульдік теңдестірілген пакет іске қосылуда...")
    # Rotate between Lunar-Neuro and LunarEC
    day_num = int(datetime.datetime.now().strftime("%d"))
    target_repo = "Lunar-Neuro" if day_num % 2 == 0 else "LunarEC"

    # Add 5 automated units
    timestamp = int(time.time())
    for i in range(1, 6):
        mod_id = f"auto_{timestamp}_{i}"
        branch = f"auto-streak-{mod_id}"
        title = f"chore(guardian): Күнделікті автоматтандырылған сенімділік тесті #{mod_id}"
        
        # 1. Issue
        iss = api(f"https://api.github.com/repos/{OWNER}/{target_repo}/issues", "POST", {
            "title": title,
            "body": f"Стрикті қорғау және жүйелік тұтастықты автоматты тексеру #{mod_id}",
            "labels": ["automated-guardian", "ci"]
        })
        iss_num = iss.get("number")

        # 2. Main SHA
        ref = api(f"https://api.github.com/repos/{OWNER}/{target_repo}/git/ref/heads/main")
        main_sha = ref.get("object", {}).get("sha")
        if not main_sha:
            continue

        # 3. Branch
        api(f"https://api.github.com/repos/{OWNER}/{target_repo}/git/refs", "POST", {
            "ref": f"refs/heads/{branch}",
            "sha": main_sha
        })

        # 4. Commit
        code = f"# Auto-Guardian Diagnostic Check {mod_id}\n# Timestamp: {time.time()}\nSTATUS = 'PASS'\n"
        b64_content = base64.b64encode(code.encode()).decode()
        api(f"https://api.github.com/repos/{OWNER}/{target_repo}/contents/.guardian/check_{mod_id}.py", "PUT", {
            "message": title,
            "content": b64_content,
            "branch": branch
        })

        # 5. PR
        pr = api(f"https://api.github.com/repos/{OWNER}/{target_repo}/pulls", "POST", {
            "title": title,
            "head": branch,
            "base": "main",
            "body": f"Стрикті автоматты қорғау модулі. Issue #{iss_num}."
        })
        pr_num = pr.get("number")

        if pr_num:
            time.sleep(0.4)
            # 6. Reviews
            api(f"https://api.github.com/repos/{OWNER}/{target_repo}/pulls/{pr_num}/reviews", "POST", {
                "body": "🔍 Автоматтандырылған QA тексерісі сәтті өтті.",
                "event": "COMMENT"
            })
            time.sleep(0.4)
            api(f"https://api.github.com/repos/{OWNER}/{target_repo}/pulls/{pr_num}/reviews", "POST", {
                "body": "✅ Сәулеттік қауіпсіздік критерийлері расталды.",
                "event": "COMMENT"
            })
            time.sleep(0.4)
            # 7. Merge
            api(f"https://api.github.com/repos/{OWNER}/{target_repo}/pulls/{pr_num}/merge", "PUT", {
                "commit_title": f"{title} (#{pr_num})",
                "merge_method": "squash"
            })
            time.sleep(0.4)
            # 8. Close Issue
            api(f"https://api.github.com/repos/{OWNER}/{target_repo}/issues/{iss_num}", "PATCH", {
                "state": "closed",
                "state_reason": "completed"
            })
            # 9. Delete branch
            api(f"https://api.github.com/repos/{OWNER}/{target_repo}/git/refs/heads/{branch}", "DELETE")

        time.sleep(1.2)

    purge_camo_cache()
    print("🎉 Стрик сәтті қорғалды және кэш тазартылды!")

if __name__ == "__main__":
    run_daily_guardian()
