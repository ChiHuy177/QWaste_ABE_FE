# 7.9. Popup Phân Tích Thời Gian Downtime — FE Integration Guide

> Doc làm việc (chưa phải doc chính thống) — mục đích để FE map API và dựng UI cho popup master-detail mở ra khi click Card "THỜI GIAN DOWNTIME" trên Dashboard. Sẽ được viết lại thành doc chính thống (Nextra) sau khi FE/BE chốt xong UI thật.

---

## 1. Tổng quan

Popup có 2 cột:
- **Cột trái (master)**: danh sách máy có downtime trong khoảng thời gian, sort giảm dần theo tổng downtime.
- **Cột phải (detail)**: khi chọn 1 máy ở cột trái → lịch sử sự cố của riêng máy đó + thông tin tổng quan.

4 endpoint, tất cả dưới root `/api/downtime/v1/machines`:

| Method | Path | Việc gì |
|---|---|---|
| `GET` | `.../byFilter` | Danh sách máy (cột trái) — lọc theo filter có sẵn |
| `GET` | `.../byDateRange` | Danh sách máy (cột trái) — lọc theo khoảng ngày tuỳ chọn |
| `GET` | `.../byFilter/{machineId}/incidents` | Lịch sử sự cố 1 máy (cột phải) — theo filter |
| `GET` | `.../byDateRange/{machineId}/incidents` | Lịch sử sự cố 1 máy (cột phải) — theo khoảng ngày |

Dữ liệu lấy trực tiếp từ bảng sự cố máy (cùng nguồn với màn hình "Quản lý sự cố" — xem `ERROR_INCIDENT_MANAGEMENT.md`), **không phải** engine tính downtime của 5 widget Dashboard (`DASHBOARD_KPI_WIDGETS.md`). ⚠️ **Số ở popup này có thể lệch với số trên Card Dashboard đã click vào** — đây là quyết định đã chốt (không phải bug), vì 2 nguồn dữ liệu khác nhau và bảng sự cố máy chỉ có dữ liệu từ khi feature "Quản lý sự cố" ra mắt trở đi, không có lịch sử trước đó.

Tất cả đều yêu cầu:
- Header `Authorization: Bearer <accessToken>`
- Permission: `machine_incident:view` (dùng chung với màn hình Quản lý sự cố, không phải `dashboard:view`)
- Response bọc trong `APIResponse` chuẩn: `{ "code": 200, "result": { ... } }`. GET không có `message`.

---

## 2. Tham số chung

### 2.1 `byFilter` — query params

| Param | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| `filterId` | number | ✅ | Id filter, lấy từ `GET /api/industryFilters/v1` (giống Dashboard). |
| `shiftFilterId` | number | ❌ | Thu hẹp thêm về 1 ca — **hiện KHÔNG được hỗ trợ**, popup này không có khái niệm ca. Truyền vào sẽ bị lỗi 400 (xem mục 5). |
| `spaceId` | number | ❌ (chỉ có ở danh sách máy, không có ở incidents) | Xưởng/nhà máy muốn lọc. **Không truyền = trả về tất cả máy user có quyền xem** (khác Dashboard — ở đó `spaceId` bắt buộc). |
| `keyword` | string | ❌ (chỉ có ở danh sách máy) | Tìm theo tên/mã máy. |

### 2.2 `byDateRange` — query params

| Param | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| `startDate` | `yyyy-MM-dd` | ✅ | |
| `endDate` | `yyyy-MM-dd` | ✅ | Phải `>= startDate`. |
| `filterId` | number | ❌ | Nếu truyền, **bắt buộc phải là 1 filter loại ca** — nhưng popup này không hỗ trợ ca nên **luôn báo lỗi 400 nếu truyền bất kỳ giá trị nào** (xem mục 5). Đừng truyền field này. |
| `spaceId` | number | ❌ (chỉ có ở danh sách máy) | Giống trên. |
| `keyword` | string | ❌ (chỉ có ở danh sách máy) | Giống trên. |

### 2.3 Phân trang

- `page` (mặc định `0`), `size` (mặc định `10`, tối đa `100`) — dùng chung ở cả 4 endpoint.
- **Danh sách máy (`.../machines`) không có `sort` tuỳ chỉnh** — luôn sort cứng theo tổng downtime giảm dần, truyền `sort` cũng bị bỏ qua.
- **Lịch sử sự cố (`.../incidents`) có `sort`** — mặc định `startTime,DESC`. Field hợp lệ: `incidentCode`, `machineCode`, `machineName`, `status`, `startTime`, `endTime`, `durationMinutes` (giống hệt màn hình Quản lý sự cố).

