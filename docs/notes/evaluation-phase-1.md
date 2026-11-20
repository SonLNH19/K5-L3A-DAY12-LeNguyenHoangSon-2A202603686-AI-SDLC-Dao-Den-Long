# Đánh giá Phase 1

## Kết quả thực tế local

Môi trường: Windows, Node.js v26.13.1, npm 11.20.0; Chrome chạy qua Playwright với software WebGL. Chỉ mô tả các kiểm tra đã chạy; không suy ra đã qua test ẩn.

| Phạm vi | Kết quả | Bằng chứng / cách chạy lại |
|---|---|---|
| Logic và CLI/headless | 41 test đạt | npm run verify; docs/proof/phase-1/tests.tap |
| Giao diện 3D, di chuyển, nhảy, tạm dừng, bố cục cửa sổ nhỏ | Browser test đạt | npm run test:browser; browser/intro.png, playing.png, small-window.png |
| Nạp đèn cuối bằng phím E, thắng và chơi lại | Browser test đạt | browser/won.png; tests/browser/game.spec.mjs |
| Va chạm dẫn tới thua và chơi lại | Browser test đạt | browser/lost.png; tests/browser/game.spec.mjs |
| Phím F tiêu hao và làm choáng, một đèn sáng | Browser test đạt | browser/pulse-and-lit-lamp.png |
| Tính tất định | Hai output giống hệt | determinism-a.jsonl, determinism-b.jsonl; SHA-256 trong report.json |
| Lượt mặc định từ đầu tới thắng | Bot dùng input thật, không scenario override; 1845 tick, 30.75s mô phỏng, 1808 điểm | full-run.inputs.json, full-run.jsonl, full-run.summary.json |
| Build web tĩnh | Đạt trên Windows | npm run build; dist/ |
| Cài lại vào thư mục sạch | npm ci offline từ cache, verify và proof đạt | .qa/clean-check/; thư mục này bị ignore, không nộp node_modules |
| Linux và macOS | Chưa có kết quả chạy trên các hệ này | Workflow verify.yml đã chuẩn bị; cần push và xem các job tương ứng |
| Test ẩn của giảng viên | Chưa có quyền chạy | Không khẳng định đạt |
| Review và chơi thử của người học | Chờ người học thực hiện | docs/HUONG-DAN.md, mục 4 |
| Tag phase-1 / nộp GitHub / xác nhận public | Chưa thực hiện phát hành | Cần review bằng chứng, kiểm tra hạn Coach và phát hành commit đúng |
| Video demo | Chưa quay | Cần video .mp4 dưới 5 phút khi bàn giao cuối |
| Phase 2–4 và Release v1.0.0 | Chưa làm | Chưa có ticket |

Ảnh scenario thắng/thua là bằng chứng chạy đúng tình huống chỉ định, không phải ảnh khẳng định người học đã tự chơi hết màn. File full-run là bot kiểm chứng, không phải video demo.

Đã lưu commit local tách phần lõi/headless và phần giao diện/CI, giữ AGENTS.md trong lịch sử. Chưa push hoặc tạo tag. Tài liệu và bằng chứng được lưu ở commit tiếp theo để người học review trước khi phát hành.

## Những gì AI sai và cách sửa

1. Helper test ban đầu nối cả --ticks mặc định và --ticks override. CLI từ chối tham số trùng đúng theo thiết kế, làm bốn test thất bại. Sửa helper bằng Map ghi đè giá trị trước khi tạo args; không nới CLI để che lỗi test.
2. Browser chỉ đọc phím đang giữ, nên tap E/F nhanh giữa hai frame bị bỏ lỡ. Test bấm phím thật phát hiện lỗi. Sửa bằng pendingActions để tick tiếp theo nhận tap; test browser vẫn dùng press nhanh.
3. Bot chỉ đi nhặt/nạp, không tỏa sáng, thua trong thế giới mặc định. Bổ sung chiến lược phòng vệ bằng pulse theo cùng luật chơi, sau đó phát lại toàn bộ inputs qua CLI để đối chiếu end. Không sửa máu/đèn hoặc làm test luôn đạt.
4. Sandbox cho phép chạy browser nhưng cản teardown tiến trình test trên Windows. Chạy cùng bộ test với quyền cần thiết để đóng các tiến trình nó tạo; lượt hoàn tất thật trả mã 0, 4 test đạt.

## Giới hạn và việc tiếp theo

- Chưa kiểm tra Safari và GPU máy Mac thật; CI Chromium không thay thế kiểm tra này.
- WSL trong phiên công cụ trả Access denied. Không có bằng chứng Linux local.
- Chưa đo theo yêu cầu hiệu năng Phase 4 vì chưa có ticket và ngưỡng của phase đó. Số draw calls/triangles trong render.json không phải chứng nhận FPS.
- Người học cần đọc diff, kiểm tra gameplay, xác nhận giả định và tự giải thích được bài.
- Đã kiểm tra lại ở thư mục sạch bằng npm ci, không dùng node_modules của thư mục chính. Đây là kiểm tra bản sao sạch trên Windows, chưa phải clone tag public.
- Khi có ticket mới: cập nhật luật, test hồi quy, ghi lý do thay test cũ và lưu bằng chứng riêng ở tag phase mới.
- Token/chi phí: chưa có thống kê xác thực; cần người học bổ sung ước tính có căn cứ từ giao diện thống kê, không bịa số.

## Retro ngắn của giai đoạn hiện tại

Hiệu quả: lõi dùng chung giúp test CLI và browser kiểm cùng luật; scenario cô lập giúp bắt lỗi tick và tài nguyên; browser test phát hiện lỗi mà test logic không thấy. Cần cải thiện: chạy kiểm tra input giao diện sớm hơn và thử đầy đủ một lượt mặc định trước khi kết luận game chơi được. Giữ harness gọn và kiểm chứng tự động trước mỗi lần phát hành.
