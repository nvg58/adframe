# Adframe — PRD (Product Requirements Document)

> Tài liệu này dùng để build app với Claude Code. Đọc toàn bộ trước khi bắt đầu code.

---

## 1. TỔNG QUAN SẢN PHẨM

### Mục tiêu
Web app giúp người dùng thu thập bài học copywriting từ Skool, đọc trên Kindle, dịch tự động, lưu swipe file các ad tốt để học hỏi, và export nội dung sang Claude Project để cải thiện kỹ năng viết ad copy.

### Tech Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (Google OAuth + Email OTP) |
| Database | Supabase Postgres |
| File Storage | Supabase Storage (lưu screenshot ad) |
| Translate | Google Cloud Translation API (free tier) |
| Hosting | Vercel |
| Browser Extension | Chrome Extension (Manifest V3) |

### Người dùng mục tiêu
Người học copywriting, đang dùng Skool để học, muốn đọc lại trên Kindle và áp dụng vào ad copy.

---

## 2. AUTHENTICATION

### 2.1 Desktop — Google OAuth
- Dùng Supabase Auth với provider Google
- Sau khi login → redirect đến `/inbox`
- Lưu session trong Supabase (httpOnly cookie)

### 2.2 Kindle — Email OTP
- URL: `/login/kindle`
- UI tối giản, font lớn, phù hợp Kindle browser
- Flow:
  1. User nhập email
  2. Supabase gửi OTP 6 số qua email (dùng `supabase.auth.signInWithOtp`)
  3. User nhập OTP → authenticated
  4. Redirect đến `/read` (Kindle reader view)
- Không dùng popup, không dùng redirect OAuth (Kindle browser không support tốt)

### 2.3 Route Protection
- `/inbox`, `/swipe`, `/tests` → yêu cầu auth, redirect về `/login` nếu chưa đăng nhập
- `/read/*` → yêu cầu auth, redirect về `/login/kindle`
- Middleware Next.js kiểm tra session Supabase

---

## 3. DATABASE SCHEMA (Supabase Postgres)

