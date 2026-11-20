# Phase 1 — Yêu cầu, giả định và kế hoạch kiểm chứng

## Nguồn và trạng thái

- Nguồn: README.md, GUIDE.md, CHECKPOINTS.md, RULES.md, RUBRIC.md, SUBMISSION.md và PRD-0/Test Contract v1.0 người học cung cấp trong cuộc trò chuyện.
- Tài liệu ban đầu được viết trước triển khai; các bảng kế hoạch giữ lại để truy vết. Kết quả thực tế sau triển khai ở evaluation-phase-1.md và docs/proof/phase-1/.
- Đã có mã nguồn, test, headless và bản web. Từng dòng “Chưa kiểm chứng” trong bảng dưới là trạng thái khi lập kế hoạch; xem đánh giá mới nhất trước khi kết luận đạt.
- game.contract.json đã thay mẫu bằng lệnh và tuning thực tế, được browser/headless đọc dùng chung.

## Yêu cầu bắt buộc và tiêu chí nghiệm thu

| ID | Yêu cầu | Cách kiểm chứng dự kiến | Trạng thái |
|---|---|---|---|
| P1-01 | Game 3D góc nhìn thứ ba, Đêm 1 là đảo tròn có 5 Đèn Lồng Lớn | Chơi thử; snapshot ban đầu đủ L1…L5 | Chưa kiểm chứng |
| P1-02 | Nhân vật di chuyển, nhảy và có camera 3D | Chơi thử; scenario đo di chuyển theo tốc độ khai báo, yaw và chuẩn hóa đường chéo | Chưa kiểm chứng |
| P1-03 | Đom đóm rải trên đảo và nhặt được | Scenario không sinh ngẫu nhiên, đặt đom đóm trong/ngoài pickup_radius; kiểm tra carried, motes_active và mote_picked | Chưa kiểm chứng |
| P1-04 | Mang ánh sáng tới nạp và thắp đèn | Scenario đủ/thiếu ánh sáng và trong/ngoài interact_radius; kiểm tra deposit, lantern_lit, lượng mang và lượng nạp | Chưa kiểm chứng |
| P1-05 | Bóng Mực xuất hiện, truy đuổi, chạm gây mất máu và sợ đèn | Scenario cô lập truy đuổi, va chạm, bất tử sau đòn và vùng an toàn; kiểm tra vị trí, player_hit, flames | Chưa kiểm chứng |
| P1-06 | Tỏa sáng tốn ánh sáng, xua Bóng Mực | Scenario đủ/thiếu tài nguyên, trong/ngoài pulse_radius; kiểm tra pulse, stunned, đẩy lùi và cooldown theo cấu hình thực tế | Chưa kiểm chứng |
| P1-07 | Thắp hết đèn thì thắng, hết máu thì thua; có điểm, HUD và chơi lại | Scenario won/lost; đối chiếu điểm; chơi thử HUD và khởi động lại sau cả thắng lẫn thua | Chưa kiểm chứng |
| P1-08 | Đêm cổ tích, vàng cam ấm, nguy hiểm tím đen; đảo sáng dần; Mây đội nón lá treo đèn nhỏ; không máu me | Ảnh hoặc clip trước/sau khi thắp đèn và kiểm tra trực tiếp nhân vật | Chưa kiểm chứng |
| P1-09 | Chạy được trên macOS/Linux; hướng dẫn cài/chạy tối đa 3 lệnh | Clone sạch và chạy theo README; ghi rõ nền tảng nào thực sự đã thử | Chưa kiểm chứng |
| P1-10 | Có contract, headless, bằng chứng, giả định, nhật ký AI và harness; nộp tag phase-1 | Rà soát bàn giao, chạy lại bằng chứng tại tag trước khi phát hành | Chưa kiểm chứng |

## Các quy tắc Test Contract không được thay đổi

