#!/usr/bin/env python3
"""Builds the day-of-visits link for the team order form (modulary.co.il/order-form-team/).
usage: python3 orders/make-visit-link.py visits.json
visits.json: {"d": "2026-11-13", "who": "מיכאל", "v": [{"id": "a1", "time": "09:00", "customer": "...", "contact": "...",
              "phone": "...", "address": "...", "floor": "...", "elevator": "יש|אין", "parking": "...", "access": "...", "note": "..."}]}
Same encoding as the page: base64url of the UTF-8 JSON, in ?day=."""
import base64, json, sys
day = json.load(open(sys.argv[1], encoding='utf-8'))
for i, v in enumerate(day['v']):
    v.setdefault('id', f'v{i+1}')
tok = base64.urlsafe_b64encode(json.dumps(day, ensure_ascii=False, separators=(',', ':')).encode()).decode().rstrip('=')
print(f"https://modulary.co.il/order-form-team/?day={tok}")
