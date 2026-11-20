# Đánh giá Phase 2 (Ticket-02 — "Ba hòn đảo")

## Kết quả thực tế local

Môi trường: Windows, Node.js v26.13.1, npm 11.20.0; Chrome chạy qua Playwright với WebGL. Chỉ ghi nhận các kết quả đã kiểm chứng thực tế; không tự nhận đã vượt qua bộ test ẩn.

| Phạm vi | Kết quả | Bằng chứng / cách chạy lại |
|---|---|---|
| Logic và Test Contract v1.1 | 45 test đạt (100%) | `npm run verify`; `docs/proof/phase-2/tests.tap` |
| Bằng chứng kịch bản headless các tính năng mới | Đạt toàn bộ: dash, wind-charm, jump-pad, stray-wind, fall, pause, night2, night3 | `npm run proof`; `docs/proof/phase-2/*.jsonl` |
| Tính tất định (Determinism) | 2 output cùng seed giống hệt từng byte trên cả 3 Đêm | `docs/proof/phase-2/determinism-night{1,2,3}-{a,b}.jsonl` |
| Lượt chơi bot thế giới mặc định | Thắng trong 11.837 ticks (197.28s), 1.055 điểm, replay CLI khớp từng byte | `docs/proof/phase-2/full-run.{inputs.json,jsonl,summary.json}` |
| Hiệu năng headless (DoD <= 30s) | 21.600 ticks headless hoàn thành trong 0.510s (nhanh hơn yêu cầu 58 lần) | `docs/proof/phase-2/benchmark-21600.jsonl`; `report.json` |
| Giao diện 3D và tương tác trình duyệt | 4/4 browser test đạt (WASD, Space, Shift dash, Esc pause, E nạp đèn, F tỏa sáng) | `npm run test:browser`; `docs/proof/phase-2/browser/*.png` |
| Build web tĩnh không phụ thuộc CDN | Đạt | `npm run build`; `dist/` |
| Linux và macOS | Workflow CI đã sẵn sàng | `.github/workflows/verify.yml` |
| Test ẩn giảng viên | Chưa có quyền truy cập | Không tự khẳng định đạt |

---

## Những gì AI sai trong Phase 2 và cách khắc phục

1. **Thứ tự kiểm tra bục nhảy (Jump Pad) trong tick simulation**:
   - *Lỗi:* Ban đầu `padActive` và `padVel` được gán sau khối tính toán vận tốc `p.vel`, khiến vận tốc phóng trên tick kích hoạt bị ghi nhận là 0 thay vì 24 m/s.
   - *Phát hiện:* Unit test `jump pad on Night 2 launches player towards Island B center with Vy=14, Vhoriz=24` báo lỗi `0 != 24`.
   - *Cách sửa:* Cập nhật trực tiếp `p.vel` ngay khi phát hiện chạm bục nhảy, bảo đảm tính tức thời của lực phóng.

2. **Lọc thực thể Gió Lạc (Drifter) khi bị Tỏa Sáng**:
   - *Lỗi:* Khi Tỏa Sáng đánh trúng Gió Lạc đang bỏ chạy có đom đóm, `d.stolen` được đặt về 0 và `despawnTicks` đặt thành 120. Điều kiện lọc mảng ban đầu yêu cầu `fleeTicks > 0`, khiến Gió Lạc bị xóa ngay khỏi mảng thay vì tồn tại 120 ticks để rơi đom đóm.
   - *Phát hiện:* Unit test `pulse on fleeing stray wind carrying stolen motes` báo `TypeError: Cannot read properties of undefined`.
   - *Cách sửa:* Chỉnh lại điều kiện lọc để giữ thực thể nếu `d.despawnTicks > 0`.

3. **Thời gian rơi tự do khi trượt khỏi mép đảo (Y < -10)**:
   - *Lỗi:* Với tốc độ chạy 6 m/s và đảo bán kính 40m, xuất phát từ x=39.5 cần 5 ticks để ra khỏi đảo, và rơi dưới gia tốc trọng trường g=-20 m/s² cần khoảng 60 ticks để đạt độ sâu Y < -10. Test ban đầu chỉ cho 60 bước nên chưa kịp chạm ngưỡng -10.
   - *Phát hiện:* Unit test `falling off island` chưa thấy sự kiện rơi tại tick 60.
   - *Cách sửa:* Tăng số bước di chuyển lên 90 ticks để rơi vượt ngưỡng -10 một cách dứt khoát.

4. **Trùng lặp tham số CLI trong harness kiểm chứng**:
   - *Lỗi:* Hàm `run` trong `scripts/proof.mjs` ban đầu truyền nối tiếp tham số, dẫn đến trùng cờ `--night` khi chạy kịch bản Đêm 2/3.
   - *Phát hiện:* `scripts/proof.mjs` ném lỗi `Tham số không hợp lệ: --night`.
   - *Cách sửa:* Dùng `Map` để ghi đè các tham số trước khi thực thi CLI `src/headless.mjs`.

5. **Chiến lược nạp đom đóm của bot chơi tự động**:
   - *Lỗi:* Bot ban đầu chỉ đến đèn khi gom đủ 10 đom đóm. Trong Phase 2, sức chứa tối đa là 10 và đom đóm sinh phân tán, dẫn đến bot bị hết giờ (300s) khi mới thắp được 4/5 đèn.
   - *Phát hiện:* `scripts/demo-route.mjs` báo `state: 'lost'` do hết giờ (`dawn`).
   - *Cách sửa:* Cập nhật logic: bot nạp ngay khi mang >= 4 đom đóm và ở gần đèn, hoặc khi mang >= 7 đom đóm; kết hợp cơ chế Lướt (Dash) để di chuyển nhanh hơn. Kết quả bot thắng trong 11.837 ticks (197.28s) với 1.055 điểm.

---

## Giới hạn và việc tiếp theo

- Đã gắn tag `phase-1` tại commit nền. Sau khi người học rà soát Phase 2, sẽ gắn tag `phase-2`.
- Người học cần đọc và hiểu các thay đổi về số liệu chuẩn, luật Lướt, Gió Lạc, Bùa Gió và bục nhảy.
- Phase 3 sẽ tiếp tục khi người học nhận được Ticket-03.
