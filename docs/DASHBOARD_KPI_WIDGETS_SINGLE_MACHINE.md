# Dashboard KPI Summary Widgets â€” Biáº¿n thá»ƒ 1 mÃ¡y â€” FE Integration Guide

> Doc lÃ m viá»‡c (chÆ°a pháº£i doc chÃ­nh thá»‘ng) â€” map API + dá»±ng UI cho cÃ¡c widget tá»•ng quan trÃªn trang
> Dashboard khi **chá»‰ xÃ©t Ä‘Ãºng 1 mÃ¡y** (mÃ n hÃ¬nh chi tiáº¿t mÃ¡y / drillâ€‘down).
>
> **Doc nÃ y tá»± Ä‘á»§ Ä‘á»ƒ tÃ­ch há»£p** â€” khÃ´ng cáº§n Ä‘á»c thÃªm doc nÃ o khÃ¡c. (CÃ³ má»™t bá»™ widget "theo cáº£ xÆ°á»Ÿng"
> tÆ°Æ¡ng á»©ng á»Ÿ `DASHBOARD_KPI_WIDGETS.md`, Ä‘Ã¡nh sá»‘ riÃªng, Ä‘á»™c láº­p â€” khÃ´ng cáº§n cho pháº§n nÃ y.)
>
> `{machineId}` FE truyá»n vÃ o lÃ  id cá»§a mÃ¡y Ä‘ang má»Ÿ trÃªn mÃ n hÃ¬nh chi tiáº¿t.

---

## 1. Tá»•ng quan

| Widget | Ná»™i dung | Endpoint group | Tráº¡ng thÃ¡i |
|---|---|---|---|
| 1 | Hiá»‡u suáº¥t cá»§a mÃ¡y + % chÃªnh lá»‡ch so vá»›i ká»³ trÆ°á»›c | `/api/dashboard/v1/efficiency` | âœ… ÄÃ£ cÃ³ â€” xem Â§3.1 |
| 2 | NÄƒng lá»±c tá»‘i Ä‘a cá»§a mÃ¡y (planned time, tÃ­nh Ä‘áº¿n thá»i Ä‘iá»ƒm hiá»‡n táº¡i) | `/api/dashboard/v1/capacity` | âœ… ÄÃ£ cÃ³ â€” xem Â§3.2 |
| 3 | Tá»•ng thá»i gian downtime cá»§a mÃ¡y (thá»i gian mÃ¡y lá»—i) | `/api/dashboard/v1/downtime` | âœ… ÄÃ£ cÃ³ â€” xem Â§3.3 |
| 4 + 5 | Tá»· lá»‡ sáº£n lÆ°á»£ng + sáº£n lÆ°á»£ng thá»±c táº¿ / káº¿ hoáº¡ch cá»§a mÃ¡y (gá»™p 1 endpoint) | `/api/dashboard/v1/production` | âœ… ÄÃ£ cÃ³ â€” xem Â§3.4 |
| 6 | Thá»i gian mÃ¡y cháº¡y thá»±c táº¿ (runtime) | `/api/dashboard/v1/runtime` | âœ… ÄÃ£ cÃ³ â€” xem Â§3.5 |

Bá»™ 6 widget theo spec hiá»‡n táº¡i **Ä‘Ã£ xong**. Náº¿u phÃ¡t sinh widget má»›i, thÃªm vÃ o theo khuÃ´n á»Ÿ Â§3.6.

> Chart chuá»—iâ€‘thá»iâ€‘gian sáº£n lÆ°á»£ng 1 mÃ¡y (`/production/byMachine/byFilter/{machineId}`) lÃ  má»™t thá»©
> **khÃ¡c** â€” nÃ³ Ä‘Ã£ cÃ³ doc riÃªng á»Ÿ `CHART_MACHINE_PRODUCTION_SERIES.md`, khÃ´ng thuá»™c pháº¡m vi doc nÃ y.

### KhÃ¡c biá»‡t so vá»›i bá»™ widget theo space

| | Bá»™ theo space (`DASHBOARD_KPI_WIDGETS.md`) | Bá»™ 1 mÃ¡y (doc nÃ y) |
|---|---|---|
| Chá»n pháº¡m vi | query param `spaceId` â†’ má»i mÃ¡y trong subtree | path variable `{machineId}` (UUID) â€” **khÃ´ng** truyá»n `spaceId` |
| Quyá»n | user pháº£i truy cáº­p Ä‘Æ°á»£c `spaceId` | user pháº£i truy cáº­p Ä‘Æ°á»£c **space chá»©a mÃ¡y Ä‘Ã³** |
| Khung sá»‘ liá»‡u | "tá»•ng xÆ°á»Ÿng" / "trung bÃ¬nh cá»™ng cÃ¡c mÃ¡y" | Ä‘Ãºng sá»‘ cá»§a **má»™t** mÃ¡y (khÃ´ng cÃ³ bÆ°á»›c trung bÃ¬nh / cá»™ng dá»“n) |
| `result` | chá»‰ cÃ³ cÃ¡c field sá»‘ | **pháº³ng + cÃ³ danh tÃ­nh mÃ¡y**: `machineId` / `machineName` / `machineCode` náº±m tháº³ng trÃªn `result`, kÃ¨m cÃ¡c field sá»‘ |
| MÃ¡y khÃ´ng tá»“n táº¡i / xoÃ¡ má»m | â€” | HTTP 400, body `code` `101` (`error.machine.not_found`) |