```sql
-- Bảng users được quản lý tự động bởi Supabase Auth (auth.users)
-- Tạo bảng public.profiles để lưu thêm thông tin

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Inbox items: raw content từ Skool
CREATE TABLE public.inbox_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,           -- HTML hoặc plain text từ Skool
  source_url text,                 -- URL bài gốc trên Skool
  source_author text,              -- Tên tác giả bài post
  tags text[] DEFAULT '{}',
  status text DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Translations cache: tránh gọi Google Translate API nhiều lần
CREATE TABLE public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_item_id uuid REFERENCES public.inbox_items(id) ON DELETE CASCADE NOT NULL,
  paragraph_hash text NOT NULL,    -- MD5 hash của đoạn text gốc
  original_text text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(inbox_item_id, paragraph_hash)
);

-- Swipe file: lưu các ad tốt để tham khảo và phân tích
CREATE TABLE public.swipe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text,                      -- Tên gợi nhớ, optional
  ad_type text NOT NULL CHECK (ad_type IN ('image', 'video', 'text', 'url')),
  content_text text,               -- Nội dung text ad (nếu ad_type = 'text')
  content_url text,                -- Link video hoặc URL ad (nếu ad_type = 'video' | 'url')
  image_path text,                 -- Path trong Supabase Storage (nếu ad_type = 'image')
  platform text NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google', 'instagram', 'youtube', 'other')),
  category text NOT NULL CHECK (category IN ('hook', 'cta', 'visual', 'offer', 'other')),
  tags text[] DEFAULT '{}',
  notes text,                      -- Ghi chú phân tích của user: tại sao ad này tốt
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ad Tests: tracking creative tests theo cấu trúc Creative Hit Rate Tracker
-- Dựa trên template "(DUPLICATE ME) - MONTH" từ file ZENPULSE
CREATE TABLE public.ad_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inbox_item_id uuid REFERENCES public.inbox_items(id) ON DELETE SET NULL,

  -- Basic Info
  test_number int,                   -- Creative Test # (tự tăng theo tháng)
  launch_date date,
  creative_type text,                -- Static / Video / UGC / Motion Graphic / ...
  test_type text,                    -- New Concept / New Format / New Hook / Iteration / ...
  landing_page text,                 -- URL landing page
  ad_inspiration text,               -- Link ad tham khảo (swipe file)

  -- Strategy
  variable_testing text,             -- Desire / Angle / Awareness / Ad Format / ...
  problem_pain_point text,           -- Pain point đang khai thác
  mass_desire text,                  -- Mass desire đang target
  avatar text,                       -- Tên avatar (ví dụ: Health-Conscious Cat Parents)
  angle text,                        -- Góc tiếp cận
  ump text,                          -- Unique Mechanism of the Problem
  ums text,                          -- Unique Mechanism of the Solution
  lead_type text,                    -- Story / Statement / Question / ...
  awareness_level text,              -- Unaware / Problem Aware / Solution Aware / Product Aware

  -- Planning
  hypothesis text NOT NULL,          -- Hypothesis + lý do tự tin
  num_variations int DEFAULT 1,      -- Số lượng variations

  -- Results
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'launched', 'done')),
  results text,                      -- Winner / Loser / Breakeven / Inconclusive
  learnings_winner text,             -- Learnings nếu là Winner (sau 7 ngày)
  learnings_loser text,              -- Learnings nếu là Loser (sau 7 ngày)
  next_hypothesis text,              -- Hypothesis tiếp theo dựa trên learnings

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies: user chỉ thấy data của mình
CREATE POLICY "Users can CRUD own profiles" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can CRUD own inbox" ON public.inbox_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own translations" ON public.translations USING (
  EXISTS (SELECT 1 FROM public.inbox_items WHERE id = inbox_item_id AND user_id = auth.uid())
);
CREATE POLICY "Users can CRUD own swipe items" ON public.swipe_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can CRUD own ad_tests" ON public.ad_tests FOR ALL USING (auth.uid() = user_id);

-- Supabase Storage: bucket cho screenshot ads
-- Chạy trong Supabase dashboard > Storage > New bucket
-- Bucket name: "swipe-images"
-- Public: false (chỉ user có auth mới xem được)
-- Tạo policy cho bucket:
--   INSERT: auth.uid()::text = (storage.foldername(name))[1]
--   SELECT: auth.uid()::text = (storage.foldername(name))[1]
--   DELETE: auth.uid()::text = (storage.foldername(name))[1]
-- File path convention: {user_id}/{uuid}.{ext}
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 4. CẤU TRÚC PROJECT (Next.js)

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   ├── page.tsx              # Desktop login (Google OAuth)
│   │   │   └── kindle/
│   │   │       └── page.tsx          # Kindle login (Email OTP)
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts          # OAuth callback handler
│   ├── (desktop)/
│   │   ├── layout.tsx                # Desktop layout với sidebar
│   │   ├── inbox/
│   │   │   ├── page.tsx              # Danh sách inbox items
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Paste content vào inbox
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Chi tiết item + export
│   │   ├── swipe/
│   │   │   ├── page.tsx              # Grid swipe file, filter platform/category/tags
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Thêm ad mới vào swipe file
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Chi tiết ad + notes phân tích
│   │   ├── tests/
│   │   │   └── page.tsx              # Ad test tracker
│   │   └── settings/
│   │       └── page.tsx              # Hiển thị API token cho extension
│   ├── (kindle)/
│   │   ├── layout.tsx                # Kindle layout: no sidebar, font lớn
│   │   └── read/
│   │       ├── page.tsx              # Danh sách items (Kindle)
│   │       └── [id]/
│   │           └── page.tsx          # Reader mode với translate
│   └── api/
│       ├── translate/
│       │   └── route.ts              # POST: gọi Google Translate + cache
│       ├── swipe/
│       │   └── upload/
│       │       └── route.ts          # POST: upload screenshot lên Supabase Storage
│       ├── export/
│       │   └── route.ts              # GET: format item để export sang Claude Project
│       └── inbox/
│           └── route.ts              # POST: nhận bài từ browser extension
├── components/
│   ├── desktop/
│   │   ├── Sidebar.tsx
│   │   ├── InboxCard.tsx
│   │   ├── SwipeCard.tsx             # Card hiển thị ad trong grid
│   │   ├── SwipeFilters.tsx          # Filter bar: platform + category + tags
│   │   └── ExportButton.tsx
│   ├── kindle/
│   │   ├── ReaderParagraph.tsx       # Paragraph với nút dịch
│   │   └── TranslationBlock.tsx      # Hiển thị bản dịch phía dưới
│   └── shared/
│       ├── TagBadge.tsx
│       └── StatusBadge.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   └── server.ts                 # Server client (SSR)
│   ├── translate.ts                  # Google Translate helper
│   └── utils.ts                      # md5 hash, format text, etc.
├── middleware.ts                      # Auth route protection
└── extension/                        # Chrome Extension (thư mục riêng)
    ├── manifest.json
    ├── popup.html
    ├── popup.js
    ├── content.js
    └── background.js
```