- game.contract.json ở gốc repo, contract_version là 1.0; tuning phản ánh đúng logic. Khái niệm không có dùng null/false phù hợp và giải thích trong README.
- Headless nhận --seed, --night 1, --ticks, --out; hỗ trợ --scenario, --inputs và --snapshot-every (mặc định 10).
- Chạy cố định 60 tick/giây, không cửa sổ/GPU, không chờ thời gian thực; kết thúc khi đủ bước hoặc thắng/thua.
- Thành công thoát 0; lỗi thoát khác 0 và thông báo ra stderr; inputs/scenario sai định dạng thoát 2.
- Tick 0 là trạng thái sau dựng scenario, trước input. Input tick k tạo trạng thái k+1; sự kiện trong bước đó ghi tick k+1. Phase 1 có sim_tick bằng tick.
- Thời gian giảm 1/60 giây mỗi bước gameplay. Kiểm tra riêng cách áp dụng time_left_s được override trong scenario.
- Đơn vị mét, Y hướng lên, mặt đất Y=0; mặc định người chơi bắt đầu (0,0,0). Khoảng cách tính trên XZ, biên bán kính dùng <=.
- Input mặc định đứng yên, yaw 0, nút false; trường vắng mặt giữ giá trị cũ; tick frame tăng nghiêm ngặt.
- Áp dụng công thức yaw của contract; vector move dài hơn 1 phải chuẩn hóa. Nút jump/interact/pulse chỉ kích hoạt ở cạnh false → true.
- Scenario: motes/shades thay danh sách; lanterns cập nhật theo id, đèn không nhắc tới giữ nguyên. Trường thiếu giữ mặc định. Dựng scenario không phát sự kiện hoặc cộng điểm.
- JSONL có snapshot từ tick 0 theo chu kỳ, event đúng tên/data và dòng end bắt buộc ở cuối. Tọa độ làm tròn 3 chữ số thập phân; state là playing/won/lost; Bóng Mực có trạng thái stunned.
- Cùng seed, scenario và inputs phải cho output giống hệt giữa hai lần, kể cả id tự sinh. Mảng motes trong snapshot là khuyến nghị v1.0.
- Thực hiện đầy đủ các trường và sự kiện theo văn bản contract gốc; bản tóm tắt này không thay thế contract.

## Giả định thiết kế — kế hoạch ban đầu

Các lựa chọn dưới đây không phải yêu cầu của khách hàng. Người học đã yêu cầu thực hiện toàn bộ; các quyết định được triển khai và thông số cuối ghi ở phần bổ sung bên dưới.

| Vấn đề chưa chốt | Đề xuất | Lý do |
|---|---|---|
| Tổ chức chương trình | Một lõi mô phỏng dùng chung cho giao diện và headless | Tránh hai bộ luật khác nhau, dễ kiểm tra bằng scenario |
| Nhặt đom đóm | Tự nhặt trong bán kính khi còn sức chứa | Giảm thao tác, kiểm tra rõ ràng |
| Nạp đèn | Một lần nhấn nạp tối đa phần đèn còn thiếu và lượng đang mang, chọn đèn chưa sáng gần nhất; hòa khoảng cách thì theo id | Hành vi có thể tái lập, tránh nạp nhiều đèn ngoài ý muốn |
| Tài nguyên tỏa sáng | Dùng đom đóm đang mang làm ánh sáng tiêu hao | Giữ một tài nguyên dễ hiểu; phải thể hiện rõ trên HUD |
| Hết giờ đêm | Thua với reason dawn nếu chưa thắng | Contract có thời lượng đêm và lý do dawn; PRD chưa mô tả chi tiết |
| Rơi khỏi đảo | Không phạt rơi; giới hạn di chuyển ở mép đảo, fall_enabled=false | Thu gọn phạm vi; phải ghi trong README |
| Thông số cân bằng | Chưa chốt tốc độ, sức chứa, chi phí, máu, thời lượng, bán kính và điểm | Chốt cùng thiết kế rồi dùng một nguồn cấu hình cho logic và contract |
| Sự kiện cùng một tick | Cần ghi rõ thứ tự xử lý trước khi code, nhất là vừa thắp đủ đèn vừa bị đánh/hết giờ | Tránh kết quả phụ thuộc thứ tự ngẫu nhiên |

## Kế hoạch kiểm chứng trước khi code

1. Viết test cho input giữ trạng thái, cạnh nhấn, yaw, chuẩn hóa vector và kiểm tra định dạng dữ liệu.
2. Viết scenario nhỏ, cô lập từng cơ chế: nhặt, sức chứa, nạp một phần/đủ đèn, truy đuổi, bị chạm, bất tử, tỏa sáng, vùng an toàn, thắng và thua.
3. Với mỗi scenario, xác định kết quả mong đợi từ yêu cầu/cấu hình trước khi chạy; không lấy output hiện tại làm đáp án mặc nhiên.
4. Kiểm tra CLI/JSONL: tick 0, sự kiện tick k+1, snapshot theo chu kỳ, --ticks 0, kết thúc sớm, dòng end và mã thoát 2 khi inputs/scenario lỗi.
5. Chạy hai lần cùng đầu vào và so sánh toàn bộ nội dung output để kiểm tra tính tất định.
6. Chạy game trực tiếp để kiểm tra camera, nhảy, HUD, ánh sáng và chơi lại; lưu ảnh/clip gắn với ID yêu cầu.
7. Có một lệnh chạy toàn bộ kiểm chứng; thêm cơ chế tự động báo lỗi khi test thất bại. Người học review diff và kết quả độc lập với AI viết mã.
8. Clone sạch, chạy theo README; trước tag phase-1 lưu đầu vào, output, kết quả test và hạn chế thực tế. Không ghi đạt khi chưa kiểm chứng.

