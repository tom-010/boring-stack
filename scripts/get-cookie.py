#!/usr/bin/env python3
"""
Get a session cookie for curl requests.

Usage:
    ./scripts/get-cookie.py                    # Use defaults
    ./scripts/get-cookie.py user@example.com   # Custom email

    # With curl:
    curl http://localhost:5173/projects -b "$(./scripts/get-cookie.py)"
"""

import json
import os
import sys
import urllib.request
import urllib.error

BASE_URL = os.environ.get("BETTER_AUTH_URL", "http://localhost:5173")
DEFAULT_EMAIL = "admin@example.com"
DEFAULT_PASSWORD = "admin"


def get_cookie(email: str, password: str) -> str:
    """Login and return the session cookie string."""
    url = f"{BASE_URL}/api/auth/sign-in/email"
    data = json.dumps({"email": email, "password": password}).encode()

    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            cookie_header = response.headers.get("Set-Cookie", "")
            if not cookie_header:
                print("No cookie in response", file=sys.stderr)
                sys.exit(1)
            # Extract just the cookie name=value part
            cookie = cookie_header.split(";")[0]
            return cookie
    except urllib.error.HTTPError as e:
        print(f"Login failed: {e.code} {e.reason}", file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"Connection failed: {e.reason}", file=sys.stderr)
        print(f"Is the dev server running at {BASE_URL}?", file=sys.stderr)
        sys.exit(1)


def main():
    email = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_EMAIL
    password = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_PASSWORD

    cookie = get_cookie(email, password)
    print(cookie)


if __name__ == "__main__":
    main()