YÃªu cáº§u chung:
- Header `Authorization: Bearer <accessToken>`
- Permission `dashboard:view` (giá»‘ng toÃ n bá»™ nhÃ³m `/api/dashboard/v1/*`)
- Response bá»c trong `APIResponse` chuáº©n: `{ "code": 200, "result": { ... } }` â€” endpoint GET khÃ´ng cÃ³ field `message`.

---

## 2. Tham sá»‘ chung

Má»i endpoint trong bá»™ nÃ y Ä‘á»u cÃ³ 2 biáº¿n thá»ƒ `byFilter` / `byDateRange`, **khÃ´ng** cÃ³ `spaceId`, vÃ 
cÃ³ `{machineId}` á»Ÿ cuá»‘i path.

> Báº£ng dÆ°á»›i lÃ  contract **chung** cho Widget 1 / 2 / 3 / 6. **Widget 4 + 5 (`production`) khÃ´ng nháº­n
> yáº¿u tá»‘ ca** â€” `filterId` pháº£i lÃ  loáº¡i ká»³, khÃ´ng truyá»n `shiftFilterId`, `byDateRange` khÃ´ng nháº­n
> `filterId`. Chi tiáº¿t á»Ÿ Â§3.4.

### 2.1 `byFilter` â€” path + query params

`GET /api/dashboard/v1/{group}/byFilter/{machineId}`

| Param | Type | Báº¯t buá»™c | Ghi chÃº |
|---|---|---|---|
| `machineId` (path) | UUID | âœ… | MÃ¡y cáº§n xem. KhÃ´ng tá»“n táº¡i / Ä‘Ã£ xoÃ¡ má»m â†’ 400, body `code` `101`. |
| `filterId` | number | âœ… | Id filter â€” láº¥y tá»« danh sÃ¡ch á»Ÿ **Â§2.3**. Loáº¡i ká»³ (`PERIOD`) hay ca (`SHIFT`) tuá»³ widget. |
| `shiftFilterId` | number | âŒ | Chá»‰ dÃ¹ng khi `filterId` lÃ  filter **theo ká»³** vÃ  muá»‘n thu háº¹p thÃªm vá» 1 ca cá»¥ thá»ƒ má»—i ngÃ y. **KhÃ´ng** truyá»n kÃ¨m khi `filterId` báº£n thÃ¢n Ä‘Ã£ lÃ  1 ca (â†’ 400, body `code` `910`). |

### 2.2 `byDateRange` â€” path + query params

`GET /api/dashboard/v1/{group}/byDateRange/{machineId}`

| Param | Type | Báº¯t buá»™c | Ghi chÃº |
|---|---|---|---|
| `machineId` (path) | UUID | âœ… | Giá»‘ng trÃªn. |
| `startDate` | `yyyy-MM-dd` | âœ… | KhÃ´ng Ä‘Æ°á»£c á»Ÿ tÆ°Æ¡ng lai. |
| `endDate` | `yyyy-MM-dd` | âœ… | Pháº£i `>= startDate`. Khoáº£ng cÃ¡ch tá»‘i Ä‘a **731 ngÃ y** (2 nÄƒm). |
| `filterId` | number | âŒ | Náº¿u truyá»n, **báº¯t buá»™c lÃ  1 filter loáº¡i ca** (â†’ náº¿u khÃ´ng: 400, body `code` `905`) â€” thu háº¹p khoáº£ng ngÃ y xuá»‘ng chá»‰ cÃ²n giá» cá»§a ca Ä‘Ã³ má»—i ngÃ y. |

### 2.3 Láº¥y `filterId` / `shiftFilterId` â€” `GET /api/industryFilters/v1/picking`

Chá»‰ cáº§n Ä‘Äƒng nháº­p (khÃ´ng cáº§n permission riÃªng). Tráº£ **danh sÃ¡ch pháº³ng** má»i filter kháº£ dá»¥ng, khÃ´ng
phÃ¢n trang:

```json
{
  "code": 200,
  "result": [
    { "filterId": 1, "category": "PERIOD", "periodCode": "TODAY",
      "displayNameVi": "HÃ´m nay", "displayNameEn": "Today", "shortNameEn": "Today",
      "shiftNumber": null, "startTime": null, "endTime": null, "crossesMidnight": false,
      "isPrimary": true, "sortOrder": 1 },
    { "filterId": 3, "category": "PERIOD", "periodCode": "WEEK",
      "displayNameVi": "Tuáº§n nÃ y", "displayNameEn": "This week", "shortNameEn": "Week",
      "shiftNumber": null, "startTime": null, "endTime": null, "crossesMidnight": false,
      "isPrimary": false, "sortOrder": 3 },
    { "filterId": 21, "category": "SHIFT", "periodCode": null,
      "displayNameVi": "Ca 1", "displayNameEn": "Shift 1", "shortNameEn": "S1",
      "shiftNumber": 1, "startTime": "06:00:00", "endTime": "14:00:00", "crossesMidnight": false,
      "isPrimary": false, "sortOrder": 11 }
  ]
}
```

