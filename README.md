# مفيد — توقعات كأس العالم (Mufeed World Cup Predictions)

تطبيق ويب عربيّ أولاً لفاعلية توقّع مباريات كأس العالم: تسجيل بالاسم فقط (بدون كلمة مرور)،
توقّع النتيجة + أفضل لاعب + صاحب أول هدف، لوحة صدارة لحظية، ودردشة لكل مباراة.

## التقنيات
Next.js 16 · React 19 · PostgreSQL 17 + Prisma 7 · Tailwind v4 · iron-session · SSE · motion · flag-icons · Docker + Caddy.

## التشغيل محلياً (Local development)

المتطلبات: Node 22، Docker.

```bash
# 1) ثبّت الحزم
npm install

# 2) شغّل قاعدة البيانات فقط عبر Docker (ملف override يفتح المنفذ 5432 للمضيف)
docker compose up -d db

# 3) جهّز ملف البيئة (إن لم يوجد) وولّد أسراراً
cp .env.example .env   # ثم عدّل DATABASE_URL ليشير إلى localhost و NODE_ENV=development

# 4) طبّق الترحيلات وأدخل بيانات تجريبية
npx prisma migrate dev
npx prisma db seed

# 5) شغّل خادم التطوير
npm run dev            # http://localhost:3000
```

لوحة الإدارة: `http://localhost:3000/admin` — كلمة المرور هي قيمة `ADMIN_SECRET` في `.env`.

## الأوامر
- `npm run dev` — خادم التطوير.
- `npm run build` — بناء الإنتاج.
- `npm test` — اختبارات محرّك النقاط (vitest).
- `npm run lint` — فحص ESLint.
- `npx prisma studio` — واجهة استعراض قاعدة البيانات.

## اختبار المكدّس الكامل محلياً (بدون Caddy)
```bash
docker compose up -d --build db migrate app   # التطبيق على http://localhost:3000
```

## النشر على VPS
راجع `Claude Docs/deployment.md` — نشر عبر `docker compose -f docker-compose.yml up -d --build` مع Caddy لشهادة TLS تلقائية.

## الوثائق
- `Claude Docs/architecture.md` — نظرة معمارية وقواعد النقاط.
- `Claude Docs/deployment.md` — دليل النشر والنسخ الاحتياطي.
- `Claude Docs/plan.md` — حالة البناء والمراحل.