---

## 5. CÁC TRANG VÀ TÍNH NĂNG

### 5.1 Trang `/inbox` (Desktop)
- Hiển thị danh sách tất cả inbox items của user
- Sort: mới nhất lên đầu
- Filter: theo status (unread / read) và tag
- Mỗi item card hiển thị: title, source_url, tags, status badge, ngày tạo
- Nút "Add New" → `/inbox/new`
- Click item → `/inbox/[id]`

### 5.2 Trang `/inbox/new` (Desktop)
- Form paste content từ Skool vào
- Fields:
  - `title` (text input, required)
  - `source_url` (text input, optional — link bài gốc)
  - `source_author` (text input, optional)
  - `content` (textarea lớn, required — paste raw text/HTML)
  - `tags` (tag input, optional — nhập tự do)
- Submit → lưu vào `inbox_items` với status `unread`
- Sau khi lưu → redirect về `/inbox/[id]`

### 5.3 Trang `/inbox/[id]` (Desktop)
- Hiển thị full content bài gốc (render HTML nếu có)
- Header: title, source_url, tags, ngày tạo, status badge
- Nút **"Export for Claude Project"** → mở modal với text đã format sẵn
- Nút **"Mark as Read"** → cập nhật status → `'read'`
- Nút **"Create Ad Test"** → mở form tạo ad test liên kết với item này

**"Export for Claude Project" modal:**
- Hiển thị text đã format sẵn (gọi `GET /api/export?inbox_item_id=uuid`)
- Nút "Copy to Clipboard"
- Hướng dẫn ngắn: *"Paste vào Claude Project Knowledge để Claude học từ bài này."*

### 5.4 Trang `/swipe` (Desktop)
- Grid layout (3 cột), hiển thị tất cả swipe items
- Filter bar ở trên cùng:
  - **Platform:** All / Facebook / TikTok / Google / Instagram / YouTube / Other
  - **Category:** All / Hook / CTA / Visual / Offer / Other
  - **Tags:** multi-select dropdown từ tags đang có
- Mỗi card hiển thị tùy theo `ad_type`:
  - `image` → thumbnail ảnh + title + platform badge + category badge
  - `video` → icon play + title + platform badge + category badge
  - `text` → preview 2-3 dòng đầu + platform badge + category badge
  - `url` → favicon + title + platform badge + category badge
- Click card → `/swipe/[id]`
- Nút "Add Ad" → `/swipe/new`

### 5.5 Trang `/swipe/new` (Desktop)
Form thêm ad mới. UI thay đổi theo `ad_type`:

**Bước 1 — Chọn loại ad:**
4 nút lớn để chọn: 📸 Screenshot / 🎬 Video / 📝 Text / 🔗 URL

**Bước 2 — Điền thông tin (tùy ad_type):**

