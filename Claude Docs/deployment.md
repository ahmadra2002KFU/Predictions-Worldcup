# دليل النشر — مفيد لتوقعات كأس العالم

يشرح هذا الملف كيفية نشر التطبيق على خادم VPS مع دومين خاص وشهادة TLS تلقائية.

## المتطلبات
- خادم VPS (Ubuntu/Debian مثلاً) مع Docker و Docker Compose.
- دومين (مثل `predictions.example.com`) يشير سجل `A` الخاص به إلى عنوان IP الخادم.
- منفذا 80 و 443 مفتوحان في جدار الحماية.
- التأكد من مزامنة ساعة الخادم عبر NTP (مهم لقاعدة القفل 90 ثانية):
  `sudo timedatectl set-ntp true`

## المكوّنات (docker-compose.yml)
- **db** — PostgreSQL 17، بياناته في volume باسم `pgdata` (تبقى بعد إعادة التشغيل).
- **migrate** — خدمة تُشغَّل مرة واحدة، تطبّق ترحيلات Prisma ثم تتوقف. تمنع بدء التطبيق قبل جاهزية قاعدة البيانات.
- **app** — تطبيق Next.js (لا يفتح منفذاً للإنترنت مباشرة).
- **caddy** — الوكيل العكسي، يفتح 80/443 ويحصل على شهادة Let's Encrypt تلقائياً عند أول طلب. شهاداته في volume باسم `caddy_data` (يجب أن يبقى وإلا ستُفقد الشهادات).

## خطوات النشر

1. انسخ المشروع إلى الخادم (git clone أو scp). **لا تنسخ ملف `docker-compose.override.yml`** (هو للتطوير المحلي فقط ويفتح منافذ لا نريدها في الإنتاج).

2. أنشئ ملف `.env` من القالب:
   ```bash
   cp .env.example .env
   ```
   ثم ولّد أسراراً قوية واملأها:
   ```bash
   openssl rand -hex 32   # لكل من POSTGRES_PASSWORD و ADMIN_SECRET و SESSION_SECRET
   ```
   واضبط:
   - `SITE_DOMAIN=predictions.example.com`
   - `NEXT_PUBLIC_SITE_URL=https://predictions.example.com`
   - `NODE_ENV=production`

3. شغّل المكدس (إن كان ملف override موجوداً على الخادم فمرّر ملف الإنتاج صراحةً):
   ```bash
   docker compose -f docker-compose.yml up -d --build
   ```

4. تحقّق:
   ```bash
   docker compose ps          # يجب أن تكون db/app/caddy تعمل، وmigrate خرجت بنجاح (0)
   docker compose logs caddy  # تأكد من الحصول على شهادة TLS
   ```
   ثم افتح `https://predictions.example.com` — يجب أن تظهر صفحة التسجيل بشهادة صحيحة.

## بعد النشر

- **الدخول للوحة الإدارة**: `https://<domain>/admin` ثم أدخل قيمة `ADMIN_SECRET`.
- **تعبئة البيانات**: من لوحة الإدارة أضف الفرق (برمز الدولة مثل `ES`)، الصق قوائم اللاعبين، أنشئ المباريات بمواعيدها (بتوقيت الرياض)، وأدخل نتائج المباريات المنتهية.
- ملاحظة: قاعدة البيانات في الإنتاج تبدأ فارغة (خدمة migrate تطبّق الترحيلات فقط ولا تُدخل بيانات تجريبية).

## النسخ الاحتياطي (موصى به قبل انطلاق البطولة)

نسخة احتياطية يومية لقاعدة البيانات عبر cron:
```bash
docker compose exec -T db pg_dump -U mufeed mufeed | gzip > backups/$(date +%F).sql.gz
```
الاستعادة:
```bash
gunzip -c backups/YYYY-MM-DD.sql.gz | docker compose exec -T db psql -U mufeed mufeed
```

## تحذيرات مهمة
- **لا تشغّل** `docker compose down -v` — الخيار `-v` يحذف volumes (قاعدة البيانات والشهادات). استخدم `docker compose down` فقط.
- الأسرار (`ADMIN_SECRET`، `SESSION_SECRET`) خادمية فقط — لا تبدأها بـ `NEXT_PUBLIC_`.
- التطبيق مصمم لنسخة واحدة فقط من حاوية `app` (ناقل SSE والحد من المعدل في الذاكرة). التوسّع الأفقي يتطلب Redis.
