# Phase 4 — Evaluation và checklist phát hành

## Đối chiếu Ticket-04

| Yêu cầu | Triển khai và bằng chứng |
|---|---|
| Contract 1.3, giữ luật trước | game.contract.json; 77 test logic/CLI, không skip luật cũ còn hiệu lực; docs/proof/phase-4/tests.tap |
| Benchmark | scripts/bench.mjs, src/phase4.mjs; cảnh chuẩn và thống kê từ thời gian khung hình thật; bench.json, bench.scene.json |
| Soak 10 Đêm cùng tiến trình | scripts/soak.mjs; soak.json, test kiểm đủ 10 kết quả và RSS |
| Bảng điểm top 10 | src/leaderboard.mjs, API local, CLI export; test thứ tự, giới hạn, ghi/đọc đĩa và export; browser thử lưu sau thua và tải lại |
| Đổi phím, lưu, trùng/reset | 9 hành động; tests/browser/game.spec.mjs và ảnh forest-large-text.png |
| Chỉ báo/accessibility | Cảnh báo xuất hiện + hướng, gió, 10s, dầu thấp; reduced motion, 18px và ×1.25, màu dễ phân biệt |
| Đồ họa rừng | src/forest.mjs, cây/đá/rêu/nấm/dương xỉ; ảnh playing.png; không vào headless/benchmark |
| Đóng gói | scripts/package-release.mjs tạo ZIP có dist và server Node, không cần npm install khi chạy gói |
| Tài liệu | README, CHANGELOG đủ 4 phase, CREDITS, LICENSE và RETRO |
| Video | Có trên Release v1.0.0 và docs/demo/demo.mp4; link đầu README. Bản repo 55.6 MB, 361.0 giây; giữ nguyên thời lượng bản gốc. Nội dung cần người học xác nhận. |

## Kết quả thực chạy

- 77 test logic/CLI đạt, 7 test browser đạt trên Windows. Bằng chứng ảnh là WebGL thật qua Chromium; test trình duyệt dùng software rendering, tách khỏi phép đo FPS dùng GPU.
- Benchmark chuẩn 30 giây, seed 42: avg 167.80 FPS, p1_low 87.49 FPS, load 1473.49ms, RTX4050 Laptop. Các giá trị đầy đủ nằm trong bench.json. Đạt ngưỡng tham khảo cục bộ; giảng viên đo lại trên máy chấm.
- Một lần đo trước chạy trùng với kiểm tra trình duyệt có p1_low thấp. Chạy riêng lại theo README, không sửa số đo bằng tay.
- Soak: 10 Đêm, crashes=0, RSS 32.8359375 → 36.7109375 MB (+11.8%, dưới 20%). Dùng jitless + GC + nursery nhỏ để tránh tăng bộ nhớ JIT trong đo ngắn; cùng một tiến trình và không trừ baseline. Kết quả đều lost là hợp lệ với input ngẫu nhiên.
- Proof tái chạy các scenario giữ từ Phase 1–3, determinism cả 3 Đêm, fuel/refuel, bot thắng Đêm mặc định, và headless đủ 18.000 tick. Xem report.json. Không xác nhận test ẩn khi chưa có kết quả của giảng viên.

## Quyết định và giả định

- Giữ fixed-step 60Hz và tuning Phase 3. Benchmark có cờ riêng, chỉ chạy cùng luật wander, không làm thay đổi mô phỏng gameplay hay RNG thường.
- i của seed soak bắt đầu từ 1: seed 8–17 cho base 7. Điều kiện này được ghi rõ để tái lập.
- Bản web không tắt chắc chắn vsync và không đọc RSS toàn bộ tiến trình web từ trang: báo false/null đúng ngoại lệ ticket, không giả số.
- Chọn server Node cục bộ để bảng điểm thật sự lưu trên đĩa và export bằng CLI; ZIP có bản build sẵn, chạy trên ba hệ điều hành bằng Node ≥24.
- Rừng chỉ để trang trí, RNG riêng và instancing để giảm draw calls. Không bổ sung vật cản hoặc thực thể ảnh hưởng gameplay.

## Checklist theo SUBMISSION/RULES

- [x] Mã nguồn, contract, test và bằng chứng Phase 4.
- [x] README cài/chơi trong 3 lệnh, hướng dẫn macOS/Linux và lệnh kiểm tra.
- [x] Giữ harness AGENTS.md và lịch sử/bằng chứng các phase trước; không force push.
- [x] Changelog 4 phase, credits/license, retro và bàn giao agent.
- [x] Clone sạch chạy đủ 3 lệnh README; ZIP chạy WebGL, 70 cây, không lỗi JavaScript và export bảng điểm. Repo đã xác nhận public qua GitHub API. Kết quả và SHA-256 gói nằm trong release-verification.json.
- Tag/release: các tag phase-1…phase-3 được giữ nguyên; phase-4 và v1.0.0 dành cho commit phát hành. Xác nhận trên trang Tags/Release sau khi push; video sẽ được chủ bài đính kèm sau.
- [x] MP4 đã gắn Release, cập nhật link đầu README; kiểm tra truy cập không đăng nhập trả HTTP 200.
- [ ] Video dưới 5 phút: đo được 361.0 giây.
- [x] Bản MP4 trong repo dưới 100 MB; có cả video trên Release và link đầu README.
- [ ] Chủ bài xác nhận đủ nội dung theo SUBMISSION.
- [ ] Chủ bài nộp link repo public lên LMS đúng hạn Coach; không commit sản phẩm sau hạn lab.

Không đánh dấu hoàn thành video hoặc toàn bộ DoD chỉ vì dự định quay. Thời điểm tag/Release là thời điểm tạo thật; không thể khôi phục thời hạn của phase cũ bằng đổi lịch sử.