Nếu `image`:
- Upload file (drag & drop hoặc click) — accept: image/*
- Preview ảnh trước khi submit
- Title (optional)

Nếu `video`:
- Input URL video (YouTube, TikTok, Facebook Watch...)
- Title (optional)

Nếu `text`:
- Textarea lớn paste nội dung ad
- Title (optional)

Nếu `url`:
- Input URL
- Title (optional)

**Bước 3 — Metadata (chung cho mọi loại):**
- Platform (select: Facebook / TikTok / Google / Instagram / YouTube / Other) — required
- Category (select: Hook / CTA / Visual / Offer / Other) — required
- Tags (tag input, optional)
- Notes (textarea — "Tại sao ad này tốt? Điểm gì đáng học?", optional)

Submit → lưu vào `swipe_items` → redirect về `/swipe/[id]`

### 5.6 Trang `/swipe/[id]` (Desktop)
Layout 2 cột:

**Cột trái (55%) — Hiển thị ad:**
- `image`: hiển thị ảnh full width, có nút download
- `video`: embed player nếu YouTube/TikTok, hoặc link button nếu không embed được
- `text`: render text với font lớn, dễ đọc, có nút copy
- `url`: link có preview card + nút mở tab mới

**Cột phải (45%) — Metadata + Notes:**
- Platform badge, Category badge, Tags
- Ngày lưu
- **Notes section:** textarea editable, auto-save khi blur
  - Placeholder: *"Ghi lại những gì bạn học được từ ad này — hook structure, CTA, offer framing..."*
- Nút Delete ad

### 5.7 Trang `/tests` (Desktop)

Giao diện theo đúng cấu trúc **Creative Hit Rate Tracker** (template ZENPULSE).

**Layout chính — Table view:**
- Mỗi row là 1 creative test
- Columns hiển thị (có thể scroll ngang):

| Column | Mô tả |
|---|---|
| # | Test number |
| Launch Date | Ngày launch |
| Creative Type | Static / Video / UGC / ... |
| Type of Test | New Concept / New Format / New Hook / Iteration |
| Variable Testing | Desire / Angle / Awareness / Ad Format |
| Avatar | Tên avatar |
| Awareness Level | Badge màu theo level |
| Hypothesis | Preview 1 dòng |
| Variations | Số lượng |
| Status | Planned / Launched / Done |
| Results | Winner 🟢 / Loser 🔴 / Inconclusive 🟡 |

- Click row → mở **Detail Panel** (slide-in từ phải) hoặc trang riêng

**Detail Panel / Trang `/tests/[id]`:**

Layout chia 3 section rõ ràng:

**Section 1 — Setup (điền trước khi launch):**
- Creative Test # + Launch Date + Creative Type + Type of Test
- Landing Page URL + Ad Inspiration URL
- Variable You're Testing
- Problem/Pain Point | Mass Desire | Avatar
- Angle | UMP | UMS
- Lead Type | Awareness Level
- **Hypothesis** (textarea lớn) — placeholder: *"What are you creating/testing? What gives you confidence this will improve performance?"*
- Number of Variations

**Section 2 — Results (điền sau khi launch):**
- Status toggle: Planned → Launched → Done
- Results: Winner / Loser / Breakeven / Inconclusive

**Section 3 — Learnings (điền sau 7 ngày):**
- Learnings for WINNERS (textarea)
- Learnings for LOSERS (textarea)
- **Next Hypothesis** (textarea) — placeholder: *"What hypothesis will you test next based on these learnings?"*
- Nút **"Create Next Test"** → pre-fill form test mới với `next_hypothesis`

**Nút "Add Test" → form modal** với tất cả fields trên
**Filter:** theo Status / Results / Avatar / Awareness Level / tháng launch

### 5.8 Trang `/settings` (Desktop)
- Hiển thị email và avatar của user
- Nút Logout

### 5.9 Trang `/read` (Kindle)
- Danh sách inbox items, font 18px minimum
- Hiển thị title, ngày tạo, status badge
- Click → `/read/[id]`
- Không có sidebar, không có animation

### 5.10 Trang `/read/[id]` (Kindle — Reader Mode)

Đây là trang quan trọng nhất cho Kindle. Yêu cầu kỹ thuật:

**Layout:**
- Full width, padding 16px mỗi bên
- Font: `font-serif`, size 18px, line-height 1.8
- Màu nền trắng thuần, chữ đen `#111`
- Không có fixed header/footer (gây lỗi scroll Kindle)
- Title ở đầu trang, large, bold

**Paragraph với translate:**
- Chia content thành từng đoạn (split theo `\n\n` hoặc `</p>`)
- Mỗi đoạn là component `<ReaderParagraph>`
- Cuối mỗi đoạn có nút nhỏ **"🌐 Dịch"**
- Khi click "Dịch":
  1. Gọi `POST /api/translate` với đoạn text đó
  2. Hiển thị spinner nhỏ
  3. Khi có kết quả: hiện block dịch ngay bên dưới đoạn gốc
  4. Block dịch: nền màu vàng nhạt `#FFFDE7`, italic, font nhỏ hơn 1px
  5. Nút chuyển thành "Ẩn dịch" để toggle
- State translate được lưu trong local React state (không cần persist)

**Kindle-specific CSS rules:**
```css
/* KHÔNG dùng những thứ này */
position: fixed;        /* Gây lỗi scroll */
hover:                  /* Không có hover trên Kindle */
transition/animation:   /* E-ink refresh chậm */
Google Fonts:           /* Load chậm, dùng system font */

