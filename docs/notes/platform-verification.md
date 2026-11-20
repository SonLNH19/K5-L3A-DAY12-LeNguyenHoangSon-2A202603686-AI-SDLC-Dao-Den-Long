# Kiểm tra Linux/macOS thực tế qua GitHub Actions

## Bản được kiểm tra

- Tag Phase 3: f8b839076ca23de896b5b79a46caaebb8e41243b.
- Đã push nhánh kiểm tra riêng verify/phase3-platforms; không push main trên GitHub hoặc di chuyển tag phase-3.
- Lượt đầu: [44751112958](https://github.com/SonLNH19/K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long/actions/runs/44751112958), chạy đúng commit của tag.
- Lượt tiếp theo: [44752004828](https://github.com/SonLNH19/K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long/actions/runs/44752004828), commit fc803d010af2e6c0318424ab6627c95eb7588e4f.

Commit fc803d0 sửa thời gian chờ Playwright trên CI: toàn bài120s thay45s, expectation15s, navigation60s. Các commit 7b24c77/94c8481 đổi runner sang macOS15 rồi macOS15 Intel do hàng đợi ARM. Commit470e467 thay tap di chuyển600ms bằng giữ phím tới khi quan sát dịch chuyển>0.4m; điều kiện đạt vẫn giữ nguyên. Không sửa mã game/contract/asset. Các sửa này chỉ thuộc workflow/cấu hình và cách chờ test.

## Kết luận theo phạm vi người dùng đã làm rõ

- Người dùng làm rõ chỉ cần đảm bảo game chạy được trên macOS/Linux, không yêu cầu tiếp tục làm toàn bộ CI luôn xanh. Đã xác nhận khả năng cài, build, headless và mở giao diện trên hai hệ. Đã gửi hủy lượt CI bổ sung44754174546 để dừng công việc mở rộng.
- Linux: 71 test logic/CLI, build và proof đạt. Báo cáo ghi platform=linux, Node24.22.3. Browser có lượt đủ5 test đạt tại run44752004828, job136341981407.
- macOS: 71 test logic/CLI, build và proof đạt trên macOS15 Intel x64 (darwin24.6.0), Node24.19.0 tại run44753237028. Browser có lượt đủ5 test đạt tại run44751112958, job136338938683; báo cáo platform=darwin, WebGL hoạt động, không page error.
- Báo cáo headless/TAP trích nguyên từ artifact nằm tại docs/proof/cross-platform/run-44753237028/reports/, gồm linux-report.json/linux-tests.tap và macos-report.json/macos-tests.tap.
- Không khẳng định tất cả lượt CI đều xanh. Lượt đầu Linux có timeout45s; lượt44753237028 có test di chuyển tap600ms không được quan sát trên renderer phần mềm, còn4/5 browser test đạt trên mỗi hệ. Giữ bằng chứng thất bại, không đổi nhãn sang đạt.
- Các lượt cũ còn chờ runner đã được yêu cầu hủy sau khi lưu các kết quả liên quan. Vì thế overall workflow có thể failure/cancelled dù một số job thành công; cần đọc từng job, không chỉ nhìn màu của toàn run.
- Runtime game không thay so với tagphase-3. Chưa kiểm tra Safari/GPU Mac thật hoặc mọi cấu hình phần cứng; kết quả đủ xác nhận phạm vi chạy đã nêu, không phải cam kết mọi GUI test/hiệu năng đều đạt.

Nguồn runner macOS15 Intel: [danh sách image chính thức của GitHub](https://github.com/actions/runner-images#available-images). Các hướng dẫn chạy cuối cùng đã bổ sung vào README.md theo yêu cầu người dùng.

## Bằng chứng và cách đọc

- Thư mục docs/proof/cross-platform/run-<id>/ lưu summary.json từ API, danh sách artifact và ZIP gốc tải từ GitHub.
- Summary ghi commit, branch, job/step status, conclusion và URL. Báo cáo nhận xét không thay thế dữ liệu gốc.
- Artifact proof-ubuntu-latest có report.json của headless Linux. Các ảnh browser có sẵn từ bản commit trong artifact proof có thể là ảnh local cũ: **chỉ dùng artifact browser-proof-<os> riêng để xác nhận GUI của hệ đó**.
- Scope text trong render.json do code báo cáo cũ ghi cố định về kiểm chứng local. Khi đọc CI cần kết hợp platform=darwin/linux và metadata runner/job thành công để xác định môi trường thật; không sửa artifact gốc.
- Không nhận là kiểm tra Safari hoặc GPU máy Mac thật; đây là Chromium software WebGL trên runner. Không suy ra mọi cấu hình người dùng hoặc test ẩn đã đạt.

## Giới hạn môi trường local

- Máy chính Windows. Docker Desktop đã cài nhưng Linux engine chưa chạy; WSL chỉ hiện distro docker-desktop đang dừng. Không nhận đã kiểm tra Linux local qua Docker/WSL.
- GitHub API chưa đăng nhập gặp rate limit. Đã đọc CI qua thông tin đăng nhập Git cấu hình sẵn, chỉ dùng trong bộ nhớ; không lưu token vào repo hoặc output.
- File bàn giao người dùng yêu cầu bổ sung trước đó vẫn là thay đổi local; không tự đưa nó vào commit sửa cấu hình CI hoặc di chuyển tag để chứa nó.