---

## 3. Chi tiết từng endpoint

### 3.1 Danh sách máy (cột trái)

**`GET /api/downtime/v1/machines/byFilter?filterId=4&spaceId=2&keyword=CNC&page=0&size=10`**
**`GET /api/downtime/v1/machines/byDateRange?startDate=2026-09-01&endDate=2026-09-23`**

Response:
```json
{
  "code": 200,
  "result": {
    "page": {
      "content": [
        {
          "machineId": "ad2b577f-ffe0-47a0-adb8-b3088d68aa7a",
          "machineCode": null,
          "machineName": "Máy CNC 4 đầu 16 dao No05",
          "location": "CNC - Yên Sơn Xưởng 6 - Yên Sơn",
          "totalDowntimeMinutes": 270,
          "formattedDowntime": "4h 30m"
        }
      ],
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 6,
      "totalPages": 1,
      "first": true,
      "last": true,
      "empty": false
    },
    "totalAffectedMachines": 6,
    "totalDowntimeMinutes": 348
  }
}
```

| Field | Type | Ý nghĩa |
|---|---|---|
| `page.content[].location` | string | Đường dẫn đầy đủ chuyền → xưởng → nhà máy, **luôn tính live theo vị trí hiện tại của máy** (không phải snapshot cũ như bên màn hình Quản lý sự cố). |
| `page.content[].totalDowntimeMinutes` | number | Tổng phút downtime của riêng máy đó trong khoảng đang lọc — **có tính cả sự cố đang diễn ra** (xem "Sự cố đang mở" bên dưới). |
| `page.content[].formattedDowntime` | string | BE tự format sẵn (`"48m"` / `"1h"` / `"4h 30m"`) — FE dùng thẳng, không cần tự tính. |
| `totalAffectedMachines` (ngoài `page`) | number | Tổng số máy khớp filter hiện tại (không chỉ trang này). |
| `totalDowntimeMinutes` (ngoài `page`) | number | Tổng downtime cộng dồn của **tất cả** máy khớp filter (không chỉ trang này) — dùng cho badge "Tổng thời gian lỗi" ở header popup. |

Máy không có sự cố nào trong khoảng lọc thì **không xuất hiện** trong danh sách này (không trả về với `totalDowntimeMinutes=0`).

### 3.2 Lịch sử sự cố 1 máy (cột phải)

**`GET /api/downtime/v1/machines/byFilter/ad2b577f-ffe0-47a0-adb8-b3088d68aa7a/incidents?filterId=4`**
**`GET /api/downtime/v1/machines/byDateRange/ad2b577f-ffe0-47a0-adb8-b3088d68aa7a/incidents?startDate=2026-09-23&endDate=2026-09-23`**

Response:
```json
{
  "code": 200,
  "result": {
    "machineInfo": {
      "machineId": "ad2b577f-ffe0-47a0-adb8-b3088d68aa7a",
      "machineCode": null,
      "machineName": "Máy CNC 4 đầu 16 dao No05",
      "location": "CNC - Yên Sơn Xưởng 6 - Yên Sơn",
      "totalDowntimeMinutes": 270,
      "formattedTotalDowntime": "4h 30m",
      "totalIncidents": 2
    },
    "page": {
      "content": [
        {
          "incidentCode": "2026_0923_08",
          "startTime": "2026-09-23T14:52:05.689172",
          "endTime": null,
          "rootCause": null,
          "durationMinutes": 25,
          "formattedDuration": "25m"
        },
        {
          "incidentCode": "2026_0923_06",
          "startTime": "2026-09-23T14:41:45.944468",
          "endTime": "2026-09-23T14:44:53.893458",
          "rootCause": "Lão hóa gioăng phớt cao su",
          "durationMinutes": 3,
          "formattedDuration": "3m"
        }
      ],
      "pageNumber": 0,
      "pageSize": 10,
      "totalElements": 2,
      "totalPages": 1,
      "first": true,
      "last": true,
      "empty": false
    }
  }
}
```

