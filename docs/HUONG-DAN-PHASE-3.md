# Chạy và kiểm tra Phase 3 — Đèn cạn dầu

## Mở game

Trong PowerShell:

```powershell
cd 'D:\LAB AITC\LAB 12\K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long'
npm.cmd start
```

Mở http://localhost:4173. Nếu terminal cũ không nhận Node: `$env:Path += ';D:\nodejs'`. Nếu vừa clone máy mới, chạy `npm.cmd ci` trước. Giữ terminal chạy; Ctrl+C để dừng. Dừng server cũ rồi start lại và reload trình duyệt để không dùng dist Phase 2.

## Cách chơi mới

1. WASD đi lại, Space nhảy, Shift/J lướt, Q/R hoặc kéo chuột phải xoay camera. Địa hình, bùa và Gió Lạc giữ từ Phase 2.
2. Tự nhặt đom đóm. Ban đầu túi 10; mỗi lần thắp thành công tăng 2, tối đa 20.
3. Đến gần đèn và nhấn E. Đèn chưa từng sáng cần tổng 10; đèn đã cạn chỉ cần 5. Mỗi lần nhấn nạp tối đa phần cần và lượng đang mang.
4. Đèn sáng bắt đầu 100 dầu rồi hao 1/s. Đứng gần và nhấn E để châm; mỗi con thêm 10, không vượt 100. Châm không tăng sức chứa.
5. Dầu dưới 30: đèn/thanh dầu nhấp nháy 1Hz, mất vòng an toàn. Bóng wander có thể tới hút thêm 5/s/con. F tỏa sáng tốn 3 con, choáng theo luật Phase 2 và được điểm cao hơn khi trúng bóng đang hút.
6. Thắp đủ tất cả đèn vẫn chơi tiếp. Phải sống tới bình minh và giữ ít nhất 3/5 ở Đêm 1, 4/6 Đêm 2, 5/7 Đêm 3. Thời lượng lần lượt 240,270,300s. Hết máu ở tick cuối vẫn thua.
7. Esc/P tạm dừng. Mở Cài đặt, bật “Bảng màu dễ phân biệt”, Lưu và Đóng. Lựa chọn lưu qua reload; mắt/viền bóng xanh, cảnh báo trắng kèm ⚠. Đèn tắt nhận biết qua giấy xẹp/rách.

## Tự review trước khi nộp

- Thử thắp một đèn: dầu 100, sức chứa tăng, chưa kết thúc sớm.
- Chờ dầu giảm rồi châm: đom đóm giảm, dầu tăng, không vượt 100; châm không tăng capacity.
- Xem cảnh báo dưới 30 và đối chiếu đúng 30. Dùng scenario bên dưới để kiểm tra nhanh nhưng đừng nhận là lượt mặc định.
- Chờ hết dầu rồi thắp lại: yêu cầu 5 thay vì 10.
- Kiểm tra bảng màu sau reload, phân biệt đèn tắt/sáng không dựa vào màu.
- Đọc ADR để giải thích vì sao dùng số nguyên, vì sao xét kết thúc sau tick cuối và vì sao thay test thắng sớm cũ.

## Chạy kiểm chứng tự động

Mở terminal thứ hai tại repo:

```powershell
npm.cmd run verify
npm.cmd run test:browser
npm.cmd run proof
```

- verify: cú pháp, test cũ còn hiệu lực và test v1.2, sau đó build; lỗi thì dừng.
- browser: thao tác thật qua Chrome/Edge trên máy hiện tại, dầu, bảng màu lưu, chuyển Đêm/reset capacity. Máy chưa có browser phù hợp: `npx.cmd playwright install chromium`.
- proof: lưu docs/proof/phase-3/, không ghi đè phase trước. Có TAP, JSONL, tất định ba Đêm và replay lượt mặc định.

## Kiểm tra headless nhanh

Châm dầu và khôi phục vùng an toàn:

```powershell
node src/headless.mjs --seed 19 --night 1 --scenario tests/scenarios/phase3-refuel.json --inputs tests/scenarios/phase3-interact.inputs.json --ticks 30 --out output.jsonl --snapshot-every 1
Get-Content output.jsonl
```

Xem refuel, fuel và capacity. Test tự động cũng kiểm tra không gây sát thương lúc đẩy ra mép.

Hai Bóng Mực cùng hút dầu:

```powershell
node src/headless.mjs --seed 19 --night 1 --scenario tests/scenarios/phase3-drain.json --ticks 180 --out output.jsonl --snapshot-every 60
```

Mỗi giây mất tổng 11 dầu: 1 tự hao +5+5 từ hai con. Có fuel_drain theo nhịp 60 tick đang hút, lantern_out khi cạn.

Bình minh với ba đèn sáng:

```powershell
node src/headless.mjs --seed 19 --night 1 --scenario tests/scenarios/phase3-dawn.json --ticks 60 --out output.jsonl --snapshot-every 1
```

Scenario còn một tick tới bình minh, kết thúc won/dawn_survived. Đây là test ranh giới, không phải chơi hết Đêm.

Lượt mặc định đầy đủ của bot:

```powershell
node src/headless.mjs --seed 4 --night 1 --inputs docs/proof/phase-3/full-run.inputs.json --ticks 14400 --out output.jsonl
```

Seed 4, không scenario override, thắng đúng tick 14400 (240s), 1169 điểm. Input được tạo từ bot quan sát thế giới, không sửa trạng thái. Bot không thắng mọi seed; không nhận là người học chơi hay test ẩn đã đạt.

## Linux/macOS và GitHub

Workflow verify.yml đã đổi artifact sang phase-3. Sau push mở Actions; chỉ ghi hệ nào đã test khi job tương ứng xanh. Windows local không chứng minh macOS/Linux đã chạy. Nên thử Safari/GPU thật trên Mac nếu có.

Trên Linux/Mac dùng `npm` thay `npm.cmd`, Node.js>=24; chạy `npm ci`, `npm run verify`, `npm run proof`. Browser: `npx playwright install --with-deps chromium` rồi `npm run test:browser`.

Khi đã review và đủ điều kiện theo hạn Coach, đẩy commit và tag Phase 3:

```powershell
git status
git log -3 --oneline
git push origin main
git push origin phase-3
```

Không dùng force push theo ví dụ cũ trong phần lịch sử bàn giao Phase 2. Nếu tag remote khác commit, dừng và kiểm tra, không ghi đè. Xác minh `git show phase-3 --stat` trước khi push tag.

Phase 4, Release v1.0.0 và video cuối chưa thực hiện vì chưa có Ticket-04. Không nhận hoàn thành các phần này.
