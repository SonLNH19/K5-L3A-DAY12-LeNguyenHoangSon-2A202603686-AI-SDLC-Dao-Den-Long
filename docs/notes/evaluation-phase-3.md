# Đánh giá Phase 3 — Ticket-03 / Contract v1.2

## Kiểm chứng local

Windows, Node.js v26.13.1, Chrome qua Playwright với software WebGL. Chỉ ghi nhận kết quả đã chạy; không thay thế kiểm tra GPU/Safari thật hoặc CI Linux/macOS.

| Phạm vi | Kết quả / bằng chứng |
|---|---|
| Baseline Phase 2 trước thay đổi | 45 test đạt |
| Logic/CLI/hồi quy và v1.2 | 71 test đạt; npm run verify; tests.tap |
| Dầu, châm, thắp lại, drain, bình minh | Test ranh giới và JSONL riêng trong docs/proof/phase-3/ |
| Browser | 5 test đạt: điều khiển cũ, nhảy/dash/pause, thắng ở bình minh/chuyển Đêm, dầu/bảng màu lưu, thua/chơi lại, pulse |
| Tất định ba Đêm | So sánh hai file JSONL cho mỗi Đêm trong proof |
| Lượt mặc định | Seed 4, input thật, không scenario override/state edit, won ở tick 14400, 240s, 1169 điểm; full-run.* |
| Benchmark headless Đêm 3 hiện tại | Chạy đủ 18000 tick, scenario không nguy hiểm/không gió, khoảng 0.073s ở lần đo đầu; kết quả mới nhất trong report.json |
| Bản build web | npm run build đạt |
| Clone sạch trên Windows | Clone local commit 5a50347 vào .qa/phase3-clean, npm ci từ cache, verify và proof đều đạt; clean-clone-report.json ghi commit và môi trường thực tế |
| Linux/macOS và test ẩn | Chưa xác nhận; cần job CI/máy tương ứng và test ẩn giảng viên |

Ảnh trong browser/ là ảnh chạy thật. Các ảnh scenario và lượt bot không thay video người học chơi. Benchmark không đo FPS, không so sánh được như một lượt chơi có đủ nguy hiểm; số bước thực tế được kiểm tra để không nhầm chết sớm là chạy đủ Đêm.

## Hồi quy và yêu cầu bị thay

- Không skip test. Giữ test di chuyển/yaw/chuẩn hóa, dash, nhảy, rơi, charm, drifter, pause, spawn, schema và CLI.
- Cập nhật test điểm nạp, thắng sớm, last-tick win và browser kết thúc theo v1.2. Lý do cụ thể ở ADR-003-fuel-and-dawn.md, comment cạnh test và CHANGELOG.md.
- Không sửa bằng chứng cũ Phase 1/2; test v1.2 chỉ sinh proof/phase-3/.
- Không nhận “mọi test ẩn Phase 1–2 đạt”; chúng không được cung cấp. Chỉ bộ hồi quy local được thực thi.

## Các vấn đề đã phát hiện

- AI cần kiểm tra rõ chuyển drain/stun về wander, tránh generic phát hiện 12m kích chase ngay trong tick chuyển; đã sửa và thêm test riêng.
- Browser test cũ nhấn nhảy lúc dash chưa hết trên render phần mềm: chờ dashTicksLeft=0 thay vì sleep cố định.
- Chuyển Đêm trước đây giữ currentNight cũ, khiến nút bắt đầu mở lại Đêm 1. Sửa showIntro cập nhật currentNight; test kiểm tra sang Đêm 2 và capacity reset.
- CSS button display:flex ghi đè thuộc tính hidden làm hiện nút sai màn hình. Thêm quy tắc [hidden] rõ ràng.
- Sau reload, nút cài đặt header bị màn giới thiệu chặn. Thêm nút Cài đặt truy cập được trong overlay; test lưu/reload dùng đường này.
- Bot cũ không quản lý dầu. Bot mới nạp/châm, phòng vệ và ưu tiên tiến độ. Các seed đã thử có cả thua; seed 4 là lượt thắng được chọn công khai để tái lập, không khẳng định thắng mọi seed.

## Retro và việc còn lại

- Lõi chung tiếp tục giúp GUI và CLI dùng cùng luật. FuelUnits nguyên loại bỏ việc làm tròn ảnh hưởng ngưỡng 30 hoặc cạn dầu. Test sát ranh giới tick cuối có giá trị hơn chỉ demo thắp đèn.
- Người học cần review và chơi thử phần dầu/bảng màu; xem docs/HUONG-DAN-PHASE-3.md.
- Linux/macOS cần chạy CI sau push; chưa có kết quả remote trong phiên local này. Chưa có Ticket-04, video cuối, Release v1.0.0.
- Token/chi phí chưa có thống kê xác thực; không bịa con số. Có ghi cách tiết kiệm và các lỗi AI trong phase-3.md.
