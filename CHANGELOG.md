# Changelog

## Phase 3 — Contract v1.2 — Đèn cạn dầu

### Breaking changes

- Bỏ kết thúc sớm all_lit; chỉ thắng ở bình minh nếu còn sống và đủ 60% đèn sáng. Thời lượng Đêm 1/2/3: 240/270/300s.
- Đèn sáng hao dầu, có thể tắt; cho phép châm dầu. Lần đầu cần 10, thắp lại cần 5; dầu dưới 30 mất vùng an toàn.
- Wander ưu tiên đèn sáng yếu, thêm drain hút 5 dầu/s/con, cộng dồn. Hết choáng về wander; khôi phục vùng sáng đẩy Bóng Mực ra trong tối đa 30 tick.
- Thay điểm: +5/con nạp, +100 thắp mới, +40 thắp lại, pulse +5 hoặc tổng +15 với drain; thưởng đèn/dầu/máu ở bình minh, không thưởng thời gian.
- Sức chứa từ 10 tăng 2 mỗi lần thắp, tối đa 20; scenario/validation phụ thuộc successful_lights.
- Snapshot thêm fuel/ever_lit/relit_count trên đèn, capacity trên player; scenario thêm fuel/ever_lit/successful_lights/target_lantern_id.
- Event thêm refuel/lantern_out/fuel_drain; lantern_lit thêm relight; reason thắng đổi sang dawn_survived. Client/test phụ thuộc all_lit phải cập nhật.

### Giao diện và kiểm chứng

- Thanh dầu, cảnh báo dưới 30 nhấp nháy 1 Hz; đèn tắt xẹp giấy 20% và có vết rách.
- Cài đặt Bảng màu dễ phân biệt được lưu; viền/mắt Bóng Mực xanh #00B3FF, cảnh báo trắng kèm ⚠.
- HUD sức chứa động, mục tiêu bình minh, lời thoại phù hợp; sửa chuyển Đêm giữ currentNight cũ và CSS ghi đè thuộc tính hidden.
- ADR-003 ghi quyết định, thứ tự tick và lý do cập nhật test; test Phase 1–2 còn hiệu lực được giữ, không skip.
- Bằng chứng mới ở docs/proof/phase-3/, CI upload đúng thư mục; giữ nguyên bằng chứng các phase trước.