/* NÊN dùng */
cursor: pointer;
onClick/onTouchEnd:
System font stack: Georgia, serif hoặc Arial, sans-serif
```

---

## 6. API ROUTES

### 6.1 `POST /api/swipe/upload`

Upload screenshot lên Supabase Storage.

**Request:** `multipart/form-data` với field `file` (image/*)

**Logic:**
1. Verify user auth
2. Validate file: chỉ accept image/*, max 10MB
3. Generate unique filename: `{user_id}/{uuid}.{ext}`
4. Upload lên Supabase Storage bucket `swipe-images`:
```javascript
const { data, error } = await supabase.storage
  .from('swipe-images')
  .upload(filePath, file, { contentType: file.type });
```
5. Return `{ path: filePath }` — lưu path này vào `swipe_items.image_path`

**Lấy URL để hiển thị ảnh:**
```javascript
const { data } = supabase.storage
  .from('swipe-images')
  .createSignedUrl(image_path, 3600); // URL có hiệu lực 1 giờ
```

---

### 6.2 `POST /api/translate`

**Request body:**
```json
{
  "inbox_item_id": "uuid",
  "text": "đoạn text cần dịch",
  "paragraph_hash": "md5 hash của text"
}
```

**Logic:**
1. Verify user auth (Supabase server client)
2. Check cache: `SELECT * FROM translations WHERE inbox_item_id = ? AND paragraph_hash = ?`
3. Nếu có cache → return `{ translated_text, cached: true }`
4. Nếu không có → gọi Google Translate API:

```javascript
const GOOGLE_TRANSLATE_URL = "https://translation.googleapis.com/language/translate/v2";

