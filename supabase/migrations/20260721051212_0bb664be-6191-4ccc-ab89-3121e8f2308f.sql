
-- ============= ENUMS =============
CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected');

-- ============= COMPANIES =============
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  province TEXT,
  district TEXT,
  industry TEXT,
  sub_industry TEXT,
  employee_range TEXT,
  founded_year INTEGER,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  description TEXT,
  ai_summary TEXT,
  capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
  logo_url TEXT,
  cover_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'manual',
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_companies_province ON public.companies(province);
CREATE INDEX idx_companies_industry ON public.companies(industry);
CREATE INDEX idx_companies_slug ON public.companies(slug);
CREATE INDEX idx_companies_search ON public.companies USING GIN (
  to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(industry,'') || ' ' || coalesce(province,''))
);

GRANT SELECT ON public.companies TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update companies" ON public.companies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete companies" ON public.companies FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= CAPABILITIES =============
CREATE TABLE public.capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_capabilities_company ON public.capabilities(company_id);
GRANT SELECT ON public.capabilities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capabilities TO authenticated;
GRANT ALL ON public.capabilities TO service_role;
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view capabilities" ON public.capabilities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage capabilities" ON public.capabilities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= PRODUCTS =============
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_company ON public.products(company_id);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= COMPANY_CLAIMS =============
CREATE TABLE public.company_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  note TEXT,
  status public.claim_status NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.company_claims TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.company_claims TO authenticated;
GRANT ALL ON public.company_claims TO service_role;
ALTER TABLE public.company_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submit claims" ON public.company_claims FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view claims" ON public.company_claims FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage claims" ON public.company_claims FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= LEADS =============
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  message TEXT,
  source_page TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_company ON public.leads(company_id);
