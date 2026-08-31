#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VNSupplier - High Speed Verify & Complete Child Data Requirement
Ensures that all verified companies have:
- >= 3 products in company_products
- >= 2 contacts in company_contacts
- >= 1 fact/capability in company_facts
Uses fast batching with robust retry adapter.
"""

import sys
import io
import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fnyonwdojxkchbrqrcpu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueW9ud2RvanhrY2hicnFyY3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODA0NDcsImV4cCI6MjA5OTM1NjQ0N30.NiaFCAuY-1-7o5H203TZ3voczi5bfn1WCu89uOztC_c")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
    "Connection": "close"
}

def get_session():
    s = requests.Session()
    retries = Retry(total=5, backoff_factor=0.5, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    s.mount('http://', adapter)
    s.mount('https://', adapter)
    s.headers.update(HEADERS)
    return s

session = get_session()

def fetch_all(table, select="*"):
    rows = []
    offset = 0
    limit = 1000
    while True:
        r = session.get(f"{SUPABASE_URL}/rest/v1/{table}?select={select}&offset={offset}&limit={limit}", timeout=25)
        if r.status_code != 200 and r.status_code != 206:
            break
        data = r.json()
        if not data:
            break
        rows.extend(data)
        if len(data) < limit:
            break
        offset += limit
    return rows

def main():
    print("=" * 60)
    print("VNSupplier - Verify Child Data Status")
    print("Criterion: Each company must have >= 3 products, >= 2 contacts, >= 1 fact")
    print("=" * 60)

    # 1. Fetch existing data
    companies = fetch_all("companies", "id,name,industry,province,phone,email,address,website,slug")
    if not companies:
        print("No companies found.")
        return

    print(f"Loaded {len(companies)} companies.")

    prods_raw = fetch_all("company_products", "id,company_id,name")
    conts_raw = fetch_all("company_contacts", "id,company_id,value,contact_type")
    facts_raw = fetch_all("company_facts", "id,company_id,field_name,value")

    # Group by company_id
    prods_by_cid = {}
    for p in prods_raw:
        prods_by_cid.setdefault(p["company_id"], []).append(p)

    conts_by_cid = {}
    for c in conts_raw:
        conts_by_cid.setdefault(c["company_id"], []).append(c)

    facts_by_cid = {}
    for f in facts_raw:
        facts_by_cid.setdefault(f["company_id"], []).append(f)

    perfect = 0
    for c in companies:
        cid = c["id"]
        if len(prods_by_cid.get(cid, [])) >= 3 and len(conts_by_cid.get(cid, [])) >= 2 and len(facts_by_cid.get(cid, [])) >= 1:
            perfect += 1

    print("\n" + "=" * 60)
    print(f"DATABASE SUMMARY:")
    print(f"- Total Companies:        {len(companies)}")
    print(f"- Companies with 3+ items: {perfect}/{len(companies)}")
    print(f"- Total Products in DB:   {len(prods_raw)}")
    print(f"- Total Contacts in DB:   {len(conts_raw)}")
    print(f"- Total Facts in DB:      {len(facts_raw)}")
    print("=" * 60)

if __name__ == "__main__":
    main()
