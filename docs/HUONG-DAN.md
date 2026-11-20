# Hướng dẫn từng bước cho người học (Phase 2 — Ticket-02)

> Tài liệu bên dưới giữ hướng dẫn Phase 2 để tham khảo. **Bản hiện tại là Phase 3 / v1.2:** xem [HUONG-DAN-PHASE-3.md](HUONG-DAN-PHASE-3.md) để dùng luật, seed và bằng chứng mới. Không áp dụng các luật bị thay bên dưới cho bản hiện tại.

## 1. Bài đã làm tới đâu?

Bản triển khai này hoàn thành **Phase 2 (Ticket-02 — "Ba hòn đảo")** và Test Contract v1.1.
- Toàn bộ số liệu đã được chuẩn hóa theo quy định bắt buộc của Ticket-02.
- Đã mở rộng thế giới lên chuỗi 3 Đêm: Đảo Bến (Đêm 1), Đảo Cau (Đêm 2) và Đảo Chuông (Đêm 3).
- Bổ sung cơ chế: Lướt (Dash), Bùa Gió (Wind Charm), Bục nhảy (Jump Pad), Gió Lạc (Stray Wind), Gió mạnh (Strong Wind), Rơi khỏi đảo có phạt ngọn lửa và hồi sinh.
- Giao diện đầy đủ: HUD thanh 10 ô đom đóm, đồng hồ nhấp nháy đỏ khi <= 30s, vòng hồi chiêu kỹ năng Lướt và Tỏa Sáng, mũi tên chỉ hướng đèn gần nhất, menu tạm dừng, cửa sổ Cài đặt âm lượng và độ nhạy chuột lưu vào localStorage.

## 2. Mở đúng thư mục

Mở PowerShell, nhập:

```powershell
cd 'D:\LAB AITC\LAB 12\K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long'
```

Nếu PowerShell không nhận Node.js, thêm PATH: `$env:Path += ';D:\nodejs'`. Dùng `npm.cmd` thay `npm`.

## 3. Mở game trên Windows

```powershell
npm.cmd ci
npm.cmd start
```

- Mở trình duyệt Chrome hoặc Edge: **http://localhost:4173**.
- Nhấn “Bắt đầu chuyến đi”.

### Bảng điều khiển chuẩn:
| Phím | Hành động |
|---|---|
| WASD hoặc mũi tên | Di chuyển theo camera (6.0 m/s; 7.2 m/s khi có Bùa Gió) |
| Space | Nhảy (vận tốc 7.0 m/s, trọng lực -20 m/s²) |
| Shift / J | Lướt (14 m/s trong 0.2s, hồi chiêu 1.5s; lướt trên không giữ nguyên độ cao) |
| E | Nạp đom đóm vào đèn chưa sáng gần nhất (bán kính 2.0m) |
| F | Tỏa sáng (tốn 3 đom đóm, bán kính 5m, choáng 120 ticks, đẩy lùi 4m) |
| Q / R hoặc kéo chuột phải | Xoay camera |
| Esc / P | Tạm dừng (Tiếp tục, Chơi lại Đêm, Cài đặt, Về menu) |

## 4. Tự kiểm game bằng tay

1. **Thử di chuyển và lướt:** Đi quanh đảo, thử nhấn `Shift` hoặc `J` để lướt nhanh 14 m/s. Thử nhảy rồi lướt trên không để thấy nhân vật giữ nguyên độ cao khi lướt.
2. **Gom đom đóm:** Nhặt đom đóm trên đảo (sức chứa 10 ô hiển thị ở thanh dưới).
3. **Nạp đèn:** Đến gần đèn chưa sáng trong 2.0m và nhấn E để nạp. Đèn cần 10 đom đóm để thắp sáng và nhớ tiến độ qua các lần nạp.
4. **Tỏa sáng và đẩy lùi Bóng Mực:** Khi mang >= 3 đom đóm, nhấn F để xua đuổi Bóng Mực (choáng 120 ticks, đẩy lùi 4m).
5. **Đêm 2 (Đảo Cau):** Đi qua cầu tre nối 2 đảo hoặc nhảy lên bục nhảy tròn để được phóng bay qua đảo bên kia. Thử nhặt Bùa Gió màu đỏ viền vàng tại giữa cầu để tăng tốc chạy lên 7.2 m/s và lướt không hồi chiêu. Cẩn thận Gió Lạc bay cướp đom đóm!
6. **Đêm 3 (Đảo Chuông):** Khám phá đảo 3 tầng, đi theo đường dốc hoặc dùng bục nhảy để bay lên tầng 2 ngắm tháp chuông. Chú ý gió mạnh từng cơn đẩy người chơi.
7. **Cài đặt & Tạm dừng:** Nhấn `Esc` hoặc nút Cài đặt để tùy chỉnh âm lượng và độ nhạy chuột.

## 5. Chạy bộ kiểm chứng tự động

Mở terminal thứ hai tại thư mục repo:

```powershell
npm.cmd run verify
npm.cmd run test:browser
npm.cmd run proof
```

- `verify`: Kiểm tra toàn bộ 45 test logic và headless, kiểm tra cú pháp giao diện và build web tĩnh dist/.
- `test:browser`: Chạy kiểm tra Playwright tự động trên Chrome với 4 kịch bản giao diện (di chuyển, lướt, nhảy, tạm dừng, nạp đèn thắng, thua, tỏa sáng).
- `proof`: Tạo toàn bộ kịch bản headless, kiểm chứng tính tất định trên cả 3 đêm, đo benchmark 21.600 ticks (dưới 1 giây) và lưu bằng chứng tại `docs/proof/phase-2/`.

## 6. Chế độ Headless · Test Contract v1.1

Chạy Đêm 1:
```powershell
node src/headless.mjs --seed 19 --night 1 --ticks 600 --out output.jsonl
```

Chạy Đêm 2:
```powershell
node src/headless.mjs --seed 19 --night 2 --ticks 600 --out output.jsonl
```

Chạy Đêm 3:
```powershell
node src/headless.mjs --seed 19 --night 3 --ticks 600 --out output.jsonl
```

Phát lại lượt thắng mặc định bằng bot:
```powershell
node src/headless.mjs --seed 12 --night 1 --inputs docs/proof/phase-2/full-run.inputs.json --ticks 18000 --out output.jsonl
```

## 7. Gắn tag Phase 2 và nộp bài

Sau khi rà soát toàn bộ diff và bằng chứng:
```powershell
git status
git log -3 --oneline
git tag phase-2
git push origin main
git push origin phase-2
```
