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
from datetime import datetime, timezone
from jinja2 import Environment, FileSystemLoader

# Ensure UTF-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
COMPANIES_OUT_DIR = os.path.join(PUBLIC_DIR, "company")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fnyonwdojxkchbrqrcpu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_PUBLISHABLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueW9ud2RvanhrY2hicnFyY3B1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc4MDQ0NywiZXhwIjoyMDk5MzU2NDQ3fQ.SR1Hcnv2AR-UKb5VlV1xh5m4SEEsSu9izXU8HHaNod4"))

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

def get_video_embed_url(url):
    if not url:
        return None
    url = str(url).strip()
    yt_match = re.search(r'(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})', url)
    if yt_match:
        return f"https://www.youtube.com/embed/{yt_match.group(1)}"
    vimeo_match = re.search(r'vimeo\.com\/(?:video\/)?(\d+)', url)
    if vimeo_match:
        return f"https://player.vimeo.com/video/{vimeo_match.group(1)}"
    return None

def extract_gallery(company):
    gallery_list = []
    seen = set()

    # 1. From company_gallery relation
    for item in (company.get("company_gallery") or []):
        img_url = item.get("image_url")
        if img_url and img_url not in seen:
            seen.add(img_url)
            gallery_list.append({
                "url": img_url,
                "caption": item.get("caption") or ""
            })

    # 2. From gallery_urls JSON column
    raw_gallery = company.get("gallery_urls")
    if isinstance(raw_gallery, str):
        try:
            raw_gallery = json.loads(raw_gallery)
        except Exception:
            raw_gallery = []
    if isinstance(raw_gallery, list):
        for img in raw_gallery:
            if isinstance(img, str) and img and img not in seen:
                seen.add(img)
                gallery_list.append({"url": img, "caption": ""})
            elif isinstance(img, dict) and img.get("url") and img["url"] not in seen:
                seen.add(img["url"])
                gallery_list.append({"url": img["url"], "caption": img.get("caption", "")})

    return gallery_list

def extract_faqs(company):
    faqs_list = []
    seen_questions = set()

    # 1. From company_faqs relation
    for item in (company.get("company_faqs") or []):
        q = item.get("question") or item.get("q")
        a = item.get("answer") or item.get("a")
        if q and a and q.strip() not in seen_questions:
            seen_questions.add(q.strip())
            faqs_list.append({"question": q.strip(), "answer": a.strip()})

    # 2. From faqs JSON column
    raw_faqs = company.get("faqs")
    if isinstance(raw_faqs, str):
        try:
            raw_faqs = json.loads(raw_faqs)
        except Exception:
            raw_faqs = []
    if isinstance(raw_faqs, list):
        for item in raw_faqs:
            if isinstance(item, dict):
                q = item.get("question") or item.get("q")
                a = item.get("answer") or item.get("a")
                if q and a and q.strip() not in seen_questions:
                    seen_questions.add(q.strip())
                    faqs_list.append({"question": q.strip(), "answer": a.strip()})

    return faqs_list

def extract_reviews(company):
    reviews_data = company.get("company_reviews") or []
    valid_reviews = []
    total_stars = 0

    for r in reviews_data:
        try:
            rating = int(r.get("rating", 5))
        except (ValueError, TypeError):
            rating = 5
        rating = max(1, min(5, rating))

        raw_name = r.get("reviewer_name") or "Khách hàng B2B"
        reviewer_comp = r.get("reviewer_company")
        if not reviewer_comp and "(" in raw_name and ")" in raw_name:
            match = re.match(r'^(.*?)\s*\((.*?)\)$', raw_name)
            if match:
                raw_name = match.group(1).strip()
                reviewer_comp = match.group(2).strip()

        content = r.get("review_text") or r.get("content") or ""
        created_at = r.get("created_at") or datetime.now(timezone.utc).isoformat()
        date_display = created_at.split("T")[0] if "T" in str(created_at) else str(created_at)

        valid_reviews.append({
            "id": r.get("id"),
            "reviewer_name": raw_name,
            "reviewer_company": reviewer_comp,
            "rating": rating,
            "title": r.get("title") or "",
            "content": content,
            "is_verified": r.get("is_verified", True),
            "created_at": created_at,
            "date_display": date_display
        })
        total_stars += rating

    review_count = len(valid_reviews)
    if review_count > 0:
        avg_rating = round(total_stars / review_count, 1)
        rating_val = f"{avg_rating:.1f}"
    else:
        rating_val = "5.0"

    return valid_reviews, rating_val, review_count

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
    print("VNSupplier - Static Page Generator (Media & Trust Enhanced)")
    print("=" * 60)

    os.makedirs(COMPANIES_OUT_DIR, exist_ok=True)
    
    env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))
    template = env.get_template("company-profile.html")

    print("Fetching all companies and child records from Supabase...")
    select_query = (
        "id,name,slug,website,industry,province,district,founded_year,employee_range,"
        "tax_code,description,ai_summary,logo_url,cover_url,video_url,gallery_urls,faqs,is_featured,featured,capabilities,"
        "updated_at,company_products(id,name,category,description,source_url),"
        "company_contacts(id,contact_type,value,label),"
        "company_certifications(id,cert_name,issued_by,cert_number),"
        "company_facts(id,field_name,value,evidence),"
        "company_reviews(id,rating,title,content,reviewer_name,created_at),"
        "company_gallery(id,image_url,caption),"
        "company_faqs(id,question,answer)"
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

        # Extract Media, Gallery, Video, FAQs, Reviews
        gallery_images = extract_gallery(c)
        video_url = c.get("video_url")
        video_embed_url = get_video_embed_url(video_url)
        faqs_list = extract_faqs(c)
        reviews_list, rating_val, review_count = extract_reviews(c)

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
            "video_url": video_url,
            "video_embed_url": video_embed_url,
            "gallery_images": gallery_images,
            "faqs": faqs_list,
            "reviews": reviews_list,
            "rating_val": rating_val,
            "review_count": review_count,
            "industry": industry_name,
            "industry_slug": industry_slug,
            "province": province_name,
            "province_slug": province_slug,
            "district": c.get("district"),
            "founded_year": c.get("founded_year"),
            "employee_range": c.get("employee_range"),
            "tax_code": c.get("tax_code"),
            "is_featured": c.get("is_featured") or c.get("featured", False),
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
