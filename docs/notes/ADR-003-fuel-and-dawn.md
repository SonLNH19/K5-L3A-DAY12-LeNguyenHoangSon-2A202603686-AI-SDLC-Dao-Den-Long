# ADR-003 — Dầu hữu hạn và thắng tại bình minh

Trạng thái: đã triển khai theo Ticket-03 / Contract v1.2. Ngày: 20/11/2026.

## Bối cảnh

Phase 2 xem lit là trạng thái vĩnh viễn và kết thúc ngay khi tất cả đèn sáng. Ticket-03 thay cả hai giả định: đèn có thể cạn dầu và cần duy trì ít nhất 60% số đèn tại tick bình minh. Cần giữ nguyên các cơ chế di chuyển, dash, nhảy, địa hình, Gió Lạc, bùa, sát thương và pause chưa bị thay.

## Quyết định mô hình

- Mỗi đèn có lit, deposited, ever_lit, relit_count và fuelUnits nguyên. Getter fuel=fuelUnits/60 phục vụ hiển thị; snapshot làm tròn 1 số thập phân, không làm tròn trạng thái đang mô phỏng.
- Chưa từng sáng: cần 10; sáng: dầu tối đa 6000 đơn vị; cạn: lit=false, deposited=0, ever_lit=true; thắp lại: cần 5, relit_count tăng 1. Scenario không thưởng điểm, không tăng successful_lights/relit_count.
- Bước 2 của tick: cộng số con drain hợp lệ theo từng đèn, trừ 1 đơn vị hao tự nhiên +5 đơn vị mỗi con hút, clamp 0, phát fuel_drain đến nhịp và lantern_out. Sau đó mới di chuyển, tương tác và pulse như Phase 2.
- fuel_drain được ghi mỗi 60 **tick gameplay hút liên tiếp của từng con**, không tính tick pause. Rời drain hoặc bị ngắt thì reset bộ đếm. Các con hút cùng đèn thấy cùng fuel sau tổng hao hụt của tick đó; event đứng trước lantern_out nếu trùng tick.
- Đèn nhận được gần nhất được chọn ở bước tương tác, hòa theo chuỗi id. Dùng số nguyên để tính ceil số đom đóm châm dầu. Lưu ý đèn 100 dầu ở tick 0 sẽ hao trước tương tác tick 1, nên có thể nhận 1 con ở tick 1; điều này tuân theo thứ tự của ticket.
- Vùng an toàn dùng fuelUnits>=1800, không dùng fuel snapshot đã làm tròn. Đúng 30 tại trạng thái hiện tại còn an toàn; tick kế tiếp hao xuống dưới 30 thì mất vùng.
- Wander tìm đèn yếu, nếu không có thì đèn tắt; chase vẫn hướng tới người chơi. Drain đứng yên; rời drain khi người chơi <=6m, đèn không còn phù hợp hoặc khoảng cách >2m. Hết choáng/rời drain trở về wander trước khi áp dụng lại phát hiện chase ở tick sau.
- Khôi phục vùng an toàn khởi tạo đẩy ra mép trong tối đa 30 tick, không gây sát thương trong các tick đó. Không dịch chuyển tức thời toàn bộ quãng đường; vị trí được cập nhật từ khoảng cách còn lại và số tick còn lại.
- Capacity là getter min(20,10+2*successful_lights). Chỉ tăng lúc thắp thành công, kể cả thắp lại; mỗi Game mới cho Đêm tiếp theo reset counter. Scenario successful_lights được dùng khi xác thực carried.

## Quyết định kết thúc và điểm

- Không xét every(lit) để thắng. Bước cuối tick: nếu flames<=0 thì lost/no_flames; nếu đã bình minh thì đủ ceil(0.6*total) đèn → won/dawn_survived, ngược lại lost/dawn.
- Cả việc cạn dầu và tương tác ở tick cuối đều ảnh hưởng kết quả. Rơi chết không return trước các bước còn lại; kết thúc vẫn xét sau cập nhật của tick.
- Mỗi con nạp +5; thắp mới +100, lại +40; pulse Bóng Mực +5 hoặc tổng +15 nếu trạng thái ngay trước pulse là drain; thưởng bình minh từ dầu thật floor(fuel), số đèn sáng và máu. Không thưởng thời gian.
- Tổng điểm chiến dịch/chơi lại giữ luồng Phase 2. Sửa lỗi chuyển Đêm cũ để currentNight khớp màn giới thiệu, bảo đảm reset capacity đúng Đêm.

## Di trú test và bằng chứng

| Test cũ | Điều chỉnh có lý do |
|---|---|
| deposit partial/full +10 | Đổi kỳ vọng sang +5, giữ kiểm tra nạp một phần và cạnh nhấn |
| win scores once | Thắp đủ vẫn playing; thêm bình minh thắng và bất biến sau kết thúc |
| last lamp beats dawn | Thay ý nghĩa sang nạp ở tick cuối được tính trong tỷ lệ cuối |
| CLI winning scenario stops early | Fixture cũ giờ là no-early-win, 20 tick vẫn playing, 150 điểm |
| Browser E lights final lamp and wins | Nhấn E không thắng sớm; advance các tick thật tới bình minh, kiểm tra sang Đêm 2 |
| Bot dừng sau thắp hết | Bot phải duy trì dầu tới hết 240s, chọn route tái lập seed 4 |
| Benchmark 21600 tick Đêm 3 cũ | Thời lượng bị thay thành 18000 tick; đo đủ Đêm mới với scenario không nguy hiểm, ghi rõ phạm vi |

Không skip test cũ. Test di chuyển, dash, bùa, Gió Lạc, input, pause và lỗi CLI được giữ. Bằng chứng Phase 1/2 không viết đè; kết quả v1.2 ở docs/proof/phase-3/. Test ẩn giảng viên chưa được chạy nên không tự nhận đạt.

## Hệ quả và điểm cần kiểm tra thêm

- Thanh dầu và đèn yếu nhấp nháy cùng 1 Hz theo thời gian hiển thị. Đèn tắt giấy xẹp 20% và có đường rách hình học. Bảng màu mới lưu localStorage, chỉ tác động renderer/UI.
- Gameplay khó hơn; bot cũ không còn thắng. Seed 4 có lượt mặc định thắng hợp lệ; không khẳng định bot thắng mọi seed.
- Windows local đã có bằng chứng; Linux/macOS và Safari/GPU thật cần CI hoặc máy tương ứng. Workflow không tự chứng minh các nền tảng đã chạy xanh.