Tên thư mục gợi ý: tests/scenarios/ cho đầu vào; docs/proof/phase-1/ cho bằng chứng. Đây là cách tổ chức đề xuất, không phải tên bắt buộc.

## Nhật ký dùng AI

- Công cụ đã dùng: Codex.
- Công việc: đọc tài liệu, giải thích quy định/contract, hướng dẫn cài Node.js và hướng dẫn soạn kế hoạch.
- Môi trường đã kiểm tra: Node.js v26.13.1, npm 11.20.0 trên Windows. Chưa kiểm tra game trên macOS/Linux.
- Token/chi phí: chưa có số liệu từ công cụ; bổ sung ước tính có căn cứ khi có thống kê, không bịa số.
- Người học cần đọc lại các giả định và kết quả trước khi nộp, hiểu và giải thích được lựa chọn của mình.

## Thứ tự làm tiếp

1. Rà soát giả định và chốt thông số; chưa cần sáng tạo thêm.
2. Thống nhất kế hoạch triển khai, tạo hướng dẫn agent ngắn và cấu trúc dự án.
3. Chạy thử môi trường, xây lõi/headless theo từng cơ chế và kiểm chứng ngay.
4. Gắn giao diện 3D với cùng lõi, kiểm tra chơi thực tế.
5. Tổng hợp bằng chứng, README, đánh giá phase; commit nhỏ, tag và push theo hạn Coach.

Lưu ý thời hạn: người học báo hạn nộp link vào nửa đêm. Chưa xác nhận giờ kết thúc lab; hạn nộp link không tự thay thế hạn commit/tag trong RULES.md và SUBMISSION.md.

## Quyết định đã triển khai

- JavaScript ES modules, Three.js cho đồ họa, Node.js cho CLI; một Game.step() chạy ở 60 Hz cho cả hai.
- game.contract.json là nguồn tuning duy nhất: speed 7m/s, sức chứa 15, cost đèn 8, pickup 1.8m, interact 3m, pulse cost 2/radius 8m/stun 3s/push 5m/cooldown 1s; đêm 300s, 3 máu, invuln 2s, không rơi đom đóm, safe radius 6m, shade speed 2.4m/s, hit radius 1.1m, không rơi khỏi đảo.
- Điểm: nhặt +10, đèn +100, mỗi đối tượng pulse +15; thắng thưởng floor(time_left_s)*2 + flames*50. Setup scenario không cộng điểm.
- Thứ tự tick và luật xử lý đồng thời được ghi trong README; ưu tiên all_lit → no_flames → dawn.
- Đèn chưa sáng gần nhất được nạp; hòa khoảng cách chọn theo id. Nhảy chỉ đổi Y; luật nhặt/va chạm vẫn dùng XZ.
- Sinh định kỳ chỉ bật khi random_motes/random_shades tương ứng bật. Danh sách scenario thay danh sách ban đầu; tắt random nghĩa là không tự bổ sung.
- Tạm dừng và trang trí là tính năng giao diện. Chế độ headless không tạm dừng hoặc chạy trang trí.

## Nhật ký bổ sung sau triển khai

- Người học yêu cầu làm toàn bộ phần có yêu cầu, kèm giải thích và chỉ dẫn thao tác. Phạm vi thực hiện: Phase 1, không tự tạo ticket phase sau.
- Harness bổ sung: AGENTS.md, scripts/verify.mjs dừng khi test đỏ, test tự động và CI đa hệ điều hành; không xóa các file này sau khi dùng.
- AI đã mắc lỗi trong helper test (truyền lặp --ticks) và bộ thu phím browser (bỏ lỡ tap ngắn giữa hai frame). Đã phát hiện bằng chạy thật, sửa helper và giữ tap tới tick sau; giữ test browser dùng thao tác nhấn nhanh để bắt hồi quy.
- Lượt bot ban đầu không dùng pulse và thua; bổ sung chiến lược dùng pulse theo nguy hiểm, không giảm độ khó hoặc sửa trạng thái game để ép đạt.
- Kết quả chạy thật: xem evaluation-phase-1.md; hệ điều hành chưa chạy vẫn ghi chưa kiểm chứng.
- Token/chi phí thực tế chưa có thống kê; không khai con số không có căn cứ. Tiết kiệm bằng scope Phase 1, một lõi dùng chung, geometry thủ tục và test các cơ chế trước khi trau chuốt.
