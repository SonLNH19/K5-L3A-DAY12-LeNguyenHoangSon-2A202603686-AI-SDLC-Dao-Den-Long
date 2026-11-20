# Đảo Đèn Lồng · Phase 3 — "Đèn cạn dầu"

**Video demo:** chưa quay; sẽ thêm link video `.mp4` trước bàn giao cuối. [Ảnh và bằng chứng Phase 3](docs/proof/phase-3/).

Game 3D góc nhìn thứ ba: cùng Mây gom đom đóm, thắp sáng các Đèn Lồng Lớn và né Bóng Mực, Gió Lạc qua 3 hòn đảo (Đảo Bến, Đảo Cau, Đảo Chuông). Nhân vật, bối cảnh và đề bài là bản gốc của lab Day 12 AI SDLC.

**Phạm vi hiện tại:** Ticket-03 và Test Contract v1.2, giữ các cơ chế Phase 2 chưa bị thay thế. Đèn hao dầu, châm/thắp lại được; mục tiêu là sống sót tới bình minh và giữ ít nhất 60% đèn sáng. [Hướng dẫn Phase 3](docs/HUONG-DAN-PHASE-3.md) · [ADR](docs/notes/ADR-003-fuel-and-dawn.md) · [Breaking changes](CHANGELOG.md).

## Cài và chơi trong 3 lệnh

Cần Node.js 24 LTS hoặc mới hơn, npm và trình duyệt hỗ trợ WebGL. Cài thư viện lần đầu cần mạng; khi chơi không tải CDN hay asset bên ngoài.

```bash
npm ci
npm run build
npm start
```

Mở **http://localhost:4173**. Trên Windows PowerShell, dùng `npm.cmd` thay `npm` nếu bị chặn script (`$env:Path += ';D:\nodejs'`).

## Điều khiển và luật chơi (Ticket-03)

| Phím | Hành động |
|---|---|
| WASD hoặc mũi tên | Di chuyển theo camera (6.0 m/s; 7.2 m/s khi có Bùa Gió) |
| Space | Nhảy (vận tốc 7.0 m/s, trọng lực -20 m/s²) |
| Shift / J | Lướt (14 m/s trong 0.2s, hồi chiêu 1.5s; lướt trên không giữ nguyên độ cao) |
| E | Nạp, thắp lại hoặc châm dầu cho đèn nhận được gần nhất (bán kính 2.0m) |
| F | Tỏa sáng (tốn 3 đom đóm, bán kính 5m, choáng 120 ticks, đẩy lùi 4m) |
| Q / R hoặc kéo chuột phải | Xoay camera |
| Esc / P | Tạm dừng trò chơi (menu Tiếp tục, Chơi lại, Cài đặt) |

### Luật chơi chính:
- **Đom đóm:** Sức chứa `min(20,10+2*successful_lights)`, reset mỗi Đêm. Nhặt tự động khi XZ <= 1.0m và chênh cao <= 1.5m.
- **Đèn lồng:** Thắp mới cần 10, thắp lại cần 5; nạp nhiều lần được. Vừa thắp có 100 dầu, hao 1/s. Mỗi đom đóm châm thêm 10 dầu, dùng ceil phần thiếu, tối đa 100. Cạn thì tắt và xóa tiến độ nạp.
- **Đèn yếu/Bóng hút dầu:** Dưới 30 dầu mất vùng an toàn 6m. Wander tìm đèn yếu, tới trong 2m thì drain hút thêm 5 dầu/s/con. Châm lên >=30 khôi phục vùng và đẩy bóng trong tối đa 30 tick.
- **Mục tiêu mới:** Đêm 1/2/3 dài 240/270/300s. Không thắng sớm; tại bình minh cần sống và có ít nhất 3/5, 4/6, 5/7 đèn đang sáng. Hết máu ở tick cuối vẫn thua trước.
- **Bảng màu dễ phân biệt:** Mở Cài đặt để lưu lựa chọn. Viền/mắt Bóng Mực xanh, cảnh báo trắng kèm ⚠. Đèn tắt xẹp giấy 20%, có vết rách; dầu dưới 30 nhấp nháy 1 Hz.
- **Bóng Mực:** Tốc độ 4.0 m/s (Đêm 3: 4.5 m/s). Đuổi khi khoảng cách <= 12m, bỏ đuổi khi > 18m. Chạm gây mất 1 Ngọn Lửa, rơi floor(đang mang / 2) đom đóm (tồn tại 480 ticks), bất tử 90 ticks (1.5s).
- **Rơi khỏi đảo (Y < -10):** Mất 1 Ngọn Lửa, mất sạch đom đóm, chờ 60 ticks rồi hồi sinh tại điểm xuất phát với 90 ticks bất tử. Hết Ngọn Lửa thì thua ngay.
- **Gió Lạc (Đêm 2 & 3):** Bay nhanh 7 m/s, cướp tối đa 3 đom đóm rồi bay đi. Tỏa Sáng đánh trúng sẽ buộc thả đom đóm đã cướp.
- **Bùa Gió (Đêm 2 & 3):** Tăng tốc chạy lên 7.2 m/s và Lướt không có hồi chiêu trong 10s (600 ticks).
- **Bục nhảy:** Bắn Mây bay qua đảo đích hoặc lên tầng cao (Night 2: sang Đảo B; Night 3: lên tầng 2).