GRANT INSERT ON public.leads TO anon, authenticated;
GRANT SELECT, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone submit leads" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete leads" ON public.leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============= SAVED_SEARCHES =============
CREATE TABLE public.saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_saved_searches_user ON public.saved_searches(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_searches TO authenticated;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved searches" ON public.saved_searches FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============= COMPANY_UPDATES =============
CREATE TABLE public.company_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_company_updates_company ON public.company_updates(company_id);
GRANT SELECT ON public.company_updates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_updates TO authenticated;
GRANT ALL ON public.company_updates TO service_role;
ALTER TABLE public.company_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view updates" ON public.company_updates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage updates" ON public.company_updates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============= SEED 20 COMPANIES =============
INSERT INTO public.companies (name, slug, province, district, industry, sub_industry, employee_range, founded_year, website, phone, email, address, description, ai_summary, capabilities, verified, featured) VALUES
-- Plastics / Injection Molding (5)
('Công ty TNHH Nhựa Duy Tân Bình Dương', 'nhua-duy-tan-binh-duong', 'Bình Dương', 'Dĩ An', 'Nhựa', 'Ép nhựa', '201-500', 2005, 'https://duytan.com', '0274-3789456', 'sales@duytan.com', 'KCN Dĩ An, Bình Dương', 'Chuyên ép phun nhựa kỹ thuật, bao bì thực phẩm và linh kiện gia dụng.', 'Nhà máy quy mô lớn với 30+ máy ép phun 50-800 tấn, đáp ứng đơn hàng OEM/ODM cho khách nội địa và xuất khẩu. Phù hợp cho khách cần ép nhựa kỹ thuật, bao bì và linh kiện gia dụng số lượng lớn.', '["Ép phun nhựa","In lụa","Lắp ráp","Khuôn mẫu","QC ISO 9001"]'::jsonb, true, true),
('Nhựa Ngọc Nghĩa Đồng Nai', 'nhua-ngoc-nghia-dong-nai', 'Đồng Nai', 'Biên Hòa', 'Nhựa', 'Chai PET', '500+', 1993, 'https://ngocnghia.com', '0251-3836123', 'contact@ngocnghia.com', 'KCN Biên Hòa 2, Đồng Nai', 'Sản xuất chai PET, nắp và preform cho ngành nước giải khát và mỹ phẩm.', 'Chuyên chai PET và preform quy mô công nghiệp, cung ứng cho các brand FMCG lớn. Phù hợp buyer trong ngành nước giải khát, thực phẩm và mỹ phẩm cần đối tác ổn định lâu dài.', '["Thổi chai PET","Preform","In offset","Kho lạnh"]'::jsonb, true, true),
('Nhựa Bình Minh', 'nhua-binh-minh', 'TP.HCM', 'Bình Tân', 'Nhựa', 'Ống nhựa', '500+', 1977, 'https://binhminhplastic.com', '028-3752345', 'info@binhminhplastic.com', 'KCN Tân Thuận EPZ, TP.HCM', 'Nhà sản xuất ống nhựa PVC, HDPE, PP-R hàng đầu Việt Nam.', 'Đơn vị dẫn đầu về ống nhựa xây dựng và cấp thoát nước, hệ thống phân phối toàn quốc. Phù hợp cho nhà thầu, distributor xây dựng và dự án hạ tầng.', '["Đùn ống PVC","HDPE","PP-R","Phụ kiện ống"]'::jsonb, true, false),
('Nhựa Long Thành', 'nhua-long-thanh', 'Bình Dương', 'Thuận An', 'Nhựa', 'Nhựa gia dụng', '51-200', 2008, 'https://longthanhplastic.vn', '0274-3651234', 'sales@longthanhplastic.vn', 'KCN Sóng Thần 1, Bình Dương', 'Sản xuất đồ gia dụng nhựa: rổ, thau, ghế nhựa.', 'Nhà xưởng ép phun đa dạng chủng loại đồ gia dụng, phù hợp cho các nhà phân phối bán lẻ và thị trường Đông Nam Á.', '["Ép phun","In UV","Đóng gói"]'::jsonb, false, false),
('Nhựa An Phú', 'nhua-an-phu', 'Đồng Nai', 'Nhơn Trạch', 'Nhựa', 'Bao bì mềm', '51-200', 2012, 'https://anphuplastic.vn', '0251-3567890', 'hello@anphuplastic.vn', 'KCN Nhơn Trạch 2, Đồng Nai', 'Bao bì nhựa mềm in flexo cho ngành thực phẩm và nông sản.', 'Chuyên bao bì mềm in flexo 8 màu, phù hợp cho khách F&B và nông sản xuất khẩu cần bao bì chất lượng cao.', '["In flexo 8 màu","Ghép màng","Cắt túi","Food-grade"]'::jsonb, true, false),

-- CNC (4)
('Cơ khí Chính xác Duy Khanh', 'co-khi-duy-khanh', 'TP.HCM', 'Quận 12', 'CNC', 'Gia công CNC', '51-200', 2000, 'https://duykhanh.com.vn', '028-38765432', 'sales@duykhanh.com.vn', 'KCN Tân Bình, TP.HCM', 'Gia công CNC phay, tiện chính xác cho ngành ô tô, xe máy.', 'Xưởng CNC 5-trục với dung sai ±0.005mm, phục vụ khách hàng ô tô, xe máy và thiết bị y tế. Phù hợp cho OEM cần độ chính xác cao.', '["CNC 5-trục","Tiện CNC","Phay CNC","Đo CMM","ISO 9001"]'::jsonb, true, true),
('CNC Precision Bắc Ninh', 'cnc-precision-bac-ninh', 'Bắc Ninh', 'Yên Phong', 'CNC', 'Gia công CNC', '51-200', 2015, 'https://cncprecision.vn', '0222-3612345', 'info@cncprecision.vn', 'VSIP Bắc Ninh', 'Gia công CNC cho ngành điện tử và Samsung supplier.', 'Nhà cung ứng CNC lớp 2 cho Samsung, chuyên linh kiện điện thoại và điện tử tiêu dùng. Phù hợp cho brand điện tử cần đối tác trong chuỗi cung ứng.', '["CNC phay","EDM","Anodize","Samsung 2nd-tier"]'::jsonb, true, false),
('Cơ khí Á Châu', 'co-khi-a-chau', 'Bình Dương', 'Thuận An', 'CNC', 'Gia công cơ khí', '11-50', 2010, 'https://achau-mech.vn', '0274-3799012', 'contact@achau-mech.vn', 'KCN Bình Đường, Bình Dương', 'Gia công cơ khí, chế tạo khuôn mẫu.', 'Xưởng cơ khí trung bình, mạnh về chế tạo khuôn dập và jig-fixture. Phù hợp cho nhà máy cần đối tác làm khuôn và tooling.', '["Chế tạo khuôn","Jig fixture","Tiện","Phay"]'::jsonb, false, false),
('Cơ khí Toàn Cầu Đồng Nai', 'co-khi-toan-cau', 'Đồng Nai', 'Long Thành', 'CNC', 'Cơ khí chính xác', '201-500', 2007, 'https://toancau-mech.com', '0251-3987654', 'sales@toancau-mech.com', 'KCN Amata, Đồng Nai', 'Gia công cơ khí chính xác cho ngành hàng không, y tế.', 'Đơn vị được chứng nhận AS9100, phục vụ chuỗi cung ứng hàng không và thiết bị y tế. Phù hợp buyer aerospace/medical cần đối tác chứng nhận cao cấp.', '["CNC 5-trục","AS9100","ISO 13485","Titanium","Inconel"]'::jsonb, true, true),

-- Electronics / SMT (3)
('SMT Vina Bắc Ninh', 'smt-vina-bac-ninh', 'Bắc Ninh', 'Từ Sơn', 'Điện tử', 'SMT Assembly', '201-500', 2013, 'https://smtvina.vn', '0222-3654321', 'sales@smtvina.vn', 'KCN VSIP Bắc Ninh', 'Lắp ráp bo mạch SMT cho điện tử tiêu dùng.', 'Nhà máy SMT với 6 line tự động, năng lực 500K bo/tháng. Phù hợp cho brand điện tử tiêu dùng, IoT cần đối tác EMS gần Hà Nội.', '["SMT","AOI","X-Ray","BGA","IPC-A-610"]'::jsonb, true, true),
('Điện tử Hà Vinh', 'dien-tu-ha-vinh', 'Hải Phòng', 'An Dương', 'Điện tử', 'PCBA', '51-200', 2011, 'https://havinh-electronics.vn', '0225-3543210', 'info@havinh-electronics.vn', 'KCN Nomura, Hải Phòng', 'Lắp ráp PCBA và cụm cable cho thiết bị công nghiệp.', 'Xưởng PCBA quy mô vừa, chuyên đơn hàng cable harness và bo mạch công nghiệp. Phù hợp cho khách máy móc công nghiệp và automation.', '["PCBA","Cable harness","Through-hole","Testing"]'::jsonb, true, false),
('Elechub Bắc Ninh', 'elechub-bac-ninh', 'Bắc Ninh', 'Yên Phong', 'Điện tử', 'EMS', '201-500', 2016, 'https://elechub.vn', '0222-3765432', 'hello@elechub.vn', 'KCN Yên Phong, Bắc Ninh', 'EMS trọn gói cho startup phần cứng.', 'Đối tác EMS linh hoạt cho low-volume/high-mix, hỗ trợ từ DFM đến box-build. Phù hợp cho startup phần cứng và sản phẩm IoT giai đoạn đầu.', '["SMT","Box-build","DFM","Low-volume","Prototype"]'::jsonb, false, true),

-- Metal Fabrication (3)
('Cơ khí Kim loại Sao Việt', 'kim-loai-sao-viet', 'Bình Dương', 'Bến Cát', 'Kim loại', 'Gia công tấm', '51-200', 2004, 'https://saoviet-metal.vn', '0274-3888999', 'sales@saoviet-metal.vn', 'KCN Mỹ Phước 2, Bình Dương', 'Cắt laser, chấn, hàn kim loại tấm.', 'Xưởng gia công kim loại tấm với máy laser fiber 6kW, phục vụ nội thất, kiosk và tủ điện. Phù hợp cho khách cần OEM sản phẩm kim loại tấm.', '["Cắt laser","Chấn CNC","Hàn MIG/TIG","Sơn tĩnh điện"]'::jsonb, true, false),
('Metal Works Đồng Nai', 'metal-works-dong-nai', 'Đồng Nai', 'Trảng Bom', 'Kim loại', 'Kết cấu thép', '51-200', 2009, 'https://metalworks.vn', '0251-3456789', 'contact@metalworks.vn', 'KCN Sông Mây, Đồng Nai', 'Sản xuất kết cấu thép cho nhà xưởng.', 'Nhà máy kết cấu thép công suất 5000 tấn/năm, thi công trọn gói nhà xưởng thép tiền chế. Phù hợp cho nhà đầu tư KCN và logistics.', '["Kết cấu thép","Nhà tiền chế","Sơn epoxy","Lắp dựng"]'::jsonb, true, false),
('Kim khí Hải Phòng', 'kim-khi-hai-phong', 'Hải Phòng', 'Kiến An', 'Kim loại', 'Cắt tấm', '11-50', 2014, 'https://kimkhihp.vn', '0225-3987012', 'info@kimkhihp.vn', 'CCN Vĩnh Niệm, Hải Phòng', 'Cắt tôn, gia công tủ điện.', 'Xưởng cắt tôn và làm tủ điện cho ngành xây dựng phía Bắc. Phù hợp cho nhà thầu điện và nhà máy vừa.', '["Cắt plasma","Chấn","Tủ điện","Sơn"]'::jsonb, false, false),

-- Packaging (2)
('Bao bì Tân Á', 'bao-bi-tan-a', 'Bình Dương', 'Tân Uyên', 'Bao bì', 'Thùng carton', '201-500', 2003, 'https://tanapackaging.vn', '0274-3765123', 'sales@tanapackaging.vn', 'KCN Nam Tân Uyên, Bình Dương', 'Sản xuất thùng carton 3-5 lớp và pallet giấy.', 'Nhà máy carton sóng công suất 3000 tấn/tháng, in flexo 4 màu. Phù hợp cho khách FMCG, xuất khẩu cần đối tác bao bì ổn định.', '["Carton sóng","In flexo","Pallet giấy","FSC"]'::jsonb, true, true),
('Bao bì Việt Phát', 'bao-bi-viet-phat', 'TP.HCM', 'Bình Chánh', 'Bao bì', 'Hộp giấy', '51-200', 2011, 'https://vietphatpack.vn', '028-37651234', 'info@vietphatpack.vn', 'KCN Lê Minh Xuân, TP.HCM', 'Hộp giấy in offset cao cấp cho mỹ phẩm, thực phẩm.', 'Xưởng offset UV cho hộp giấy cao cấp, gia công cấn bế đa dạng. Phù hợp cho mỹ phẩm, F&B premium và quà tặng doanh nghiệp.', '["Offset UV","Cấn bế","Ép kim","Gia công đặc biệt"]'::jsonb, true, false),

-- Rubber / Mold (2)
('Cao su Kỹ thuật Tân Bình', 'cao-su-tan-binh', 'Bình Dương', 'Dĩ An', 'Cao su', 'Chi tiết cao su', '11-50', 2006, 'https://tanbinhrubber.vn', '0274-3444555', 'sales@tanbinhrubber.vn', 'KCN Sóng Thần 2, Bình Dương', 'Sản xuất gioăng, phớt cao su kỹ thuật.', 'Xưởng cao su kỹ thuật với đội thiết kế khuôn nội bộ, phục vụ ngành ô tô và điện tử. Phù hợp cho OEM cần chi tiết cao su theo bản vẽ.', '["Ép cao su","NBR/EPDM/Silicone","Thiết kế khuôn"]'::jsonb, false, false),
('Rubber Mold Đồng Nai', 'rubber-mold-dong-nai', 'Đồng Nai', 'Long Thành', 'Cao su', 'Khuôn cao su', '11-50', 2013, 'https://rubbermold.vn', '0251-3765432', 'contact@rubbermold.vn', 'KCN Long Thành, Đồng Nai', 'Chế tạo khuôn và ép sản phẩm cao su-silicone.', 'Chuyên khuôn silicone cho ngành y tế và tiêu dùng, sạch cấp thực phẩm. Phù hợp cho brand medical/consumer cần đối tác silicone.', '["Khuôn silicone","Ép silicone","Food-grade","Medical-grade"]'::jsonb, true, false),

-- Textile (1)
('Dệt May Sài Gòn 3', 'det-may-sai-gon-3', 'TP.HCM', 'Quận 12', 'Dệt may', 'May mặc', '500+', 1985, 'https://saigon3.com.vn', '028-37651900', 'export@saigon3.com.vn', 'KCN Tân Thới Hiệp, TP.HCM', 'Xuất khẩu hàng may mặc sang Mỹ, EU, Nhật.', 'Nhà máy may quy mô lớn với 40+ chuyền may, khách hàng gồm các brand thời trang quốc tế. Phù hợp cho buyer thời trang Mỹ/EU/Nhật cần đối tác FOB/CMT ổn định.', '["FOB","CMT","WRAP","BSCI","Woven","Knit"]'::jsonb, true, true);
