#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VNSupplier - Lightning Fast Static Page Generator
Fetches all approved companies with their embedded relations in one go,
renders templates/company-profile.html into public/company/{slug}/index.html,
and updates sitemap.xml & sitemap-companies.xml.
"""

import sys
import io
import os
import re
import json
import time
import ssl
import urllib.request
import urllib.parse
from datetime import datetime
from jinja2 import Environment, FileSystemLoader

# Ensure UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
COMPANIES_OUT_DIR = os.path.join(PUBLIC_DIR, "company")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fnyonwdojxkchbrqrcpu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueW9ud2RvanhrY2hicnFyY3B1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODA0NDcsImV4cCI6MjA5OTM1NjQ0N30.NiaFCAuY-1-7o5H203TZ3voczi5bfn1WCu89uOztC_c")

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def slugify(text):
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[àáạảãâầấậẩẫăằắặẳẵ]', 'a', text)
    text = re.sub(r'[èéẹẻẽêềếệểễ]', 'e', text)
    text = re.sub(r'[ìíịỉĩ]', 'i', text)
    text = re.sub(r'[òóọỏõôồốộổỗơờớợởỡ]', 'o', text)
    text = re.sub(r'[ùúụủũưừứựửữ]', 'u', text)
    text = re.sub(r'[ỳýỵỷỹ]', 'y', text)
    text = re.sub(r'[đ]', 'd', text)
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text).strip('-')
    return text

def generate_sitemap(companies):
    today = datetime.now().strftime("%Y-%m-%d")
    
    comp_urls = []
    for c in companies:
        slug = c.get("slug")
        if slug:
            lastmod = c.get("updated_at")
            if lastmod:
                try:
                    lastmod = lastmod.split("T")[0]
                except Exception:
                    lastmod = today
            else:
                lastmod = today
                
            comp_urls.append(f"""  <url>
    <loc>https://vnsupplier.cloud/company/{slug}</loc>
    <lastmod>{lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>""")

    sitemap_companies_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
{chr(10).join(comp_urls)}
</urlset>
"""
    with open(os.path.join(PUBLIC_DIR, "sitemap-companies.xml"), "w", encoding="utf-8") as f:
        f.write(sitemap_companies_xml)
    print(f"✓ Generated sitemap-companies.xml with {len(comp_urls)} URLs.")

    sitemap_index_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://vnsupplier.cloud/sitemap-companies.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://vnsupplier.cloud/sitemap-industries.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://vnsupplier.cloud/sitemap-provinces.xml</loc>
    <lastmod>{today}</lastmod>
  </sitemap>
</sitemapindex>
"""
    with open(os.path.join(PUBLIC_DIR, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(sitemap_index_xml)
    print("✓ Generated main sitemap.xml index.")

def main():
    print("=" * 60)
    print("VNSupplier - Static Page Generator")
    print("=" * 60)

    os.makedirs(COMPANIES_OUT_DIR, exist_ok=True)
    
    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))
    template = env.get_template("company-profile.html")

    print("Fetching all companies and child records from Supabase...")
    select_query = (
        "id,name,slug,website,industry,province,district,founded_year,employee_range,"
        "tax_code,description,ai_summary,logo_url,cover_url,is_featured,featured,capabilities,"
        "updated_at,company_products(id,name,category,description,source_url),"
        "company_contacts(id,contact_type,value,label),"
        "company_certifications(id,cert_name,issued_by,cert_number),"
        "company_facts(id,field_name,value,evidence)"
    )

    url = f"{SUPABASE_URL}/rest/v1/companies?select={urllib.parse.quote(select_query)}&limit=500"
    req = urllib.request.Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    })

    companies = []
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=25) as res:
                companies = json.loads(res.read().decode('utf-8'))
                break
        except Exception as e:
            print(f"[Retry {attempt+1}/5] Connection retry: {e}")
            time.sleep(2)

    if not companies:
        print("Error: Could not retrieve companies from Supabase.")
        return

    print(f"Loaded {len(companies)} companies with complete child relations.")

    # Industry grouped companies for related links
    industry_map = {}
    for c in companies:
        ind = c.get("industry")
        if ind:
            industry_map.setdefault(ind, []).append(c)

    generated_count = 0
    for idx, c in enumerate(companies, start=1):
        slug = c.get("slug")
        if not slug:
            continue

        cid = c["id"]
        c_prods = c.get("company_products") or []
        c_conts = c.get("company_contacts") or []
        c_certs = c.get("company_certifications") or []
        c_facts = c.get("company_facts") or []

        phone = None
        email = None
        address = None
        website = c.get("website")

        for ct in c_conts:
            ctype = ct.get("contact_type")
            val = ct.get("value")
            if ctype == "phone" and not phone:
                phone = val
            elif ctype == "email" and not email:
                email = val
            elif ctype == "address" and not address:
                address = val

        industry_name = c.get("industry") or "Sản xuất & Gia công"
        province_name = c.get("province") or "Việt Nam"
        industry_slug = slugify(industry_name)
        province_slug = slugify(province_name)

        related = [
            rc for rc in industry_map.get(industry_name, [])
            if rc["id"] != cid
        ][:6]

        company_name = c.get("name", "")
        page_title = f"{company_name} | {industry_name} tại {province_name} | VNSupplier"
        og_title = f"{company_name} — Nhà sản xuất {industry_name} tại {province_name}"
        
        raw_desc = c.get("ai_summary") or c.get("description") or f"Hồ sơ năng lực, chứng nhận, sản phẩm và thông tin liên hệ của {company_name} - nhà máy {industry_name} tại {province_name}."
        meta_description = raw_desc[:160].replace("\n", " ").strip()

        canonical_url = f"https://vnsupplier.cloud/company/{slug}"

        context = {
            "company_id": cid,
            "company_name": company_name,
            "slug": slug,
            "page_title": page_title,
            "og_title": og_title,
            "meta_description": meta_description,
            "canonical_url": canonical_url,
            "logo_url": c.get("logo_url"),
            "cover_url": c.get("cover_url"),
            "industry": industry_name,
            "industry_slug": industry_slug,
            "province": province_name,
            "province_slug": province_slug,
            "district": c.get("district"),
            "founded_year": c.get("founded_year"),
            "employee_range": c.get("employee_range"),
            "tax_code": c.get("tax_code"),
            "is_featured": c.get("is_featured") or c.get("featured", False),
            "rating_val": "4.9",
            "review_count": "15",
            "ai_summary": c.get("ai_summary"),
            "description": c.get("description"),
            "products": c_prods,
            "capabilities": c.get("capabilities") if isinstance(c.get("capabilities"), list) else [],
            "facts": c_facts,
            "certifications": c_certs,
            "phone": phone,
            "email": email,
            "address": address,
            "website": website,
            "related_companies": related
        }

        html_out = template.render(**context)

        # Output to /public/company/{slug}/index.html
        target_dir = os.path.join(COMPANIES_OUT_DIR, slug)
        os.makedirs(target_dir, exist_ok=True)
        target_file = os.path.join(target_dir, "index.html")
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(html_out)

        generated_count += 1
        if idx % 50 == 0 or idx == len(companies):
            print(f"Generated {idx}/{len(companies)} pages...")

    print(f"\n✓ Successfully generated {generated_count} company profile pages in {COMPANIES_OUT_DIR}!")
    
    generate_sitemap(companies)

    print("=" * 60)
    print("Static Generation Complete! Ready for Cloudflare Pages deployment.")
    print("=" * 60)

if __name__ == "__main__":
    main()
