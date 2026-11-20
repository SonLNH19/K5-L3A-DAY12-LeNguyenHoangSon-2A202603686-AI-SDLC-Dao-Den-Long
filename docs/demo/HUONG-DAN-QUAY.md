# Tự quay và nộp video Phase 4

Video thật, file .mp4, tổng thời lượng dưới 5 phút, thấy game đang chơi và bằng chứng test/headless/benchmark. Nên quay 3–4 phút, không cần dựng cầu kỳ hay đọc hết mã nguồn. Không quay thông tin riêng, tài khoản hoặc token. Không dùng ảnh tạo sinh thay bằng chứng.

## Chuẩn bị

1. Mở Terminal ở thư mục chứa package.json, chạy `npm.cmd start` (macOS/Linux dùng npm). Mở http://localhost:4173 trên Chrome/Edge; không dùng link qa cho đoạn chơi thường.
2. Mở Terminal thứ hai cùng thư mục để chạy kiểm tra. Cắm sạc, tắt ứng dụng nặng. Kiểm tra có dung lượng trống và cửa sổ benchmark không bị thu nhỏ.
3. Windows 11: mở **Snipping Tool / Công cụ Cắt**, chọn biểu tượng camera video → New/Mới → khoanh vùng màn hình → Start/Bắt đầu. Nếu có mic và muốn nói thì bật mic; giọng nói không bắt buộc. Công cụ này quay cả trình duyệt và Terminal trong vùng đã chọn. Windows+G chỉ nên dùng khi quay một ứng dụng, không phù hợp khi đổi qua nhiều cửa sổ.

## Kịch bản khoảng 3–4 phút

| Mốc gợi ý | Thao tác và điều cần thấy |
|---|---|
| 0:00–0:15 | Mở game, nói tên và Phase 4: giữ ít nhất 60% đèn sáng tới bình minh. |
| 0:15–1:15 | Bắt đầu, WASD, Space, Shift, gom đom đóm, E nạp đèn, F tỏa sáng khi có ít nhất 3 con. Cho thấy cây/đá và thanh dầu. Không cần thắng cả 3 Đêm trong video. |
| 1:15–1:45 | Cài đặt: bật chữ lớn/giảm chuyển động/bảng màu; đổi phím thử trùng rồi khôi phục. Mở Bảng xếp hạng. Nếu muốn thấy form lưu điểm, chơi đến thua hoặc dùng scenario kiểm thử, phải nói rõ đó là scenario. |
| 1:45–2:15 | Terminal: `npm.cmd run verify`, đợi kết quả đạt; rồi lệnh headless bên dưới. |
| 2:15–3:00 | Terminal: `npm.cmd run bench -- --seed 42 --duration 30 --out bench.json`. Cho thấy cảnh benchmark 200 Bóng Mực và cửa sổ quay vòng. Để cửa sổ benchmark ở trước, đợi tự đóng, thấy JSON kết quả thật. |
| 3:00–3:30 | `npm.cmd run soak -- --seed 7 --nights 10 --out soak.json`. Cho thấy crashes=0 và bộ nhớ. Mở README/Release, kết thúc. |

Headless trên Windows:

```powershell
node src/headless.mjs --seed 19 --night 1 --ticks 600 --out output.jsonl
Get-Content output.jsonl -Tail 1
```

Linux/macOS thay dòng xem cuối bằng `tail -n 1 output.jsonl`. `verify` chỉ gồm logic/CLI/build; có thể cho thấy thêm `npm.cmd run test:browser` nếu còn đủ thời gian. Không nói test ẩn đã đạt.

## Lưu và đính kèm

1. Dừng quay, **Save as/Lưu thành** `demo.mp4`. Mở file xem lại, xác nhận dưới 5 phút, chữ đọc được. Snipping Tool bản hỗ trợ quay xuất MP4. Nếu Windows không có quay: cập nhật Snipping Tool hoặc dùng công cụ quay bạn đang có; không đổi đuôi file để giả MP4.
2. GitHub → repo → Releases → `v1.0.0` → Edit → kéo file demo.mp4 vào vùng Attach binaries → Update release. Không thay tag, không xóa Release cũ.
3. Sao chép link download của demo.mp4, thay dòng **Video demo** ở đầu README bằng link đó; cập nhật tình trạng video trong checklist. Mở bằng cửa sổ ẩn danh để xác nhận không cần đăng nhập.
4. Nếu chưa tới hạn sửa sản phẩm của Coach: commit/push cập nhật README. Không tự ý dời tag phase-4/v1.0.0 đã nộp; hỏi Coach nếu quy định hạn tag yêu cầu bản tài liệu mới. Có thể giữ tag mã nguồn và đính kèm MP4 trực tiếp Release. Không commit thêm sản phẩm sau hạn lab.

Lựa chọn khác: đặt `docs/demo/demo.mp4` nếu dưới 100 MB và commit trước hạn. Đính kèm Release thường đơn giản hơn, không làm repo nặng. Sau đó nộp link repo public lên LMS theo thông báo của Coach.