*(GiÃ¡ trá»‹ `filterId` cá»¥ thá»ƒ láº¥y tá»« chÃ­nh response nÃ y, khÃ´ng hardcode.)*

**PhÃ¢n loáº¡i báº±ng `category`:**

| `category` | LÃ  gÃ¬ | DÃ¹ng á»Ÿ Ä‘Ã¢u |
|---|---|---|
| `"PERIOD"` | Filter theo **ká»³**. `periodCode` âˆˆ `TODAY`, `YESTERDAY`, `WEEK`, `LAST_WEEK`, `MONTH`, `LAST_MONTH`, `QUARTER`, `LAST_QUARTER`, `YEAR`, `LAST_YEAR` | LÃ m `filterId` cho **má»i widget** (1â€“6) |
| `"SHIFT"` | Filter theo **ca** (`shiftNumber` / `startTime` / `endTime` / `crossesMidnight`) | **Chá»‰ Widget 1 / 2 / 3 / 6.** LÃ m `filterId` á»Ÿ `byFilter` ("ca Ä‘Ã³, hÃ´m nay") **hoáº·c** `shiftFilterId` á»Ÿ `byFilter` (kÃ¨m `filterId` loáº¡i ká»³ â†’ thu háº¹p ká»³ vá» giá» ca) **hoáº·c** `filterId` á»Ÿ `byDateRange` (thu háº¹p khoáº£ng ngÃ y vá» giá» ca). **Widget 4+5 tá»« chá»‘i filter loáº¡i ca á»Ÿ má»i vá»‹ trÃ­** (Â§3.4) |

**Gá»£i Ã½ UI:** 1 dropdown "ká»³" (cÃ¡c `PERIOD`) + 1 dropdown "ca" tuá»³ chá»n (cÃ¡c `SHIFT`) â†’ map sang
`shiftFilterId`. Khi ngÆ°á»i dÃ¹ng chá»n 1 ca á»Ÿ dropdown "ká»³" thÃ¬ gá»­i ca Ä‘Ã³ lÃ m `filterId` luÃ´n.

---

## 3. Chi tiáº¿t tá»«ng endpoint

### 3.1 Widget 1 â€” Hiá»‡u suáº¥t cá»§a mÃ¡y (`efficiency`) âœ…

```
GET /api/dashboard/v1/efficiency/byFilter/{machineId}?filterId=4
GET /api/dashboard/v1/efficiency/byFilter/{machineId}?filterId=10&shiftFilterId=1
GET /api/dashboard/v1/efficiency/byDateRange/{machineId}?startDate=2026-08-01&endDate=2026-08-07
GET /api/dashboard/v1/efficiency/byDateRange/{machineId}?startDate=2026-08-01&endDate=2026-08-31&filterId=3
```

VÃ­ dá»¥ Ä‘áº§y Ä‘á»§:

```
GET /api/dashboard/v1/efficiency/byFilter/82f3974f-553a-484f-8bbe-6b03f748a06f?filterId=5
```

Response:

```json
{
  "code": 200,
  "result": {
    "machineId": "82f3974f-553a-484f-8bbe-6b03f748a06f",
    "machineName": "MÃ¡y Ã©p A",
    "machineCode": "PRESS-01",
    "efficiencyPercentage": 15.02,
    "efficiencyDeltaPercentage": 60.00
  }
}
```

| Field | Type | Ã nghÄ©a |
|---|---|---|
| `machineId` / `machineName` / `machineCode` | string \| `null` | Danh tÃ­nh mÃ¡y (echo láº¡i tá»« path). `machineCode` cÃ³ thá»ƒ `null` náº¿u mÃ¡y chÆ°a Ä‘áº·t mÃ£. |
| `efficiencyPercentage` | number \| `null` | Hiá»‡u suáº¥t % cá»§a **Ä‘Ãºng mÃ¡y nÃ y** trong ká»³ Ä‘ang lá»c (`runtimeSeconds Ã— 100 / plannedWorkingSeconds`, lÃ m trÃ²n 2 chá»¯ sá»‘ HALF_UP). Báº±ng Ä‘Ãºng giÃ¡ trá»‹ cá»§a mÃ¡y nÃ y trong chart "Hiá»‡u suáº¥t theo mÃ¡y" (`/efficiency/byMachine/byFilter`) á»Ÿ cÃ¹ng tham sá»‘. **`null`** khi mÃ¡y khÃ´ng cÃ³ thá»i gian lÃ m viá»‡c káº¿ hoáº¡ch trong ká»³ (ngÃ y nghá»‰ theo lá»‹ch lÃ m viá»‡c, náº±m ngoÃ i má»i ca, hoáº·c ká»³ hoÃ n toÃ n á»Ÿ tÆ°Æ¡ng lai) â€” "khÃ´ng Ã¡p dá»¥ng", **khÃ¡c** `0` (cháº¡y Ä‘Æ°á»£c 0% cÃ´ng suáº¥t). |
| `efficiencyDeltaPercentage` | number \| `null` | `(hiá»‡n táº¡i âˆ’ ká»³ trÆ°á»›c) / ká»³ trÆ°á»›c Ã— 100`, lÃ m trÃ²n 2 chá»¯ sá»‘ HALF_UP. Baseline lÃ  **ká»³ trÆ°á»›c** (HÃ´m nay â†” hÃ´m qua, Tuáº§n nÃ y â†” tuáº§n trÆ°á»›c, Ca 1 hÃ´m nay â†” Ca 1 hÃ´m qua, â€¦). Sá»‘ Ã¢m = hiá»‡u suáº¥t **giáº£m**. **`null`** khi: (a) endpoint lÃ  `byDateRange` â€” khoáº£ng ngÃ y tuá»³ chá»n khÃ´ng cÃ³ "ká»³ trÆ°á»›c" tá»± nhiÃªn, **luÃ´n `null`**; (b) `efficiencyPercentage` ká»³ nÃ y hoáº·c ká»³ trÆ°á»›c `null`; (c) ká»³ trÆ°á»›c = 0 (biáº¿n Ä‘á»™ng so vá»›i má»‘c 0 lÃ  khÃ´ng xÃ¡c Ä‘á»‹nh, khÃ´ng pháº£i vÃ´ cá»±c). |

