# Phase 2 — "Ba hòn đảo" (Ticket-02)
## Yêu cầu, tiêu chí nghiệm thu và kế hoạch kiểm chứng

**Ngày cập nhật:** 20/11/2026
**Mục tiêu:** Thực hiện toàn bộ TICKET-02 (Phase 2), chuyển đổi từ custom tuning sang số liệu chuẩn, mở rộng lên 3 Đêm (Đảo Bến, Đảo Cau, Đảo Chuông), bổ sung cơ chế Lướt, Gió Lạc, Bùa Gió, Bục nhảy, Gió mạnh, HUD đầy đủ, tạm dừng, âm thanh và Test Contract v1.1.

---

## 1. Bảng đối chiếu thay đổi luật chơi (Phase 1 -> Phase 2)

| Thông số / Luật | Phase 1 (Tự chọn) | Phase 2 (Chuẩn hóa TICKET-02) | Lý do thay đổi & Tác động kiểm thử |
|---|---|---|---|
| Contract version | 1.0 | 1.1 | Nâng cấp contract, thêm trường snapshot & scenario |
| Tốc độ chạy | 7.0 m/s | 6.0 m/s (7.2 m/s khi có Bùa Gió) | Giảm tốc độ cơ bản theo chuẩn; cập nhật test di chuyển |
| Nhảy | 7.5 m/s, g=-20 | 7.0 m/s, g=-20 m/s² | Vận tốc nhảy chuẩn hóa |
| Lướt (mới) | Không có | 14 m/s trong 0.2s (12 ticks), hồi 1.5s (90 ticks) | Cơ chế mới, giữ độ cao khi lướt trên không, không bất tử |
| Sức chứa đom đóm | 15 | 10 | Chuẩn hóa sức chứa; thanh HUD 10 ô |
| Nhặt đom đóm | XZ <= 1.8m, bất kể Y | XZ <= 1.0m và \|dY\| <= 1.5m | Giảm bán kính nhặt, thêm điều kiện chênh cao |
| Chi phí thắp đèn | 8 | 10 | Mỗi đèn cần 10 đom đóm, nhớ tiến độ |
| Bán kính tương tác | 3.0 m | 2.0 m | Chuẩn hóa cự ly nạp đèn |
| Tỏa Sáng (Pulse) | Tốn 2, R=8m, hồi 1s, đẩy 5m, choáng 3s | Tốn 3, R=5m (3D), hồi 3s (180 ticks), đẩy 4m ngang (15 tick đầu), choáng 120 ticks | Chuẩn hóa Tỏa Sáng; tác động 3D tâm = chân + 0.8m |
| Bóng Mực tốc độ | 2.4 m/s | 4.0 m/s (Đêm 3: 4.5 m/s) | Tăng tốc độ kẻ địch |
| Bóng Mực va chạm | 1.1 m | XZ <= 1.0m và \|dY\| <= 1.5m | Chuẩn hóa va chạm; kẻ địch recoil lùi 2m trong 60 ticks |
| Bị đánh (Hit) | 3 máu, bất tử 2s, rơi 0 | 3 Ngọn Lửa, bất tử 90 ticks (1.5s), rơi floor(đang mang / 2) vào vành 1.5-2.5m (tồn tại 480 ticks) | Rơi đom đóm có TTL, nhặt lại được từ tick sau |
| Rơi khỏi đảo (Y < -10) | Không phạt rơi (fall_enabled=false) | -1 Ngọn Lửa, mất sạch đom đóm, chờ 60 tick, hồi sinh ở điểm xuất phát, 90 tick bất tử. Hết máu thua ngay (no_flames) | Bật cơ chế rơi khỏi đảo thật |
| Điểm số | +10 nhặt, +100 đèn, +15 pulse | +10 mỗi đom đóm NẠP, +100 đèn, +5 mỗi Bóng Mực trúng Pulse, thắng thưởng floor(giây)*2 + 50*máu | Nhặt không cộng điểm, nạp mới cộng điểm |
| Thời gian Đêm | 300s (Đêm 1) | Đêm 1: 300s, Đêm 2: 330s, Đêm 3: 360s | Hỗ trợ 3 đêm riêng biệt |
| Trạng thái Bóng Mực | chase, repelled, stunned | spawning, wander, chase, recoil, stunned | Chuẩn hóa tên trạng thái |

---

## 2. Tiêu chí nghiệm thu (Acceptance Criteria) cho tính năng mới (Phần 3)

### AC-01: Gió Lạc (Stray Wind)
- **AC-01.1**: Sinh tại tick 1200, 2400,... (mỗi 1200 ticks = 20s) trên điểm sương ngẫu nhiên nếu số lượng hiện tại < 2 con. ID tăng dần: D1, D2,...
- **AC-01.2**: Trạng thái mặc định `idle` (lượn chậm 2 m/s). Chuyển sang `chase` (7 m/s) khi Mây mang >= 5 đom đóm và khoảng cách 3D <= 15m. Mất điều kiện thì quay về `idle`.
- **AC-01.3**: Khi chạm Mây (XZ <= 1.2m): cướp `min(3, đang mang)` đom đóm, phát event `drifter_steal { drifter_id, amount, carried }`, chuyển sang `flee` (bay xa 7 m/s trong 240 ticks rồi biến mất cùng số đã cướp). Mỗi con chỉ cướp tối đa 1 lần.
- **AC-01.4**: Không làm mất Ngọn Lửa, không bị chặn bởi vùng an toàn của đèn, Mây đang bất tử vẫn bị cướp.
- **AC-01.5**: Tỏa Sáng trúng Gió Lạc đang chase -> chuyển sang `flee` không cướp; trúng lúc đang `flee` có đồ -> thả lại toàn bộ đom đóm đã cướp tại chỗ (dạng đom đóm rơi, TTL 480 ticks), phát event `drifter_drop { drifter_id, amount }`, và biến mất sau 120 ticks.

