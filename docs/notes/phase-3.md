# Phase 3 — Kế hoạch và truy vết

Nguồn: docs/requirements/TICKET-03.md; nền là Phase 2 / v1.1 tại commit c795a00. Baseline đã chạy 45 test đạt trước sửa. Người dùng yêu cầu thực hiện Phase 3 và giải thích cách chạy.

## Tiêu chí và cách kiểm chứng

| Phần | Cách chứng minh |
|---|---|
| Dầu 100, hao 1/s, hết tắt, ever_lit, relight 5 | phase3.test.mjs; relight.jsonl, fuel-drain.jsonl |
| Châm ceil và chọn đèn nhận được, gần nhất/id | Test refuel, full-lamp zero-decay fixture, tie; refuel.jsonl |
| Drain/threshold 30, hút cộng dồn, thoát trạng thái, đẩy 30 tick | Test riêng cho ranh giới, nhiều con và phục hồi vùng an toàn |
| Thắng tại bình minh 3/5,4/6,5/7, ưu tiên chết ở tick cuối | Test cả ba Đêm, oil exhaustion và last-tick lighting; dawn-win.jsonl |
| Capacity 10+2*n, max20; reset giữa Đêm | Test getter/scenario và browser chuyển Đêm |
| Điểm v1.2 | Test first/relight/refuel/pulse drain và thưởng bình minh |
| UI dầu, đèn xẹp/rách, bảng màu lưu | Browser test + ảnh low-fuel.png/accessible-colors.png |
| Hồi quy | Giữ test di chuyển, dash, jump pad, charm, drifter, pause, validation/CLI |
| Tất định | Hai JSONL giống hệt cho mỗi Đêm; scripts/proof.mjs |

## Thay đổi thiết kế

Xem ADR-003-fuel-and-dawn.md và CHANGELOG.md. Tất cả quy tắc số cụ thể dùng tuning v1.2. Không thay độ khó để ép bot thắng; bot dùng input thật, seed được ghi rõ.

## Nhật ký AI

- Công cụ: OpenAI Codex; đọc bàn giao, code và test Phase 2, triển khai Phase 3, cập nhật GUI/contract/test/tài liệu.
- Phát hiện lỗi chuyển Đêm giữ currentNight cũ qua browser test; sửa showIntro cập nhật Đêm. Sửa CSS primary/secondary button làm hiện nút hidden.
- Test nhảy browser ban đầu nhấn khi dash còn hiệu lực do tốc độ render phần mềm chậm; sửa test chờ trạng thái dash kết thúc thay vì dựa vào sleep 200ms.
- Test cài đặt sau reload bị overlay giới thiệu chặn nút header; thêm nút Cài đặt trong overlay để người dùng truy cập được thật.
- Bot Phase 2 không quản lý dầu và thua. Thêm châm dầu, giữ ngưỡng đèn, ưu tiên tiến độ nạp và tránh nguy hiểm. Một số seed vẫn thua; dùng seed 4 có lượt thắng tái lập, không đổi trạng thái bằng tay.
- Rà soát chuyển drain/stunned → wander để tránh tái kích chase trong cùng tick, thêm test bắt hồi quy.
- Token/chi phí chưa có số liệu xác thực; không ghi số bịa. Tiết kiệm bằng giữ lõi dùng chung và kiểm chứng từng phần.

## Trạng thái

Xem evaluation-phase-3.md và report.json được sinh bởi chương trình. Không tự khẳng định test ẩn giảng viên đạt. Phase 4 chưa có ticket.