**Ghi chÃº cÃ´ng thá»©c delta:** dÃ¹ng máº«u sá»‘ **ká»³ trÆ°á»›c** (`/ previous`) â€” Ä‘Ã¢y lÃ  % thay Ä‘á»•i chuáº©n vÃ 
khá»›p vá»›i widget "Hiá»‡u suáº¥t tá»•ng xÆ°á»Ÿng" theo space. (MÃ´ táº£ feature ban Ä‘áº§u ghi `/ current`; Ä‘Ã£ chá»‘t
giá»¯ `/ previous` Ä‘á»ƒ 2 widget nháº¥t quÃ¡n.)

**Shift narrowing:** Widget 1 **cÃ³** há»— trá»£ thu háº¹p theo ca:
- `filterId` lÃ  1 ca â†’ tá»± tÃ­nh trÃªn khung giá» ca Ä‘Ã³ (hÃ´m nay), so vá»›i chÃ­nh ca Ä‘Ã³ hÃ´m qua.
- `filterId` lÃ  ká»³ + `shiftFilterId` â†’ thu háº¹p ká»³ Ä‘Ã³ vá» giá» cá»§a ca má»—i ngÃ y.
- `byDateRange` + `filterId` loáº¡i ca â†’ thu háº¹p khoáº£ng ngÃ y vá» giá» cá»§a ca má»—i ngÃ y.

`efficiencyDeltaPercentage` khi báº±ng `0.00` nghÄ©a lÃ  **khÃ´ng Ä‘á»•i** so vá»›i ká»³ trÆ°á»›c (khÃ¡c `null` =
khÃ´ng so sÃ¡nh Ä‘Æ°á»£c).

### 3.2 Widget 2 â€” NÄƒng lá»±c tá»‘i Ä‘a cá»§a mÃ¡y (`capacity`) âœ…

```
GET /api/dashboard/v1/capacity/byFilter/{machineId}?filterId=4
GET /api/dashboard/v1/capacity/byFilter/{machineId}?filterId=10&shiftFilterId=1
GET /api/dashboard/v1/capacity/byDateRange/{machineId}?startDate=2026-08-01&endDate=2026-08-07
GET /api/dashboard/v1/capacity/byDateRange/{machineId}?startDate=2026-08-01&endDate=2026-08-31&filterId=3
```

VÃ­ dá»¥ Ä‘áº§y Ä‘á»§:

```
GET /api/dashboard/v1/capacity/byFilter/82f3974f-553a-484f-8bbe-6b03f748a06f?filterId=5
```

Response:

```json
{
  "code": 200,
  "result": {
    "machineId": "82f3974f-553a-484f-8bbe-6b03f748a06f",
    "machineName": "MÃ¡y Ã©p A",
    "machineCode": "PRESS-01",
    "plannedWorkingSeconds": 172800
  }
}
```

| Field | Type | Ã nghÄ©a |
|---|---|---|
| `machineId` / `machineName` / `machineCode` | string \| `null` | Danh tÃ­nh mÃ¡y (echo láº¡i tá»« path). |
| `plannedWorkingSeconds` | number (giÃ¢y) | "NÄƒng lá»±c tá»‘i Ä‘a" = tá»•ng **thá»i gian lÃ m viá»‡c káº¿ hoáº¡ch** cá»§a mÃ¡y trong ká»³: cá»™ng qua **má»i ca Ä‘Ã£ cáº¥u hÃ¬nh**, má»—i ngÃ y lÃ m viá»‡c (theo `WorkCalendar`), cá»§a `(giá» ca âˆ’ giá» nghá»‰)`. **LuÃ´n lÃ  sá»‘** â€” `0` khi ká»³ khÃ´ng cÃ³ giá» lÃ m viá»‡c nÃ o (toÃ n ngÃ y nghá»‰, hoáº·c ká»³ hoÃ n toÃ n á»Ÿ tÆ°Æ¡ng lai); **khÃ´ng bao giá» `null`**. FE tá»± format sang giá»/phÃºt. |

