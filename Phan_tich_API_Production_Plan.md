# Phân tích API cho trang Production Plan & Monitor
# Dự án: QWaste ABE FE  |  Ngày: 2026-07-06
Tài liệu tổng hợp cấu trúc dữ liệu và các API (endpoint) cần thiết cho 2 trang: /admin/production-plan và /admin/production-plan/monitor, dựa trên phân tích code FE hiện tại.

## 1. Hiện trạng kết nối Backend
Cả 2 trang hiện chủ yếu chạy trên dữ liệu mock (_utils/mockData.ts). Chỉ có 2 điểm đã kết nối Backend thật:

| Thành phần | File | Trạng thái BE |
| --- | --- | --- |
| Bảng kế hoạch (daily/weekly) | page.tsx | Mock, mọi CRUD chỉ ở local state |
| Import Excel | ImportModal.tsx -> ProductionPlanService.ts | Thật: POST /plans/v1/import |
| Bảng Monitor | monitor/page.tsx | Mock base + overlay qua WebSocket |
| Cập nhật trạng thái real-time | useProductionMonitor.ts | Thật: WS subscribe /topic/production/status |
| Modal xử lý sự cố (Incident) | IncidentConfirmModal.tsx | Mock, có TODO hardcode planQuantity/calculatedPcs |


## 2. Cấu trúc dữ liệu (Data Model)
Định nghĩa hiện có trong src/types/ProductionPlan.ts, Backend nên xây theo đúng shape này:
type Schedule = [mon: number, tue: number, wed: number, thu: number, fri: number, sat: number, sun: number]; // Labeled tuple cho 7 ngày
type ProductionStatus = 'TODO' | 'IN_PROGRESS' | 'PAUSE' | 'COMPLETE';
interface ProductionProduct {
code: string;
name: string;
machine: string;
machineOverrides?: (string | undefined)[]; // len 7, override may theo tung ngay
mold: string;
time: string;
pcsMultiplier: number;
schedule: Schedule;
status?: ProductionStatus;
}
interface ProductionLine extends Omit<SpacePickingResponse, 'displayOrder' | 'spaceLevel'> {
products: ProductionProduct[];
}
interface ProductionStatusUpdate { // WS payload
code: string;
machine: string;
status: ProductionStatus;
timestamp: string;
}
interface MonitorProduct extends ProductionProduct {
spaceName: string;
status: ProductionStatus; // required
updatedAt: Date | null;
}

### Giải thích từng field (ProductionProduct)

| Field | Ý nghĩa |
| --- | --- |
| code | Mã sản phẩm duy nhất, vd P-1001. Dùng làm key chính (row key, match WS status, lookup modal). |
| name | Tên hiển thị / mô tả sản phẩm. |
| machine | Máy mặc định được gán sản xuất, vd CNC-01. Dùng để group hàng trong bảng (rowspan theo máy). |
| machineOverrides | Mảng 7 phần tử (Thu2..CN), moi phan tu optional string. Cho phep 1 ngay cu the chay tren may khac voi machine mac dinh, khong doi machine goc. Duoc set qua action "Transfer Machine". |
| mold | Ma khuon/tooling dung cho san pham nay, vd M-12A. |
| time | Chuoi hien thi khung gio ca san xuat, vd "06:00 - 08:30". Text tu do, khong parse thanh Date. |
| pcsMultiplier | He so quy doi case -> pcs (cai le). pcs = schedule[dayIndex] * pcsMultiplier. |
| schedule | Tuple [n,n,n,n,n,n,n], so luong (don vi case) tung ngay Thu2->CN. Dung cho ca view daily (1 ngay) va weekly (tong tuan). |
| status | ProductionStatus mac dinh/seed khi chua co WS update nao cho code nay. Trang thai real-time thuc te lay tu WS ProductionStatusUpdate, khong phai field nay. |


## 3. API cần cho /admin/production-plan

| Mục đích | Method + Path | Request | Response |
| --- | --- | --- | --- |
| Lấy kế hoạch tuần/ngày | GET /plans/v1?date=&view=daily\ | weekly | query date | ProductionLine[] |
| Tạo sản phẩm trên 1 space (khu vực) | POST /plans/v1/{spaceId}/products | ProductionProduct (khong co code) | product vua tao (co code) |
| Sửa sản phẩm | PUT /plans/v1/products/{code} | partial ProductionProduct | product da cap nhat |
| Xóa sản phẩm | DELETE /plans/v1/products/{code} | - | 204 |
| Sắp xếp lại thứ tự trong space | PATCH /plans/v1/{spaceId}/reorder | { activeCode, overCode } | 204 / space cap nhat |
| Chuyển máy (Transfer Machine) | POST /plans/v1/products/{code}/transfer-machine | { dayIndex, newMachine } | product cap nhat |
| Chuyển lịch (Transfer Schedule) | POST /plans/v1/products/{code}/transfer-schedule | { fromDayIndex, toDayIndex, newMachine } | product cap nhat |
| Import Excel (đã có) | POST /plans/v1/import | multipart file | ImportResult |
| Xác nhận import bị hoãn (cần kiểm tra BE) | POST /plans/v1/import/confirm | { sessionToken } | GAP - can xac nhan voi BE |