### AC-02: Bùa Gió (Wind Charm)
- **AC-02.1**: Tọa độ: Đêm 2 tại (35,0,0); Đêm 3 tại (30,0,25) và (-30,0,25). ID C1, C2.
- **AC-02.2**: Nhặt khi XZ <= 1.0m và |dY| <= 1.5m. Phát event `charm_picked { charm_id, charm_ticks }`.
- **AC-02.3**: Hiệu lực 600 ticks (10s): tốc độ chạy tăng lên 7.2 m/s; Lướt không có hồi chiêu (sau khi hết 12 tick lướt có thể lướt tiếp nếu nhấn lại phím). Nhặt lại bùa khi đang có bùa sẽ làm mới về 600 ticks.
- **AC-02.4**: Bùa hồi sinh sau 2700 ticks (45s).

### AC-03: Bục nhảy (Jump Pads)
- **AC-03.1**: Đêm 2: 2 bục hình tròn bán kính 1m tại (20,0,18) và (50,0,-18). Khi chân chạm bục: bắn lên với Vy = 14 m/s và V_ngang = 24 m/s hướng về tâm đảo kia. Vận tốc phóng giữ nguyên đến khi chạm đất; phím di chuyển không ghi đè nhưng vẫn lướt được.
- **AC-03.2**: Đêm 3: bục bán kính 1m tại (0,3,13). Bắn Vy = 12 m/s và V_ngang = 8 m/s hướng -Z đến khi chạm đất -> đáp lên tầng 2 (Y=6).

### AC-04: Gió mạnh (Strong Wind - Đêm 3)
- **AC-04.1**: Mỗi 30s (1800 ticks), có 1 cơn gió kéo dài 5s (300 ticks) theo hướng ngẫu nhiên, đẩy người chơi 2 m/s.
- **AC-04.2**: Báo trước 2s (120 ticks) bằng hiệu ứng lá bay và âm thanh. Snapshot ghi `wind: { active, dir_deg }`.

### AC-05: Chuỗi 3 Đêm & Giao diện
- **AC-05.1**: Luồng game: Menu chính -> Giới thiệu Đêm (tên đảo, lời thoại Ông Đăng) -> Chơi -> Màn hình kết quả Đêm -> Chuyển Đêm tiếp theo. Thắng Đêm 3 hiện màn hình Bình Minh với tổng điểm 3 Đêm. Thua cho phép chơi lại Đêm đó.
- **AC-05.2**: Tạm dừng (Esc/P): Dừng hoàn toàn logic. Menu có Tiếp tục, Chơi lại Đêm, Cài đặt, Về menu.
- **AC-05.3**: Cài đặt: Âm lượng và độ nhạy chuột, lưu trữ localStorage.
- **AC-05.4**: HUD đầy đủ:
  - Ngọn Lửa (trên trái)
  - Đồng hồ mm:ss (trên giữa, đỏ và nhấp nháy khi <= 30s)
  - Đèn k/n và điểm số (trên phải)
  - Thanh đom đóm 10 ô (dưới giữa)
  - Icon hồi chiêu Lướt và Tỏa Sáng (dưới phải)
  - Nhắc "E — Nạp ánh sáng (x/10)" khi ở gần đèn chưa sáng
  - Mũi tên chỉ hướng tới đèn chưa sáng gần nhất khi ở ngoài màn hình
- **AC-05.5**: Bảng màu chuẩn theo Part 3 và độ sáng môi trường tăng tuyến tính: `intensity = 0.15 + 0.55 * (lit_lanterns / total_lanterns)`.

---

## 3. Kế hoạch kiểm chứng và Test Contract v1.1

1. Cập nhật `game.contract.json` sang version 1.1 với tuning chuẩn.
2. Kiểm tra tính tương thích hồi quy của các unit test: cập nhật các test kỳ vọng số liệu cũ sang số liệu mới kèm chú thích rõ ràng.
3. Viết kịch bản headless scenario cho từng tính năng mới:
   - `tests/scenarios/dash.json`
   - `tests/scenarios/wind-charm.json`
   - `tests/scenarios/jump-pad.json`
   - `tests/scenarios/stray-wind.json`
   - `tests/scenarios/fall.json`
   - `tests/scenarios/pause.json`
   - `tests/scenarios/night2.json`
   - `tests/scenarios/night3.json`
4. Kiểm tra tính tất định 100% giữa 2 lần chạy cùng seed trên cả 3 đêm.
5. Chạy headless một Đêm đầy đủ (tối đa 21.600 ticks) và đo thời gian thực thi (mục tiêu <= 30 giây).
6. Chạy kiểm tra browser với Playwright và lưu bằng chứng vào `docs/proof/phase-2/`.