| Field | Type | Ý nghĩa |
|---|---|---|
| `machineInfo` | object | Header của cột phải — **luôn có**, kể cả khi máy chưa từng có sự cố nào trong khoảng lọc (khi đó `totalDowntimeMinutes`/`totalIncidents` = `0`, `formattedTotalDowntime` = `"0m"`, `page.content` = `[]`). Không trả 404 cho trường hợp này. |
| `page.content[].incidentCode` | string | Mã hiển thị (`yyyy_MMdd_NN`) — dùng làm `id` hiển thị trên UI, tương đương field `id` trong spec gốc. |
| `page.content[].rootCause` | string \| `null` | Nguyên nhân do KTV nhập (xem `ERROR_INCIDENT_MANAGEMENT.md`) — `null` nếu KTV chưa cập nhật. |

#### ⚠️ Sự cố đang mở (`endTime: null`) — quan trọng cho UI

Một dòng sự cố có `endTime: null` nghĩa là máy **đang lỗi ngay bây giờ**. Ở dòng đó:
- `durationMinutes`/`formattedDuration` **vẫn có giá trị** — BE tự tính "đã trôi qua bao lâu tính đến hiện tại" (hoặc đến hết `endDate` nếu đang xem 1 khoảng ngày trong quá khứ), **không phải `null`**.
- Số này **tăng dần theo thời gian thực** mỗi lần FE gọi lại API (không phải giá trị cố định) — nếu muốn hiển thị đồng hồ chạy real-time trên UI, FE phải tự cộng dồn từ `startTime` đến thời điểm hiện tại phía client, **không đợi gọi lại API**.
- Con số này cũng được cộng vào `totalDowntimeMinutes` ở cả `machineInfo` (mục này) lẫn dòng máy tương ứng ở danh sách cột trái (mục 3.1).

---

## 4. Lỗi thường gặp

| HTTP | body `code` | Khi nào | Endpoint |
|---|---|---|---|
| 400 | 80001 | Thiếu param bắt buộc / sai định dạng ngày / `endDate < startDate` | Cả 4 |
| 400 | 912 | Truyền `shiftFilterId` (byFilter) hoặc `filterId` (byDateRange) — popup này không hỗ trợ lọc theo ca | Cả 4 |
| 401 | 2 | Thiếu/hết hạn access token | Cả 4 |
| 403 | 1 | Có token nhưng thiếu permission `machine_incident:view` | Cả 4 |
| 403 | 404 | `spaceId` tồn tại nhưng người dùng không có quyền truy cập | 2 endpoint danh sách máy |
| 403 | 404 | `{machineId}` tồn tại nhưng nằm ngoài phạm vi space user được gán | 2 endpoint lịch sử sự cố |
| 404 | 401 | `spaceId` không tồn tại | 2 endpoint danh sách máy |
| 404 | 101 | `{machineId}` trong path không tồn tại (không tìm được máy để dựng `machineInfo`) | 2 endpoint lịch sử sự cố |

---

## 5. Ví dụ luồng dùng thực tế trên UI

1. User click Card "THỜI GIAN DOWNTIME" trên Dashboard → popup mở, **kế thừa nguyên context filter đang chọn ở Dashboard** (cùng `spaceId`/`filterId` hoặc `startDate`/`endDate` — không hỏi lại user).
2. Gọi `GET .../machines/byFilter` (hoặc `byDateRange`) với context đó → render cột trái, **tự động chọn (active) dòng đầu tiên** (đã sort sẵn giảm dần theo downtime — dòng đầu = máy lỗi nhiều nhất).
3. Ngay sau đó gọi `GET .../machines/byFilter/{machineId}/incidents` với `machineId` của dòng vừa active → render cột phải.
4. User bấm sang máy khác ở cột trái → **chỉ gọi lại bước 3** với `machineId` mới, giữ nguyên cột trái (không gọi lại bước 2) — đúng như spec gốc yêu cầu để tránh nháy giật trang.
5. User đóng popup, không có hành động ghi dữ liệu nào ở đây — muốn sửa `rootCause`/`resolution` phải sang màn hình "Quản lý sự cố" riêng (`ERROR_INCIDENT_MANAGEMENT.md`), popup này chỉ đọc.

---

## 6. Tham chiếu code BE (cho ai cần đọc thêm)

- Constants/paths: `constants/downtime/DowntimeConstants.java`
- Request DTO: `model/dtos/downtime/requests/Downtime{Date,MachineDate}{Filter,Range}Request.java`
- Response DTO: `model/dtos/downtime/responses/DowntimeMachine{,List,Info,Incident,IncidentList}Response.java`
- Service: `services/resourcesServices/downtime/DowntimeServiceImplementation.java`
- Query tổng hợp: `repositories/MachineIncidentRepository.java` (`findMachineDowntimeRollupPaged`, `countMachineDowntimeRollupGroups`, `findMachineDowntimeSummary`)