### Ví dụ JSON - GET /plans/v1
[
{
"spaceId": 1,
"spaceCode": "press-team",
"spaceName": "PressTeam",
"products": [
{
"code": "P-1001",
"name": "Ban hoc sinh Maple phu son PU 2 lop",
"machine": "CNC-01",
"machineOverrides": [null, null, "CNC-02", null, null, null, null],
"mold": "M-12A",
"time": "06:00 - 08:30",
"pcsMultiplier": 24,
"schedule": [18, 22, 20, 16, 24, 12, 5],
"status": "IN_PROGRESS"
}
]
}
]

### Ghi chú: schedule index 0 = Thu 2 .. 6 = Chu nhat. machineOverrides la null/bo qua hoac mang do dai 7, cac slot null nghia la dung machine mac dinh.

### Ví dụ JSON - Create / Edit product
// POST /plans/v1/{spaceId}/products  hoac  PUT /plans/v1/products/{code}
{
"name": "Chot go",
"machine": "CNC-01",
"mold": "A1",
"time": "13:00 - 14:00",
"pcsMultiplier": 144,
"schedule": [1, 2, 1, 1, 2, 1, 0]
}
// Response: giong body + "code": "P-1004" (server sinh)

### Ví dụ JSON - Reorder / Transfer
// PATCH /plans/v1/{spaceId}/reorder
{ "activeCode": "P-1003", "overCode": "P-1001" }
// POST /plans/v1/products/{code}/transfer-machine
{ "dayIndex": 3, "newMachine": "CNC-02" }
// POST /plans/v1/products/{code}/transfer-schedule
{ "fromDayIndex": 3, "toDayIndex": 5, "newMachine": "CNC-02" }

### Ví dụ JSON - Import Excel Result (đã tồn tại)
// Response cua POST /plans/v1/import
{
"requiresConfirmation": true,
"sessionToken": "9f2c1a7e-4b3d-4a11-8f2a-1234567890ab",
"totalInserted": 148,
"importedDays": ["2026-07-06", "2026-07-07"],
"deferredDays": ["2026-07-08"],
"skippedDays": [
{ "date": "2026-07-09", "reason": "Ngay nghi le" }
],
"errors": [
{ "rowIndex": 12, "dayLabel": "Thu 3", "column": "So luong", "message": "Gia tri khong phai so" }
]
}
// Import confirm (GAP - kiem tra voi BE co san hay chua)
// POST /plans/v1/import/confirm
{ "sessionToken": "9f2c1a7e-4b3d-4a11-8f2a-1234567890ab" }

## 4. API cần cho /admin/production-plan/monitor

| Mục đích | Method / Channel | Payload |
| --- | --- | --- |
| Lấy danh sách sản phẩm + trạng thái ban đầu | GET /plans/v1/monitor?date= | -> MonitorProduct[] |
| Cập nhật trạng thái real-time (đã có) | WS sub /topic/production/status | ProductionStatusUpdate |
| Sự cố: dừng hẳn (opt1) | POST /plans/v1/products/{code}/incident/terminate | { reason? } |
| Sự cố: hoãn / chuyển sản lượng còn lại (opt2) | POST /plans/v1/products/{code}/incident/defer | { transferDayIndex, transferMachine, newMold, reason } |
| Sự cố: sửa chữa (opt3) | POST /plans/v1/products/{code}/incident/repair | { reason } |


### Ví dụ JSON - GET /plans/v1/monitor
[
{
"code": "P-1003",
"name": "Chan ban sat son tinh dien",
"machine": "CNC-01",
"machineOverrides": null,
"spaceName": "PressTeam",
"mold": "M-13B",
"time": "10:00 - 12:00",
"pcsMultiplier": 4,
"schedule": [200, 200, 200, 200, 200, 100, 0],
"status": "PAUSE",
"updatedAt": "2026-07-06T03:12:45.000Z",
"planQuantity": 800,
"calculatedPcs": 312
}
]

### Ghi chú: planQuantity/calculatedPcs là field MỚI, chưa có trong type FE hiện tại - cần bổ sung để thay thế MOCK_PLAN_QTY/MOCK_CALCULATED_PCS đang hardcode trong IncidentConfirmModal.tsx (dòng 22-24). updatedAt = null nếu sản phẩm chưa từng có status push nào.

### Ví dụ JSON - WS push ProductionStatusUpdate (đã có)
// Topic: /topic/production/status
{
"code": "P-1003",
"machine": "CNC-01",
"status": "PAUSE",
"timestamp": "2026-07-06T03:12:45.000Z"
}

### Ví dụ JSON - Incident actions
// POST /plans/v1/products/{code}/incident/terminate
{ "reason": "May hong, dung san xuat" }
// POST /plans/v1/products/{code}/incident/defer
{
"transferDayIndex": 5,
"transferMachine": "CNC-02",
"newMold": "M-13B-alt",
"reason": "Chuyen san luong con lai sang thu 6"
}
// POST /plans/v1/products/{code}/incident/repair
{ "reason": "Bao tri may CNC-01" }
// Response ca 3: 200/204, FE chi hien toast thanh cong + dong modal

## 5. Các điểm cần xác nhận với Backend (Gaps)
Chưa có GET REST nào cho danh sách plan/monitor - trang đang bootstrap từ mock array. Cần API này trước khi wire dữ liệu thật.
MonitorProduct thiếu field planQuantity/calculatedPcs mà modal Incident cần.
Luồng xác nhận import (sessionToken cho deferredDays) đã hiện trên UI nhưng chưa thấy API confirm được gọi trong code - cần xác nhận BE đã có endpoint này chưa.
machineOverrides (override máy theo từng ngày) - cần thống nhất model lưu trữ: bảng riêng theo (code, dayIndex) hay cột mảng trên product.