> **âš ï¸ "TÃ­nh Ä‘áº¿n thá»i Ä‘iá»ƒm hiá»‡n táº¡i".** `plannedWorkingSeconds` bá»‹ **cáº¯t táº¡i thá»i Ä‘iá»ƒm gá»i API** â€”
> nÃ³ lÃ  planned time cá»§a pháº§n ká»³ **Ä‘Ã£ trÃ´i qua**, khÃ´ng pháº£i cáº£ ká»³. VÃ­ dá»¥ chá»n "Tuáº§n nÃ y" mÃ  hÃ´m nay
> lÃ  Thá»© 3 â†’ chá»‰ tráº£ planned time cá»§a Thá»© 2 + pháº§n Thá»© 3 Ä‘Ã£ qua, vÃ  con sá»‘ nÃ y **tÄƒng dáº§n trong
> ngÃ y**. Vá»›i ká»³ Ä‘Ã£ káº¿t thÃºc (HÃ´m qua, Tuáº§n trÆ°á»›c, â€¦) thÃ¬ báº±ng planned time cáº£ ká»³.
>
> ÄÃ¢y chÃ­nh lÃ  **máº«u sá»‘ cá»§a `efficiencyPercentage` á»Ÿ Widget 1** á»Ÿ cÃ¹ng tham sá»‘ â†’ FE cÃ³ thá»ƒ tÃ­nh
> `hiá»‡u suáº¥t = runtime / plannedWorkingSeconds` vÃ  ra khá»›p. (Runtime chÆ°a expose á»Ÿ widget nÃ y; náº¿u
> cáº§n, Ä‘Ã³ lÃ  má»™t yÃªu cáº§u riÃªng.)

**KhÃ´ng cÃ³ delta.** Widget 2 khÃ´ng cÃ³ field `...DeltaPercentage` â€” nÄƒng lá»±c tá»‘i Ä‘a gáº§n nhÆ° khÃ´ng Ä‘á»•i
giá»¯a cÃ¡c ká»³ (chá»‰ phá»¥ thuá»™c cáº¥u hÃ¬nh ca + lá»‹ch lÃ m viá»‡c).

**Shift narrowing:** giá»‘ng Widget 1 â€” `shiftFilterId` (á»Ÿ `byFilter`) / `filterId` loáº¡i ca (á»Ÿ
`byDateRange`) thu háº¹p vá» giá» cá»§a **má»™t** ca; khi Ä‘Ã³ `plannedWorkingSeconds` chá»‰ tÃ­nh giá» (trá»« nghá»‰)
cá»§a ca Ä‘Ã³ má»—i ngÃ y lÃ m viá»‡c.

### 3.3 Widget 3 â€” Tá»•ng thá»i gian downtime cá»§a mÃ¡y (`downtime`) âœ…

```
GET /api/dashboard/v1/downtime/byFilter/{machineId}?filterId=4
GET /api/dashboard/v1/downtime/byFilter/{machineId}?filterId=10&shiftFilterId=1
GET /api/dashboard/v1/downtime/byDateRange/{machineId}?startDate=2026-08-01&endDate=2026-08-07
GET /api/dashboard/v1/downtime/byDateRange/{machineId}?startDate=2026-08-01&endDate=2026-08-31&filterId=3
```

VÃ­ dá»¥ Ä‘áº§y Ä‘á»§:

```
GET /api/dashboard/v1/downtime/byFilter/82f3974f-553a-484f-8bbe-6b03f748a06f?filterId=5
```

Response:

```json
{
  "code": 200,
  "result": {
    "machineId": "82f3974f-553a-484f-8bbe-6b03f748a06f",
    "machineName": "MÃ¡y Ã©p A",
    "machineCode": "PRESS-01",
    "downtimeSeconds": 4380
  }
}
```

| Field | Type | Ã nghÄ©a |
|---|---|---|
| `machineId` / `machineName` / `machineCode` | string \| `null` | Danh tÃ­nh mÃ¡y (echo láº¡i tá»« path). |
| `downtimeSeconds` | number (giÃ¢y) | Tá»•ng thá»i gian downtime cá»§a mÃ¡y trong ká»³ = **chá»‰ thá»i gian tráº¡ng thÃ¡i ERROR** (khÃ´ng tÃ­nh idle / offline), theo Ä‘á»‹nh nghÄ©a downtime errorâ€‘only Ã¡p dá»¥ng toÃ n há»‡ thá»‘ng. Báº±ng Ä‘Ãºng pháº§n Ä‘Ã³ng gÃ³p cá»§a mÃ¡y nÃ y trong widget "Tá»•ng downtime" theo space á»Ÿ cÃ¹ng tham sá»‘. **LuÃ´n lÃ  sá»‘** â€” `0` khi mÃ¡y khÃ´ng cÃ³ thá»i gian lá»—i (hoáº·c ká»³ khÃ´ng cÃ³ giá» lÃ m viá»‡c); **khÃ´ng bao giá» `null`**. FE tá»± format sang giá»/phÃºt. |

**KhÃ´ng cÃ³ delta.** Widget 3 khÃ´ng cÃ³ field `...DeltaPercentage` (giá»‘ng widget downtime theo space â€”
chá»‰ Widget 1 cÃ³ delta).