const response = await fetch(
  `${GOOGLE_TRANSLATE_URL}?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "en",
      target: "vi",
      format: "text"
    })
  }
);

const data = await response.json();
const translated = data.data.translations[0].translatedText;
```

5. Lưu vào bảng `translations` (INSERT OR IGNORE on conflict)
6. Return `{ translated_text, cached: false }`

---

### 6.3 `GET /api/export?inbox_item_id=uuid`

**Logic:**
1. Verify user auth
2. Fetch inbox_item theo id
3. Format thành text chuẩn để paste vào Claude Project Knowledge
4. Return `{ formatted_text: "..." }`

**Format output:**
```
📚 [title]
Nguồn: [source_url | "Skool"]
Tác giả: [source_author | "Unknown"]
Tags: [tag1, tag2]
Ngày lưu: [created_at formatted DD/MM/YYYY]

📖 NỘI DUNG:
[content — plain text, đã strip HTML]

---
```

---

### 6.4 `POST /api/inbox`

Endpoint này nhận bài từ Chrome Extension.

**Request header:** `Authorization: Bearer [supabase_access_token]`

**Request body:**
```json
{
  "title": "string",
  "content": "string",
  "source_url": "string",
  "source_author": "string",
  "tags": ["string"]
}
```

**Logic:**
1. Verify Bearer token bằng Supabase `getUser(token)`
2. Insert vào `inbox_items`
3. Return `{ "id": "uuid", "success": true }`

---

## 7. BROWSER EXTENSION (Chrome — Manifest V3)

### Mục tiêu
Khi đang xem bài post trên Skool, user click icon extension → **sidebar** mở ra bên phải màn hình → user vẫn thấy bài Skool ở trái → điền form → submit → bài được gửi vào Inbox.

### Files

```
extension/
├── manifest.json
├── background.js           # Service worker: mở sidebar khi click icon
├── sidepanel.html          # HTML của sidebar
├── sidepanel.js            # Logic sidebar: auth + form + submit
├── content.js              # Chạy trên page: extract content (Skool + generic)
├── lib/
│   └── Readability.js      # Mozilla Readability (github.com/mozilla/readability)
└── icon.png
```

**manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "Adframe — Skool Clipper",
  "version": "1.0",
  "description": "Gửi bài học từ Skool vào Second Brain",
  "permissions": ["activeTab", "storage", "scripting", "identity", "sidePanel"],
  "host_permissions": ["https://*.skool.com/*", "<all_urls>"],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "action": {
    "default_icon": "icon.png"
  },
  "background": {
    "service_worker": "background.js"
  },
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["openid", "email", "profile"]
  },
  "content_scripts": [{
    "matches": ["https://*.skool.com/*"],
    "js": ["content.js"]
  }]
}
```

**background.js — Mở sidebar khi click icon:**
```javascript
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
```

**Flow hoạt động:**
1. User đang xem bài trên Skool, click icon extension
2. Sidebar mở ra bên phải (user vẫn thấy nội dung Skool ở trái)
3. Nếu chưa login → hiển thị nút "Login with Google"
4. Nếu đã login → sidebar tự động extract nội dung trang hiện tại và điền sẵn vào form:
   - Title (auto-filled từ page title)
   - Source URL (auto-filled từ current URL)
   - Content (auto-extracted từ DOM qua message với content.js)
   - Tags (tag input, nhập tự do)
   - Nút "Send to Inbox"
5. Submit → gọi `POST https://[your-domain]/api/inbox` với Bearer token
6. Hiển thị success message ngay trong sidebar, form reset sẵn sàng clip bài tiếp theo

**Giao tiếp giữa sidebar và content script:**
```javascript
// sidepanel.js: yêu cầu content.js extract nội dung
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_CONTENT' });
// response = { title, url, content }
```

```javascript
// content.js: lắng nghe và trả về nội dung
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    sendResponse({
      title: extractTitle(),
      url: window.location.href,
      content: extractContent()
    });
  }
  return true; // giữ channel mở cho async response
});
```

**content.js — Content Extraction từ Skool và các trang khác:**

Dùng 3 strategy theo thứ tự ưu tiên:

```javascript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    const extractor = isSkoolPage() ? extractSkool() : extractGeneric();
    extractor
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // giữ channel mở cho async
  }
});

function isSkoolPage() {
  return location.hostname.endsWith('skool.com');
}
```

**Strategy 1 — Skool (dùng `__NEXT_DATA__`):**
Skool là Next.js SSR app → toàn bộ post data nằm trong thẻ `<script id="__NEXT_DATA__">`. Đây là cách parse chính xác nhất, không phụ thuộc vào CSS class:

```javascript
async function extractSkool() {
  const el = document.getElementById('__NEXT_DATA__');
  if (!el) return { success: false, error: "Không tìm thấy dữ liệu bài viết." };

  const data = JSON.parse(el.textContent);
  const post = data?.props?.pageProps?.postTree?.post;
  const meta = post?.metadata || {};
  const user = post?.user || {};

  // Parse attachments (ảnh trong bài)
  let attachments = [];
  try { attachments = JSON.parse(meta.attachmentsData || '[]'); } catch (_) {}

  const title = meta.title || document.title.replace(/\s*·.*$/, '').trim();
  const author = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const markdownContent = meta.content || '';

  // Convert Skool markdown → plain text
  const content = skoolMarkdownToText(markdownContent);

  return {
    success: true,
    title,
    content,
    author,
    url: window.location.href,
    siteName: 'Skool',
  };
}

// Skool dùng markdown + custom tags [ul][li] + obj:// links
function skoolMarkdownToText(md) {
  if (!md) return '';
  return md
    .replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g, '$1') // unescape
    .replace(/\[(@[^\]]+)\]\(obj:\/\/[^)]+\)/g, '$1')             // @mentions
    .replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g, '$1')           // links → text only
    .replace(/\[ul\]|\[\/ul\]|\[li\]|\[\/li\]/g, '')              // custom list tags
    .replace(/\*\*([^*]+)\*\*/g, '$1')                             // bold
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')                   // italic
    .replace(/^#{1,3} /gm, '')                                     // headings
    .trim();
}
```

