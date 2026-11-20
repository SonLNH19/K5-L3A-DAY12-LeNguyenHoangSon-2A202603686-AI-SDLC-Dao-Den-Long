# Retro — Đảo Đèn Lồng, bốn phase

## Evaluation

Phase 1 tạo vòng chơi cơ bản và một lõi mô phỏng dùng chung cho browser/headless. Điều hiệu quả là tách kiểm tra hành vi khỏi đồ họa: scenario cô lập giúp biết chính xác vì sao đèn sáng hoặc Mây mất máu. Điểm yếu là nhiều thông số ban đầu tự chọn, dẫn đến công sửa ở phase sau. Bằng chứng theo từng phase được giữ trong docs/proof, không lấy kết quả mới ghi đè lịch sử.

Phase 2 chuẩn hóa tuning, thêm ba Đêm, dash, gió, bùa, bục nhảy và tổng điểm. Học được rằng mở rộng chỉ bằng thêm giao diện không đủ: phải kiểm tra thứ tự tick, cạnh nhấn phím và reset Đêm. Headless cùng một Game với giao diện giúp tránh hai phiên bản luật. CI Linux/macOS cho biết vấn đề trình duyệt software WebGL có thể là timing của test; không được coi một lần timeout là bằng chứng luật game sai. Ghi nhận giới hạn thực chạy tại platform-verification.md.

Phase 3 thay đổi mô hình: đèn cần fuel nguyên đơn vị 1/60, có thể tắt và thắp lại; mục tiêu chuyển sang sống tới bình minh với 60% đèn. ADR-003 ghi thứ tự hao dầu, drain và ưu tiên no_flames ở tick cuối. Các test thắng sớm/điểm cũ được sửa theo ticket thay thế, không skip. Đây là bài học quan trọng: giữ nguyên mọi test cũ cũng sai nếu yêu cầu đã thay đổi; cần ghi lý do cụ thể.

Phase 4 đưa game sang phát hành với bench, soak, bảng điểm trên đĩa, remap và accessibility. 77 test logic/CLI và 7 browser test đạt tại lần kiểm tra cục bộ. Benchmark chuẩn 30s tham khảo: 167.8 FPS trung bình, 87.5 FPS ở 1% thấp, tải 1.47s. Soak 10 Đêm không crash, RSS tăng khoảng 11.8%. Các con số là output thực trong JSON, không chứng minh trước kết quả máy chấm. Cây/đá dùng geometry và instancing, tắt trong cảnh chuẩn. Video do người học tự quay, chưa được tính hoàn thành khi viết retro.

## Làm việc với AI: điều hiệu quả và lần sai

AI hiệu quả khi được giao một thay đổi có giới hạn và một bằng chứng cần tạo: ví dụ refuel phải đổi fuel đúng, replay phải giữ tổng điểm các Đêm thắng. AGENTS.md nhỏ, contract tập trung và scenario kiểm thử giúp nhiều hơn prompt dài mô tả toàn bộ game mỗi lượt. Hướng dẫn bàn giao Markdown tránh phải đọc lại lịch sử chat. Dùng một tác vụ phụ có phạm vi rõ cho asset rừng; không để nhiều agent đồng thời sửa lõi game.

Có lỗi được phát hiện bằng kiểm chứng: test di chuyển chờ số mili giây cố định dễ thất bại trên software renderer, nên đổi sang chờ vị trí thực thay đổi; không giảm điều kiện cần chứng minh. Lần đo FPS chạy cùng browser test làm 1% low kém, nên đo riêng và giữ kết quả chạy thật. Soak bật JIT ban đầu vượt ngưỡng bộ nhớ, chọn harness jitless và GC tại mốc đo thay vì đệm baseline hoặc sửa output. Một lần script browser ghi nhầm thư mục bằng chứng Phase 3 đã được khôi phục từ Git, sau đó sửa đích sang Phase 4. Bài học là đường dẫn bằng chứng cũng cần được review như code.

## Token, chi phí và cách giảm

Không có bộ đếm usage/billing trong workspace nên chưa xác minh được tổng token hoặc tiền cho từng phase. Nếu chỉ cần ước lượng kế hoạch cho các phần giao tiếp/triển khai (không phải số đo hay hóa đơn): Phase 1 khoảng 20–60 nghìn token, Phase 2 khoảng 20–60 nghìn, Phase 3 khoảng 20–60 nghìn, Phase 4 khoảng 30–100 nghìn; tổng khoảng 90–280 nghìn, độ tin cậy thấp do hội thoại dài và chạy lại. Đây là khoảng dự trù, không khẳng định usage thực; người học nên thay bằng số từ tài khoản nếu có. Không có đơn giá/gói sử dụng được xác nhận nên không quy đổi USD hoặc VND.

Tiết kiệm bằng tái sử dụng test/scenario, chỉ đọc phần diff cần sửa, gộp các lượt đọc độc lập, procedural asset không tải mô hình hay sinh ảnh, và dừng kiểm tra rộng khi đã đủ bằng chứng. Giai đoạn cuối người học yêu cầu làm đơn giản, nên giữ kiến trúc Node/Three hiện có, không thêm framework/hosting/native packager hay tự dựng video.

## Nếu làm lại

Tạo checklist theo ticket và hợp đồng ngay từ đầu, dùng fixture cho từng ranh giới, chạy benchmark riêng sau mỗi thay đổi đồ họa, kiểm tra bản ZIP sớm. Ghi usage sau mỗi phase thay vì nhớ lại cuối buổi. Chốt phạm vi sáng tạo nhỏ và đọc SUBMISSION/RULES trước khi dành thời gian mỹ thuật. Để người học quay video với kịch bản sẵn trong ba phút, gắn Release và kiểm tra truy cập ẩn danh trước hạn; không để mục bàn giao cuối cùng bị quên.
