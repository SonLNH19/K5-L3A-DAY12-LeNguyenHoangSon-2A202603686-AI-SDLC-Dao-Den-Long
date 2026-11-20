# TICKET-03 — CHANGE REQUEST "Đèn cạn dầu" (Phase 3)

Nguồn: yêu cầu người dùng cung cấp trong cuộc trò chuyện ngày 20/11/2026. Loại: thay đổi luật cốt lõi. Ưu tiên rất cao. Tag nộp `phase-3`. Contract v1.2.

## Vì sao thay đổi

Playtest cho thấy người chơi giỏi thắp hết đèn trong 2 phút rồi game kết thúc, thiếu căng thẳng ở cuối Đêm. Đèn đã thắp vẫn có thể tắt; mục tiêu chuyển từ “thắp hết” sang **giữ đảo sáng tới bình minh**. Phải ghi quyết định thiết kế và cập nhật test bị thay luật. Sáng tạo từ phase trước được giữ nếu không xung đột yêu cầu và không làm đổi đầu ra headless.

## 1. Nhiên liệu đèn — thay thế luật đèn sáng không nhận đom đóm

- Fuel tối đa 100. Vừa thắp lần đầu hoặc thắp lại thì fuel=100.
- Đang sáng tự hao 1.0/giây, tức 1/60 mỗi tick.
- Tương tác ở đèn sáng: `used=min(carried,ceil((100-fuel)/10))`; `fuel=min(100,fuel+10*used)`, trừ used đom đóm.
- Đèn đầy dầu, used=0, không được chọn khi tương tác; không event, không điểm.
- Chỉ xét đèn nhận được: chưa sáng hoặc sáng nhưng chưa đầy. Gần nhất, hòa thì id nhỏ hơn.
- Nên lưu dầu bằng đơn vị nguyên 1/60; chỉ làm tròn khi xuất.
- Fuel<=0: đèn tắt, deposited=0, event `lantern_out`, môi trường tối đi; nhớ ever_lit=true.
- Đèn ever_lit chỉ cần 5 đom đóm để thắp lại; chưa từng sáng cần 10.
- Có thanh dầu trên đèn sáng. Fuel<30 thì đèn và thanh dầu nhấp nháy chậm 1 Hz.

## 2. Bóng Mực hút dầu — thay thế an toàn tuyệt đối

- Fuel<30 mất vùng an toàn; đúng 30 vẫn an toàn.
- Chỉ wander chọn đèn sáng yếu fuel<30 gần nhất, hòa thì id nhỏ hơn. Không có thì đi về đèn tắt gần nhất như trước. Chase không đổi mục tiêu sang đèn.
- Cách đèn mục tiêu <=2m XZ: chuyển drain, đứng yên, hút 5 fuel/giây (5/60 mỗi tick). Nhiều con cộng dồn; đèn vẫn tự hao 1/giây.
- Drain → chase khi Mây vào trong 6m; → stunned khi trúng Tỏa Sáng; → wander khi đèn tắt, được châm lên >=30 hoặc cách đèn >2m.
- Hết choáng về wander.
- Châm đèn lên >=30 khi có Bóng Mực trong 6m: đẩy các con đó ra mép vùng trong tối đa 30 tick, không gây sát thương trong lúc đó, giống vừa thắp đèn.

## 3. Luật thắng — thay thế thắng ngay khi đủ đèn

- Đêm 1/2/3 dài **240/270/300 giây**.
- Thắng khi Mây còn sống ở bình minh và đèn đang sáng tại tick cuối >=ceil(0.6*tổng đèn): 3/5, 4/6, 5/7.
- Không thắng sớm khi thắp đủ đèn.
- Thua khi hết Ngọn Lửa, kể cả ở tick cuối; hoặc bình minh thiếu số đèn yêu cầu.
- Thắng reason `dawn_survived`; thua `dawn` hoặc `no_flames`. Không còn `all_lit`.
- Giữ thứ tự Ticket-02; bổ sung ở bước 2 trừ dầu tự hao và bị hút, tắt đèn ngay sau bước 2 nếu fuel<=0.
- Xét kết thúc sau mọi cập nhật tick, kể cả tick bình minh; hết Ngọn Lửa ưu tiên thua no_flames.

## 4. Sức chứa tăng dần

- `capacity=min(20,10+2*successful_lights)`.
- successful_lights là số lần thắp thành công trong Đêm, gồm thắp lại; scenario đặt sẵn đèn không tính.
- Reset về 0 ở đầu mỗi Đêm. HUD hiện carried/capacity.

## 5. Điểm mới — thay toàn bộ công thức cũ

| Sự kiện | Điểm |
|---|---|
| Mỗi đom đóm nạp khi thắp mới/thắp lại/châm dầu | +5 |
| Thắp lần đầu | +100 |
| Thắp lại | +40 |
| Mỗi Bóng Mực trúng pulse | Tổng +5; tổng +15 nếu ngay trước đó đang drain |
| Bình minh, chỉ khi thắng, mỗi đèn đang sáng | +50+floor(fuel) |
| Bình minh, chỉ khi thắng, mỗi Ngọn Lửa còn lại | +50 |
| Thưởng thời gian | Bỏ |

Tổng điểm game và chơi lại không đổi so với Ticket-02.

## 6. Bảng màu dễ phân biệt

- Thêm cài đặt “Bảng màu dễ phân biệt”, được lưu.
- Viền và mắt Bóng Mực đổi #7A3CFF → #00B3FF.
- Cảnh báo UI đổi #FF5A5F → #FFFFFF, kèm ⚠.
- Đèn tắt/sáng phân biệt được không cần màu: tắt xẹp 20%, giấy rách; sắp hết dầu nhấp nháy.

## 7. Test Contract v1.2

- contract_version="1.2".
- Tuning thêm fuel_max=100, fuel_decay_per_s=1.0, fuel_per_mote=10, relight_cost=5, win_ratio=0.6, drain_per_s=5, low_fuel_threshold=30, capacity_max=20. night1/2/3_duration_s=240/270/300.
- Snapshot mỗi đèn thêm fuel (số thực, làm tròn 1 chữ số thập phân; tắt=0), ever_lit, relit_count. Player thêm capacity. Bóng Mực thêm state drain.
- Scenario đèn đặt lit, fuel, ever_lit; player thêm successful_lights; shades thêm target_lantern_id. lit=true mà thiếu fuel thì fuel=100.
- Event mới: `refuel {lantern_id,amount,fuel}`, `lantern_out {lantern_id}`, `fuel_drain {lantern_id,shade_id,fuel}` (mỗi 60 tick đang hút).
- lantern_lit thêm relight true/false. game_over.reason thêm dawn_survived, bỏ all_lit.

## Định nghĩa hoàn thành

- Có bằng chứng chạy đúng yêu cầu.
- Có ADR/ghi chú quyết định đổi mô hình trạng thái đèn và luật thắng.
- Test cũ bị thay luật phải sửa hoặc xóa có lý do, không skip âm thầm.
- Changelog liệt kê breaking changes.
- Test ẩn Phase 1–2 còn hiệu lực vẫn phải đạt; agent không được tự khẳng định đã chạy test ẩn khi không có quyền truy cập.