**Shift narrowing:** giá»‘ng Widget 1 / 2 â€” `shiftFilterId` (`byFilter`) / `filterId` loáº¡i ca
(`byDateRange`) bÃ³ thá»i gian lá»—i vá» giá» cá»§a **má»™t** ca má»—i ngÃ y.

### 3.4 Widget 4 + 5 â€” Sáº£n lÆ°á»£ng (`production`) âœ…

Gá»™p 1 endpoint nhÆ° thiáº¿t káº¿ spaceâ€‘scoped (`DashboardProductionSummaryResponse` gá»™p Widget 3+4 theo
space): `productionRatioPercentage` (Widget 4 cá»§a báº¡n) chá»‰ lÃ  phÃ©p chia cá»§a `actualQuantity` /
`plannedQuantity` (Widget 5 cá»§a báº¡n), cÃ¹ng nguá»“n, cÃ¹ng pháº¡m vi.

```
GET /api/dashboard/v1/production/byFilter/{machineId}?filterId=6
GET /api/dashboard/v1/production/byDateRange/{machineId}?startDate=2026-08-01&endDate=2026-08-07
```

VÃ­ dá»¥ Ä‘áº§y Ä‘á»§:

```
GET /api/dashboard/v1/production/byFilter/82f3974f-553a-484f-8bbe-6b03f748a06f?filterId=6
```

Response:

```json
{
  "code": 200,
  "result": {
    "machineId": "82f3974f-553a-484f-8bbe-6b03f748a06f",
    "machineName": "MÃ¡y Ã©p A",
    "machineCode": "PRESS-01",
    "actualQuantity": 4200,
    "plannedQuantity": 5000,
    "productionRatioPercentage": 84.00
  }
}
```

| Field | Type | Ã nghÄ©a |
|---|---|---|
| `machineId` / `machineName` / `machineCode` | string \| `null` | Danh tÃ­nh mÃ¡y (echo láº¡i tá»« path). |
| `plannedQuantity` | number | **Widget 5** â€” `SUM(planned_quantity)` cÃ¡c plan **active** cá»§a mÃ¡y cÃ³ `plannedDate` rÆ¡i vÃ o khoáº£ng Ä‘ang lá»c. LuÃ´n lÃ  sá»‘ (`0` khi khÃ´ng cÃ³ plan). |
| `actualQuantity` | number | **Widget 5** â€” `SUM(actual_quantity)`, cÃ¹ng pháº¡m vi. |
| `productionRatioPercentage` | number \| `null` | **Widget 4** â€” `actualQuantity / plannedQuantity Ã— 100`, lÃ m trÃ²n 2 chá»¯ sá»‘ HALF_UP. **`null`** (khÃ´ng pháº£i 0%) khi `plannedQuantity â‰¤ 0` â€” "khÃ´ng cÃ³ káº¿ hoáº¡ch Ä‘á»ƒ so". **KhÃ´ng** cap tráº§n 100% (vÆ°á»£t káº¿ hoáº¡ch váº«n hiá»‡n, vd 150%). |

âš ï¸ **KhÃ¡c Widget 1 / 2 / 3:**
- **KhÃ´ng há»— trá»£ yáº¿u tá»‘ ca.** Nguá»“n lÃ  `ProductionPlan`, `plannedDate` lÃ  **ngÃ y** (khÃ´ng cÃ³ giá» /
  ca). VÃ¬ váº­y: `filterId` **báº¯t buá»™c lÃ  filter loáº¡i ká»³**; truyá»n `filterId` loáº¡i ca / `shiftFilterId`
  (`byFilter`), hoáº·c báº¥t ká»³ `filterId` nÃ o (`byDateRange`) â†’ 400, body `code` `912`.
- **TÃ­nh cáº£ ká»³, KHÃ”NG cáº¯t theo "hiá»‡n táº¡i"** (khÃ¡c Widget 2). "Tuáº§n nÃ y" giá»¯a tuáº§n â†’ `plannedQuantity`
  lÃ  cáº£ tuáº§n cÃ²n `actualQuantity` chá»‰ tá»›i hÃ´m nay â†’ `productionRatioPercentage` cÃ³ thá»ƒ **tháº¥p giáº£**
  cho tá»›i khi háº¿t ká»³. (Giá»‘ng há»‡t widget sáº£n lÆ°á»£ng theo space.)
- **KhÃ´ng** cÃ³ delta.

### 3.5 Widget 6 â€” Thá»i gian mÃ¡y cháº¡y thá»±c táº¿ (`runtime`) âœ…

```
GET /api/dashboard/v1/runtime/byFilter/{machineId}?filterId=4
GET /api/dashboard/v1/runtime/byFilter/{machineId}?filterId=10&shiftFilterId=1
GET /api/dashboard/v1/runtime/byDateRange/{machineId}?startDate=2026-08-01&endDate=2026-08-07
GET /api/dashboard/v1/runtime/byDateRange/{machineId}?startDate=2026-08-01&endDate=2026-08-31&filterId=3
```

Response:

```json
{
  "code": 200,
  "result": {
    "machineId": "82f3974f-553a-484f-8bbe-6b03f748a06f",
    "machineName": "MÃ¡y Ã©p A",
    "machineCode": "PRESS-01",
    "runtimeSeconds": 172440
  }
}
```

| Field | Type | Ã nghÄ©a |
|---|---|---|
| `machineId` / `machineName` / `machineCode` | string \| `null` | Danh tÃ­nh mÃ¡y (echo láº¡i tá»« path). |
| `runtimeSeconds` | number (giÃ¢y) | Tá»•ng thá»i gian mÃ¡y cháº¡y trong ká»³ = **chá»‰ thá»i gian tráº¡ng thÃ¡i RUNTIME**. Báº±ng Ä‘Ãºng pháº§n Ä‘Ã³ng gÃ³p cá»§a mÃ¡y nÃ y trong widget "Tá»•ng runtime" theo space á»Ÿ cÃ¹ng tham sá»‘. **LuÃ´n lÃ  sá»‘** â€” `0` khi mÃ¡y khÃ´ng cháº¡y (hoáº·c ká»³ khÃ´ng cÃ³ giá» lÃ m viá»‡c); **khÃ´ng bao giá» `null`**. FE tá»± format sang giá»/phÃºt. |

**KhÃ´ng cÃ³ delta.** **Shift narrowing:** giá»‘ng Widget 1 / 2 / 3 â€” `shiftFilterId` (`byFilter`) /
`filterId` loáº¡i ca (`byDateRange`) bÃ³ thá»i gian cháº¡y vá» giá» cá»§a **má»™t** ca má»—i ngÃ y.

### 3.6 KhuÃ´n cho widget thÃªm sau

Náº¿u bá»™ nÃ y má»Ÿ rá»™ng thÃªm widget, thÃªm vÃ o Ä‘Ã¢y theo khuÃ´n cá»§a Widget 1â€“6:
- Path thÃªm `/{machineId}` á»Ÿ cuá»‘i, **bá»** `spaceId`.
- `result` pháº³ng: `machineId` / `machineName` / `machineCode` + cÃ¡c field sá»‘ cá»§a widget Ä‘Ã³.
- Chá»‰ Widget 1 cÃ³ "% chÃªnh lá»‡ch so vá»›i ká»³ trÆ°á»›c"; cÃ¡c widget khÃ¡c máº·c Ä‘á»‹nh **khÃ´ng** cÃ³ delta.
- `shiftFilterId` / `filterId` loáº¡i ca: tuá»³ widget â€” widget dá»±a trÃªn tráº¡ng thÃ¡i mÃ¡y / thá»i gian
  (nhÆ° Widget 1, 2, 3, 6) thÃ¬ há»— trá»£; widget dá»±a trÃªn `ProductionPlan` (granularity theo ngÃ y, nhÆ°
  Widget 4+5) thÃ¬ **tá»« chá»‘i** yáº¿u tá»‘ ca (body `code` `912`) â€” giá»‘ng rÃ ng buá»™c cá»§a bá»™ theo space.

---

## 4. Lá»—i thÆ°á»ng gáº·p

Format chuáº©n: `{ "code": <errorCode>, "message": "..." }`. Cá»™t **HTTP** lÃ  status code, cá»™t **`code`**
lÃ  mÃ£ lá»—i ná»™i bá»™ trong body â€” 2 cá»™t sá»‘ khÃ¡c nhau, Ä‘á»«ng nháº§m.

| HTTP | body `code` | Khi nÃ o | Ãp dá»¥ng |
|---|---|---|---|
| 400 | 80001 | Thiáº¿u param báº¯t buá»™c / sai Ä‘á»‹nh dáº¡ng ngÃ y / `endDate < startDate` / khoáº£ng ngÃ y > 731 ngÃ y / `{machineId}` sai Ä‘á»‹nh dáº¡ng UUID | Táº¥t cáº£ |
| 400 | 101 | `{machineId}` khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ bá»‹ xoÃ¡ má»m (`error.machine.not_found`) | Táº¥t cáº£ |
| 400 | 902 | `filterId` (hoáº·c `shiftFilterId`) khÃ´ng tá»“n táº¡i | Táº¥t cáº£ |
| 400 | 905 | `byDateRange`: `filterId` truyá»n vÃ o khÃ´ng pháº£i filter loáº¡i ca | Widget 1, 2, 3, 6 |
| 400 | 910 | `byFilter`: `filterId` báº£n thÃ¢n lÃ  1 ca **vÃ ** truyá»n kÃ¨m `shiftFilterId` | Widget 1, 2, 3, 6 |
| 400 | 912 | Truyá»n yáº¿u tá»‘ ca (`filterId` loáº¡i ca / `shiftFilterId` á»Ÿ `byFilter`; báº¥t ká»³ `filterId` nÃ o á»Ÿ `byDateRange`) cho widget dá»±a trÃªn `ProductionPlan` | Widget 4+5 (xem Â§3.4) |
| 401 | 2 | Thiáº¿u / háº¿t háº¡n access token, **hoáº·c** cÃ³ token nhÆ°ng role khÃ´ng cÃ³ quyá»n `dashboard:view` | Táº¥t cáº£ |
| 403 | 404 | Space chá»©a `{machineId}` tá»“n táº¡i nhÆ°ng user khÃ´ng cÃ³ quyá»n truy cáº­p (`error.space.access_denied`) | Táº¥t cáº£ |