**Strategy 2 — Generic (dùng Mozilla Readability):**
Cho các trang khác ngoài Skool. Inject `Readability.js` qua manifest, sau đó:

```javascript
async function extractGeneric() {
  const documentClone = document.cloneNode(true);
  const reader = new Readability(documentClone);
  const article = reader.parse();

  if (!article) return { success: false, error: "Không thể extract nội dung trang này." };

  return {
    success: true,
    title: article.title || document.title || 'Untitled',
    content: article.textContent.trim(),
    author: article.byline || '',
    url: window.location.href,
    siteName: article.siteName || location.hostname,
  };
}
```

Thêm Readability vào manifest:
```json
"content_scripts": [{
  "matches": ["<all_urls>"],
  "js": ["lib/Readability.js", "content.js"]
}]
```
Download `Readability.js` từ: https://github.com/mozilla/readability

**Auth trong Extension — Google OAuth qua `chrome.identity`:**

1. Khi user mở sidebar lần đầu: hiển thị nút "Login with Google"
2. Click → gọi `chrome.identity.getAuthToken({ interactive: true })`
3. Chrome tự xử lý OAuth flow → trả về Google `access_token`
4. Dùng token đó để xác thực với Supabase:
```javascript
const { data, error } = await supabase.auth.signInWithIdToken({
  provider: 'google',
  token: googleAccessToken
});
// Lưu supabase session vào chrome.storage.local
await chrome.storage.local.set({ session: data.session });
```
5. Từ đó, mọi request gửi kèm `session.access_token` trong header `Authorization: Bearer`
6. Khi token hết hạn → gọi lại `chrome.identity.getAuthToken` để refresh tự động (không cần user làm gì)

**manifest.json cần thêm:**
```json
{
  "permissions": ["activeTab", "storage", "scripting", "identity"],
  "oauth2": {
    "client_id": "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    "scopes": ["openid", "email", "profile"]
  }
}
```
Google Client ID phải là cùng Client ID đã cấu hình trong Supabase Google OAuth provider.

---

## 8. ENVIRONMENT VARIABLES

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Chỉ dùng server-side

# Google Translate
GOOGLE_TRANSLATE_API_KEY=your_google_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Đổi thành domain thật khi deploy
```

---

## 9. KINDLE UI — THIẾT KẾ CHI TIẾT

### Nguyên tắc bắt buộc
- **Font size tối thiểu 18px** cho body text
- **Line height 1.8** để dễ đọc trên màn hình E-ink
- **Không dùng `position: fixed`** — gây lỗi scroll trên Kindle browser
- **Không dùng CSS hover** — Kindle không có hover state
- **Không load external fonts** (Google Fonts, etc.) — dùng system fonts
- **Không dùng CSS animation/transition** — E-ink refresh chậm, animation sẽ bị nhòe
- **Tất cả interactive elements** phải dùng `onClick` hoặc `onTouchEnd`
- **Contrast cao**: text `#111111` trên nền `#FFFFFF`
- **Touch target tối thiểu 44x44px** cho mọi nút bấm

### Tailwind classes cho Kindle:
```
// Body text
text-lg leading-relaxed font-serif text-gray-900

// Nút bấm
min-h-[44px] min-w-[44px] px-4 py-3 text-base

// Card/item
p-4 border border-gray-200 rounded-lg mb-4

// Translation block
bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-2 italic text-gray-700
```

---

## 10. BUILD PLAN — THỰC HIỆN THEO THỨ TỰ

