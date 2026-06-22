# Qwaste Docs — Nextra Documentation Site

Site tài liệu cho Qwaste v2, build bằng [Nextra 4](https://nextra.site) docs theme + Next.js App Router, hỗ trợ tiếng Việt và tiếng Anh.

## Cài đặt và chạy

```bash
npm install

# Chạy dev (hot reload)
npm run dev
# Mở http://localhost:3000 -> tự redirect sang /vi hoặc /en theo ngôn ngữ trình duyệt

# Build production
npm run build
npm run start
```

## Đa ngôn ngữ

- URL: `/vi/...` (tiếng Việt — mặc định) và `/en/...` (tiếng Anh)
- Truy cập `/` sẽ tự phát hiện ngôn ngữ trình duyệt và redirect (xử lý trong `middleware.js`)
- Nút chuyển ngôn ngữ nằm trên navbar (component `LocaleSwitch`)
- Muốn thêm/bớt ngôn ngữ: sửa `locales` trong `next.config.mjs` + mảng `i18n` trong `app/[lang]/layout.jsx` + tạo thư mục content tương ứng

## Thêm trang docs mới

Thả file `.md`/`.mdx` vào thư mục ngôn ngữ tương ứng:

```
content/
├── vi/
│   ├── index.mdx      → /vi
│   ├── guide.mdx      → /vi/guide
│   ├── architecture.mdx
│   ├── api-bff.mdx
│   └── _meta.js       → thứ tự + tên hiển thị sidebar (tiếng Việt)
└── en/
    ├── index.mdx      → /en
    ├── guide.mdx      → /en/guide
    ├── architecture.mdx
    ├── api-bff.mdx
    └── _meta.js       → sidebar tiếng Anh
```

Hai bên nên có cấu trúc file giống nhau để khi chuyển ngôn ngữ, người dùng ở đúng trang tương ứng.

Ví dụ `_meta.js`:

```js
export default {
  index: 'Tổng quan',
  guide: 'Cài đặt & chạy local'
}
```

## Tìm kiếm (search)

Search dùng Pagefind, hỗ trợ index cả 2 ngôn ngữ, nhưng chỉ index sau khi build.
Trong môi trường dev, ô search sẽ báo không khả dụng — đây là hành vi bình thường.
Để test search ở local: chạy `npm run build` một lần rồi `npm run dev`.

## Cấu trúc quan trọng

- `app/[lang]/layout.jsx` — theme + chuỗi giao diện theo từng ngôn ngữ (dictionaries)
- `app/[lang]/[[...mdxPath]]/page.jsx` — route catch-all render file trong `content/{lang}/`
- `app/[lang]/not-found.jsx` — trang 404
- `middleware.js` — phát hiện ngôn ngữ + redirect
- `mdx-components.jsx` — bắt buộc với Nextra 4
- `next.config.mjs` — cấu hình i18n (locales, defaultLocale)

## Lưu ý quan trọng về zod

`package.json` có mục `overrides` pin **zod = 4.1.12**. Nextra 4.6.1 bị lỗi
build (`Invalid input: expected nonoptional, received undefined`) với zod >= 4.4.x.
**Không xóa override này** cho đến khi Nextra phát hành bản vá.

## Deploy

Deploy được lên Vercel mà không cần cấu hình thêm
(script `postbuild` tự chạy Pagefind để tạo search index).
