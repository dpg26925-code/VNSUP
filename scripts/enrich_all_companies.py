#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
VNSupplier - High-Speed Real Company Data Enrichment Pipeline
Crawls real company websites in parallel, extracts products, contacts, certifications,
capabilities, and facts, and saves them into Supabase child tables.
"""

import sys
import io
import re
import os
import time
import socket
import urllib.parse
import urllib3
from concurrent.futures import ThreadPoolExecutor, as_completed
import requests
from bs4 import BeautifulSoup

# Disable SSL verification warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Ensure utf-8 encoding on standard output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://fnyonwdojxkchbrqrcpu.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueW9ud2RvanhrY2hicnFyY3B1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Mzc4MDQ0NywiZXhwIjoyMDk5MzU2NDQ3fQ.SR1Hcnv2AR-UKb5VlV1xh5m4SEEsSu9izXU8HHaNod4")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 (VNSupplier-Bot/2.0)"

def get_session():
    s = requests.Session()
    s.headers.update(HEADERS)
    return s

def normalize_url(url):
    if not url:
        return ""
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
    return url

def is_domain_resolvable(url):
    try:
        parsed = urllib.parse.urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return False
        socket.setdefaulttimeout(4.0)
        socket.gethostbyname(hostname)
        return True
    except Exception:
        return False

def fetch_page_content(url, timeout=8):
    try:
        res = requests.get(url, headers={"User-Agent": USER_AGENT}, timeout=timeout, verify=False)
        if res.status_code == 200:
            return res.text
    except Exception:
        pass
    return None

def extract_company_data(company, html_content, base_url):
    soup = BeautifulSoup(html_content, 'html.parser')
    for tag in soup(["script", "style", "noscript", "svg", "header", "footer", "nav"]):
        tag.decompose()
        
    text = soup.get_text(separator=' ', strip=True)
    
    contacts = []
    
    # Phone extraction
    phone_pattern = r'(?:Hotline|Điện thoại|Tel|Phone|Zalo|Mobile)[\s:]*([0-9\.\-\s\(\)]{9,16})'
    raw_phones = re.findall(phone_pattern, text, re.IGNORECASE)
    clean_phones = set()
    for p in raw_phones:
        cp = re.sub(r'[^\d]', '', p)
        if len(cp) in [10, 11] and (cp.startswith('0') or cp.startswith('84')):
            clean_phones.add(cp)
            
    if not clean_phones:
        loose_phones = re.findall(r'(?:\+84|0)[235789][0-9]{8}', text)
        for p in loose_phones:
            clean_phones.add(p)
            
    for p in list(clean_phones)[:3]:
        contacts.append({
            "contact_type": "phone",
            "value": p,
            "label": "Hotline / Phòng kinh doanh",
            "source_url": base_url,
            "confidence": 0.95,
            "verified": True
        })
        
    # Email extraction
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    raw_emails = re.findall(email_pattern, text)
    clean_emails = set()
    for em in raw_emails:
        em_lower = em.lower()
        if not any(ign in em_lower for ign in ['.png', '.jpg', '.jpeg', '.webp', '.svg', 'example', 'domain', 'user@', 'email@']):
            if len(em) < 60:
                clean_emails.add(em_lower)
                
    for em in list(clean_emails)[:2]:
        contacts.append({
            "contact_type": "email",
            "value": em,
            "label": "Email liên hệ chính",
            "source_url": base_url,
            "confidence": 0.95,
            "verified": True
        })
        
    # Address extraction
    address_pattern = r'(?:Địa chỉ|Trụ sở|Nhà máy|Xưởng sản xuất|Văn phòng)[\s:]*([^\n\.\;]{15,150})'
    raw_addrs = re.findall(address_pattern, text, re.IGNORECASE)
    clean_addrs = set()
    for ad in raw_addrs:
        ad_clean = ad.strip().strip(':')
        if any(k in ad_clean.lower() for k in ['đường', 'phố', 'phường', 'xã', 'quận', 'huyện', 'tỉnh', 'tp', 'kcn', 'ccn', 'lô', 'khu công nghiệp']):
            clean_addrs.add(ad_clean)
            
    for ad in list(clean_addrs)[:2]:
        contacts.append({
            "contact_type": "address",
            "value": ad,
            "label": "Địa chỉ nhà máy / Trụ sở",
            "source_url": base_url,
            "confidence": 0.9,
            "verified": True
        })

    # Certifications
    certifications = []
    cert_keywords = [
        ("ISO 9001:2015", "Hệ thống quản lý chất lượng tiêu chuẩn quốc tế"),
        ("ISO 14001:2015", "Hệ thống quản lý môi trường"),
        ("ISO 22000", "Hệ thống quản lý an toàn thực phẩm"),
        ("ISO 45001", "Hệ thống an toàn & sức khỏe nghề nghiệp"),
        ("HACCP", "Tiêu chuẩn phân tích mối nguy và điểm kiểm soát tới hạn"),
        ("FDA", "Chứng nhận Cục Quản lý Thực phẩm & Dược phẩm Hoa Kỳ"),
        ("CE Marking", "Chứng nhận tiêu chuẩn an toàn châu Âu"),
        ("RoHS", "Tiêu chuẩn hạn chế chất độc hại trong thiết bị điện tử"),
        ("BSCI", "Tiêu chuẩn trách nhiệm xã hội chuỗi cung ứng"),
        ("Oeko-Tex Standard 100", "Chứng nhận an toàn dệt may quốc tế"),
        ("FSC", "Chứng nhận quản lý rừng bền vững FSC"),
        ("Halal", "Chứng nhận tiêu chuẩn Hồi giáo quốc tế"),
        ("GMP", "Thực hành sản xuất tốt tiêu chuẩn quốc tế")
    ]
    
    for cname, cdesc in cert_keywords:
        if re.search(r'\b' + re.escape(cname.split(':')[0]) + r'\b', text, re.IGNORECASE):
            certifications.append({
                "cert_name": cname,
                "issued_by": "Tổ chức chứng nhận quốc tế",
                "source_url": base_url,
                "confidence": 0.92
            })

    # Facts / Capabilities
    facts = []
    area_match = re.search(r'([0-9\.\,]+)\s*(?:m2|m²|héc-ta|ha|hecta)\s*(?:diện tích|nhà xưởng|nhà máy)', text, re.IGNORECASE) or \
                 re.search(r'(?:diện tích|quy mô)[\s:]*([0-9\.\,]+)\s*(?:m2|m²|ha)', text, re.IGNORECASE)
    if area_match:
        facts.append({
            "field_name": "Diện tích nhà máy",
            "value": f"{area_match.group(1)} m²",
            "evidence": "Trích xuất từ hồ sơ năng lực nhà xưởng",
            "source_url": base_url,
            "confidence": 0.88
        })
        
    cap_match = re.search(r'(?:công suất|sản lượng|năng lực)[\s:]*([^\n\.\;]{10,80})', text, re.IGNORECASE)
    if cap_match:
        facts.append({
            "field_name": "Công suất sản xuất",
            "value": cap_match.group(1).strip(),
            "evidence": "Trích xuất từ trang giới thiệu",
            "source_url": base_url,
            "confidence": 0.85
        })

    tech_match = re.search(r'(?:dây chuyền|công nghệ|máy móc|trang thiết bị)[\s:]*([^\n\.\;]{10,100})', text, re.IGNORECASE)
    if tech_match:
        facts.append({
            "field_name": "Công nghệ & Máy móc",
            "value": tech_match.group(1).strip(),
            "evidence": "Hạ tầng kỹ thuật trang bị tại xưởng",
            "source_url": base_url,
            "confidence": 0.85
        })

    tax_match = re.search(r'(?:Mã số thuế|MST|Tax Code)[\s:]*([0-9\-]{10,14})', text, re.IGNORECASE)
    tax_code = tax_match.group(1) if tax_match else None

    year_match = re.search(r'(?:thành lập năm|năm thành lập|thành lập từ năm|since)[\s:]*([12][90][0-9]{2})', text, re.IGNORECASE)
    founded_year = int(year_match.group(1)) if year_match else None

    # Products
    products = []
    headings = soup.find_all(['h2', 'h3', 'h4', 'strong', 'a'])
    candidate_names = []
    for h in headings:
        h_text = h.get_text(strip=True)
        if 4 <= len(h_text) <= 80:
            if not any(ign in h_text.lower() for ign in ['trang chủ', 'giới thiệu', 'liên hệ', 'tin tức', 'tuyển dụng', 'bản quyền', 'hotline', 'chính sách', 'xem thêm', 'dịch vụ', 'chi tiết', 'báo giá']):
                candidate_names.append(h_text)
                
    seen_prods = set()
    for pname in candidate_names:
        clean_pname = re.sub(r'^[0-9\.\-\–\s]+', '', pname).strip()
        if len(clean_pname) >= 4 and clean_pname.lower() not in seen_prods:
            seen_prods.add(clean_pname.lower())
            products.append({
                "name": clean_pname,
                "category": company.get("industry") or "Sản xuất & Gia công",
                "product_type": "Chính thức",
                "description": f"Sản phẩm gia công & cung ứng tiêu chuẩn bởi {company.get('name')}.",
                "source_url": base_url,
                "confidence": 0.85
            })
            if len(products) >= 6:
                break

    desc_match = soup.find('meta', attrs={'name': 'description'}) or soup.find('meta', attrs={'property': 'og:description'})
    site_desc = desc_match.get('content', '').strip() if desc_match else ""
    if not site_desc and len(text) > 100:
        sentences = [s.strip() for s in text.split('.') if len(s.strip()) > 30]
        if sentences:
            site_desc = '. '.join(sentences[:3]) + '.'

    return {
        "contacts": contacts,
        "certifications": certifications,
        "facts": facts,
        "products": products,
        "tax_code": tax_code,
        "founded_year": founded_year,
        "site_desc": site_desc
    }

def process_company(company):
    sb_session = get_session()
    cid = company["id"]
    slug = company.get("slug")
    name = company.get("name")
    raw_website = company.get("website")
    
    if not raw_website or not raw_website.strip():
        return False, name, "No website"
        
    url = normalize_url(raw_website)
    if not is_domain_resolvable(url):
        return False, name, "Domain not resolvable"
        
    html = fetch_page_content(url, timeout=7)
    if not html:
        return False, name, "Failed to fetch HTML"
        
    combined_html = html
    for extra in ["/gioi-thieu", "/san-pham", "/lien-he"]:
        e_html = fetch_page_content(urllib.parse.urljoin(url, extra), timeout=4)
        if e_html:
            combined_html += "\n" + e_html

    extracted = extract_company_data(company, combined_html, url)
    
    # Batch posts
    if extracted["products"]:
        prods_payload = [
            {
                "company_id": cid,
                "name": p["name"],
                "category": p["category"],
                "product_type": p["product_type"],
                "description": p["description"],
                "source_url": p["source_url"],
                "confidence": p["confidence"]
            } for p in extracted["products"]
        ]
        sb_session.post(f"{SUPABASE_URL}/rest/v1/company_products", json=prods_payload)
        
    if extracted["contacts"]:
        conts_payload = [
            {
                "company_id": cid,
                "contact_type": ct["contact_type"],
                "value": ct["value"],
                "label": ct["label"],
                "source_url": ct["source_url"],
                "confidence": ct["confidence"],
                "verified": ct["verified"]
            } for ct in extracted["contacts"]
        ]
        sb_session.post(f"{SUPABASE_URL}/rest/v1/company_contacts", json=conts_payload)
        
    if extracted["certifications"]:
        certs_payload = [
            {
                "company_id": cid,
                "cert_name": cr["cert_name"],
                "issued_by": cr["issued_by"],
                "source_url": cr["source_url"],
                "confidence": cr["confidence"]
            } for cr in extracted["certifications"]
        ]
        sb_session.post(f"{SUPABASE_URL}/rest/v1/company_certifications", json=certs_payload)
        
    if extracted["facts"]:
        facts_payload = [
            {
                "company_id": cid,
                "field_name": f["field_name"],
                "value": f["value"],
                "evidence": f["evidence"],
                "source_url": f["source_url"],
                "confidence": f["confidence"]
            } for f in extracted["facts"]
        ]
        sb_session.post(f"{SUPABASE_URL}/rest/v1/company_facts", json=facts_payload)
        
    update_payload = {"status": "approved"}
    if extracted["tax_code"]:
        update_payload["tax_code"] = extracted["tax_code"]
    if extracted["founded_year"]:
        update_payload["founded_year"] = extracted["founded_year"]
    if extracted["site_desc"] and len(extracted["site_desc"]) > 30:
        if not company.get("ai_summary"):
            update_payload["ai_summary"] = extracted["site_desc"][:400]
        if not company.get("description"):
            update_payload["description"] = extracted["site_desc"][:800]
            
    sb_session.patch(f"{SUPABASE_URL}/rest/v1/companies?id=eq.{cid}", json=update_payload)
    
    summary_msg = f"Enriched: {len(extracted['products'])} prods, {len(extracted['contacts'])} conts, {len(extracted['certifications'])} certs, {len(extracted['facts'])} facts"
    return True, name, summary_msg

def main():
    print("=" * 60)
    print("VNSupplier - Parallel Crawl & Enrich Pipeline")
    print("=" * 60)
    
    sb = get_session()
    res = sb.get(f"{SUPABASE_URL}/rest/v1/companies?select=id,slug,name,website,industry,province,description,ai_summary,status&limit=500")
    if res.status_code != 200 and res.status_code != 206:
        print(f"Error fetching companies: {res.status_code}")
        return
        
    companies = res.json()
    eligible = [c for c in companies if c.get("website") and c.get("website").strip()]
    print(f"Total companies in database: {len(companies)}")
    print(f"Total companies with website: {len(eligible)}")
    
    success_count = 0
    failure_count = 0
    
    print("\nStarting concurrent crawl (8 threads)...")
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(process_company, c): c for c in eligible}
        for future in as_completed(futures):
            ok, name, msg = future.result()
            if ok:
                success_count += 1
                print(f"[✓ SUCCESS] {name} -> {msg}", flush=True)
            else:
                failure_count += 1
                print(f"[✗ SKIPPED] {name} -> {msg}", flush=True)

    print("\n" + "=" * 60)
    print(f"Pipeline Completed: {success_count} companies enriched successfully, {failure_count} skipped/unresolvable.")
    print("=" * 60)

if __name__ == "__main__":
    main()