### Phase 1 — Foundation
- [ ] Khởi tạo Next.js 14 với TypeScript, Tailwind CSS
- [ ] Cài đặt Supabase client (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] Chạy migration SQL tạo tất cả bảng
- [ ] Setup middleware.ts để bảo vệ routes
- [ ] Trang `/login` với Google OAuth
- [ ] Trang `/login/kindle` với Email OTP
- [ ] OAuth callback route `/auth/callback`
- [ ] Layout desktop với sidebar cơ bản
- [ ] Layout Kindle không có sidebar

### Phase 2 — Inbox
- [ ] Trang `/inbox` — danh sách items
- [ ] Trang `/inbox/new` — form paste content
- [ ] Trang `/inbox/[id]` — xem chi tiết + export modal

### Phase 3 — Swipe File
- [ ] Setup Supabase Storage bucket `swipe-images` + policies
- [ ] API route `POST /api/swipe/upload`
- [ ] Trang `/swipe` — grid với filter platform/category/tags
- [ ] Trang `/swipe/new` — form 4 loại ad, upload ảnh
- [ ] Trang `/swipe/[id]` — xem chi tiết + notes editable

### Phase 4 — Translation
- [ ] API route `POST /api/translate`
- [ ] API route `GET /api/export`
- [ ] Kindle reader `/read/[id]` với translate per paragraph
- [ ] Cache translate trong DB

### Phase 5 — Tests + Settings
- [ ] Trang `/tests` — ad test tracker
- [ ] Trang `/settings` — hiển thị API token cho extension

### Phase 6 — Browser Extension
- [ ] Setup Chrome Extension project + manifest với `sidePanel` + `identity` permission
- [ ] Cấu hình Google OAuth Client ID trong manifest
- [ ] `background.js`: mở sidebar khi click icon (`chrome.sidePanel.open`)
- [ ] `sidepanel.html` + `sidepanel.js`: UI sidebar với login + form
- [ ] Content script extract Skool content, nhận message từ sidebar
- [ ] Auth flow: `chrome.identity.getAuthToken` → Supabase `signInWithIdToken`
- [ ] Auto-fill form từ content của trang Skool đang xem
- [ ] Submit → gọi `POST /api/inbox`, hiển thị success + reset form

### Phase 7 — Polish
- [ ] Test thực tế trên Kindle device
- [ ] Loading states cho mọi async action
- [ ] Error states rõ ràng
- [ ] Empty states đẹp
- [ ] Deploy lên Vercel

---

## 11. LƯU Ý QUAN TRỌNG KHI CODE

1. **Supabase SSR**: Dùng `@supabase/ssr` (không phải package cũ `@supabase/auth-helpers-nextjs`). Tạo 2 client riêng: `lib/supabase/client.ts` (browser) và `lib/supabase/server.ts` (server components/API routes).

2. **Google Translate free tier**: 500,000 ký tự/tháng miễn phí. Cần enable "Cloud Translation API" trong Google Cloud Console và tạo API key với restriction cho domain của app.

3. **Kindle browser**: Là WebKit cũ. Test bằng cách simulate trên Chrome DevTools với User Agent: `Mozilla/5.0 (X11; Linux armv7l) AppleWebKit/537.36 (KHTML, like Gecko) Silk/3.68 like Chrome/39.0.2171.93 Safari/537.36`.

4. **Paragraph splitting cho translate**: Dùng regex sau để split content:
   ```javascript
   const paragraphs = content
     .replace(/<[^>]*>/g, '\n')  // Strip HTML tags
     .split(/\n{2,}/)             // Split by double newline
     .map(p => p.trim())
     .filter(p => p.length > 20); // Bỏ đoạn quá ngắn
   ```

5. **MD5 hash cho translation cache**:
   ```javascript
   import { createHash } from 'crypto';
   const hash = createHash('md5').update(text).digest('hex');
   ```

6. **Extension Auth**: Dùng `chrome.identity.getAuthToken` để lấy Google token, sau đó dùng `supabase.auth.signInWithIdToken` để đổi sang Supabase session. Google Client ID trong `manifest.json` phải khớp với Client ID đã cấu hình trong Supabase dashboard > Authentication > Providers > Google.