---

## 5. Tham chiáº¿u code BE

Constants / paths: `constants/dashboard/DashboardConstants.java`
- `EFFICIENCY_SUMMARY_FOR_MACHINE_BY_FILTER` / `EFFICIENCY_SUMMARY_FOR_MACHINE_BY_DATE_RANGE`
- `CAPACITY_SUMMARY_FOR_MACHINE_BY_FILTER` / `CAPACITY_SUMMARY_FOR_MACHINE_BY_DATE_RANGE`
- `DOWNTIME_SUMMARY_FOR_MACHINE_BY_FILTER` / `DOWNTIME_SUMMARY_FOR_MACHINE_BY_DATE_RANGE`
- `PRODUCTION_SUMMARY_FOR_MACHINE_BY_FILTER` / `PRODUCTION_SUMMARY_FOR_MACHINE_BY_DATE_RANGE`
- `RUNTIME_SUMMARY_FOR_MACHINE_BY_FILTER` / `RUNTIME_SUMMARY_FOR_MACHINE_BY_DATE_RANGE`

Request DTO (káº¿ thá»«a `ByDateFilterRequest` / `ByDateRangeRequest`, **khÃ´ng cÃ³ `spaceId`**):
- `model/dtos/dashboard/requests/DashboardMachineEfficiencySummary{Filter,Range}Request.java`
- `model/dtos/dashboard/requests/DashboardMachineCapacitySummary{Filter,Range}Request.java`
- `model/dtos/dashboard/requests/DashboardMachineDowntimeSummary{Filter,Range}Request.java`
- `model/dtos/dashboard/requests/DashboardMachineProductionSummary{Filter,Range}Request.java`
- `model/dtos/dashboard/requests/DashboardMachineRuntimeSummary{Filter,Range}Request.java`

Response DTO:
- `model/dtos/dashboard/responses/DashboardMachineEfficiencySummaryResponse.java`
- `model/dtos/dashboard/responses/DashboardMachineCapacitySummaryResponse.java`
- `model/dtos/dashboard/responses/DashboardMachineDowntimeSummaryResponse.java`
- `model/dtos/dashboard/responses/DashboardMachineProductionSummaryResponse.java`
- `model/dtos/dashboard/responses/DashboardMachineRuntimeSummaryResponse.java`

Service: `services/resourcesServices/dashboard/DashboardServiceImplementation.java`
- section "Widget 1 â€” efficiency, single machine ({machineId} path variable)"
- section "Widget 2 (single-machine dashboard) â€” nÄƒng lá»±c tá»‘i Ä‘a / planned working time"
- section "Widget 3 (single-machine dashboard) â€” total downtime (ERROR-status time)"
- section "Widget 4 + 5 (single-machine dashboard) â€” production ratio + actual/planned output"
- section "Widget 6 (single-machine dashboard) â€” total runtime (RUNTIME-status time)"

Controller: `controllers/dashboard/DashboardController.java`
- `getEfficiencySummaryForMachineByFilter` / `...ByDateRange`
- `getCapacitySummaryForMachineByFilter` / `...ByDateRange`
- `getDowntimeSummaryForMachineByFilter` / `...ByDateRange`
- `getProductionSummaryForMachineByFilter` / `...ByDateRange`
- `getRuntimeSummaryForMachineByFilter` / `...ByDateRange`

Engine / nguá»“n dá»¯ liá»‡u:
- Widget 1 / 2 / 3 / 6: `services/resourcesServices/spaces/MachineMetricsAggregationService.java`
  (`aggregateSingleMachineMetrics` â†’ `MachineMetricsSeries.buckets[0]`: `efficiencyPercentage` cho
  Widget 1, `plannedWorkingSeconds` cho Widget 2, `errorSeconds` cho Widget 3, `runtimeSeconds` cho
  Widget 6). CÃ¡ch tÃ­nh planned time (ca âˆ’ nghá»‰ âˆ’ ngÃ y khÃ´ng lÃ m viá»‡c, cáº¯t tá»›i "now"):
  `utils/resourceUtils/MachineReportUtils.java` (`calculateExpectedCapacitySeconds`,
  `clampToElapsed`, `enumerateNetShiftWorkingWindows`).
- Widget 4 + 5: `ProductionPlanRepository#sumQuantitiesByMachineIdsAndPlannedDateRange` (gá»i vá»›i
  `List.of(machineId)`); tá»· lá»‡: `utils/resourceUtils/DashboardUtils.java#calculateProductionRatioPercentage`.
  Guard mÃ¡y tá»“n táº¡i: `MachineRepository#findBasicForSpaceOverviewByMachineId`.

Kiá»ƒm quyá»n theo mÃ¡y: `validators/SpaceValidator.java#assertMachineAccess`.
Suy "ká»³ trÆ°á»›c" (Widget 1): `helpers/datePeriodFilters/` (`calculateComparisonDateRange`).
CÃ´ng thá»©c delta (Widget 1): `utils/resourceUtils/DashboardUtils.java#calculateEfficiencyDeltaPercentage`.