## Điểm số (Ticket-03 thay công thức cũ)

- +5 mỗi đom đóm nạp hoặc châm dầu.
- +100 thắp lần đầu; +40 thắp lại.
- Tổng +5 mỗi Bóng Mực trúng pulse; tổng +15 nếu ngay trước đó đang drain.
- Chỉ khi thắng ở bình minh: mỗi đèn đang sáng +50+floor(fuel), mỗi Ngọn Lửa +50. Không thưởng thời gian. Tổng game vẫn là tổng điểm các Đêm đã thắng.

## Kiểm chứng

```bash
npm run verify
npm run test:browser
npm run proof
```

- `verify`: Kiểm tra cú pháp, 71 test logic/headless/hồi quy và build tĩnh.
- `test:browser`: Kiểm tra toàn diện giao diện WebGL, phím điều khiển, nhảy, lướt, tạm dừng, thắng/thua bằng Playwright.
- `proof`: Kịch bản dầu/drain/refuel/relight/bình minh và hồi quy, tất định 3 Đêm, lượt mặc định seed 4 thắng ở tick 14400. Benchmark chạy đủ 18000 tick Đêm 3 mới trong scenario không nguy hiểm; không phải số đo FPS.

## Chế độ Headless · Test Contract v1.2

```bash
node src/headless.mjs --seed 19 --night 1 --ticks 600 --out output.jsonl
node src/headless.mjs --seed 19 --night 2 --ticks 600 --out output.jsonl
node src/headless.mjs --seed 19 --night 3 --ticks 600 --out output.jsonl
```

Chạy kịch bản cụ thể:
```bash
node src/headless.mjs --seed 19 --night 2 --scenario tests/scenarios/wind-charm.json --inputs tests/scenarios/wind-charm.inputs.json --ticks 600 --out output.jsonl
```

## Sáng tạo của tôi (Mục F Rubric)

- Tạo hình 3D thủ tục cho cả 3 Đảo: Đảo Bến, Đảo Cau (2 hòn đảo + cầu tre + bục nhảy đối xứng), Đảo Chuông (3 tầng địa hình, tháp chuông cổ, 2 đường dốc đá).
- Hiệu ứng âm thanh tổng hợp đa dạng bằng Web Audio API (nhặt, nạp, thắp đèn, lướt, nhảy, tỏa sáng, bị đánh, bùa gió, đếm ngược 10s cuối).
- Cài đặt âm lượng và độ nhạy chuột lưu trữ qua localStorage.
- Mũi tên chỉ hướng ngoài màn hình thông minh hướng dẫn người chơi tới đèn chưa sáng gần nhất.
- Bảng màu và ánh sáng môi trường tăng dần theo số lượng đèn đã thắp theo đúng chuẩn Ticket-02.
- Phase 3: ánh sáng giảm khi đèn cạn dầu; thanh dầu và dấu hiệu không phụ thuộc màu chỉ ở renderer. [Đánh giá và giới hạn Phase 3](docs/notes/evaluation-phase-3.md).
