# Hướng dẫn từng bước cho người học

## 1. Bài đã làm tới đâu?

Bản triển khai này chỉ giải quyết Phase 1 vì chỉ có PRD-0 và Test Contract v1.0. Chưa có Ticket-02, Ticket-03, Ticket-04; không tự nhận đã hoàn thành 4 phase.

Bạn có thể dùng AI ở mọi bước theo RULES.md, nhưng cần đọc diff, chơi thử, chạy kiểm chứng và hiểu lựa chọn thiết kế. Các câu lệnh dưới đây không cần API key.

## 2. Mở đúng thư mục

Mở PowerShell, nhập:

```powershell
cd 'D:\LAB AITC\LAB 12\K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long'
```

Mọi lệnh tiếp theo chạy trong thư mục này. Nếu PowerShell cũ không nhận Node.js, đóng toàn bộ cửa sổ ứng dụng đang chứa terminal rồi mở lại. Tạm thời cho phiên hiện tại: `$env:Path += ';D:\nodejs'`.

## 3. Mở game trên Windows

```powershell
npm.cmd ci
npm.cmd start
```

- `ci` cài đúng phiên bản trong package-lock.json, giúp người chấm có cùng thư viện. Cần mạng khi cài lần đầu.
- `start` build các file vào dist/ rồi mở HTTP server ở http://localhost:4173. Giữ PowerShell này mở.
- Mở Chrome hoặc Edge, vào URL đó. Không nhấp đúp index.html vì trình duyệt cần HTTP để tải module và contract.
- Nhấn “Bắt đầu chuyến đi”. Di chuyển WASD/phím mũi tên; Space nhảy; E nạp đèn; F tỏa sáng; Q/R xoay camera; H/Esc tạm dừng/hướng dẫn. Có thể kéo chuột phải để xoay camera.
- Mỗi đèn cần 8 đom đóm; nhặt tự động, túi tối đa 15. Nạp bằng một lần nhấn E trong khoảng 3m. Giữ E/F không tự lặp; thả rồi nhấn lại.
- Tỏa sáng tốn 2 đom đóm đang mang. Đèn đã sáng có vùng an toàn 6m. Thắp đủ 5 đèn thì thắng. Hết 3 máu hoặc hết 300 giây thì thua.
- Nhấn “Chơi lại từ đầu” sau thắng hoặc thua. Âm thanh chỉ bật khi bạn chọn nút âm thanh.
- Dừng server: quay lại PowerShell, nhấn Ctrl+C. Nếu có câu hỏi của terminal về dừng tác vụ, chọn Y.

Nếu cổng 4173 đang dùng: dừng server cũ, hoặc đặt `$env:PORT=4174` trước `npm.cmd start`, rồi mở http://localhost:4174.

## 4. Tự kiểm game bằng tay

Đây là phần bạn nên tự làm, vì bạn là người review độc lập với AI đã viết code.

1. Đi quanh đảo, thử nhảy và xoay camera; xem chuyển động có dễ điều khiển không.
2. Đi qua đom đóm: bộ đếm tăng, đom đóm biến mất, điểm tăng 10.
3. Gom 8 con, đến gần một đèn chưa sáng rồi nhấn E: đèn sáng, đếm đèn tăng, được 100 điểm; vùng sáng xuất hiện.
4. Đến gần Bóng Mực khi đang mang ít nhất 2 con, nhấn F: giảm 2 con; Bóng Mực bị đẩy và choáng.
5. Kiểm tra sát thương khi bị chạm, rồi thử trú gần đèn đã sáng. Nhấn H để đọc hướng dẫn và chắc thời gian dừng.
6. Thử thắng, thua và chơi lại. Lưu ý chạy mới mặc định cùng seed để tái lập được bố cục.

Nếu thấy lỗi: ghi thao tác, điều mong đợi, điều thực tế, ảnh/clip nếu có. Không đánh dấu đạt khi chưa thử.

## 5. Test và bằng chứng trên Windows

Mở PowerShell thứ hai tại cùng thư mục:

```powershell
npm.cmd run verify
npm.cmd run test:browser
npm.cmd run proof
```

- `verify`: kiểm tra cú pháp giao diện, test logic/CLI và build. Test hỏng sẽ dừng với mã lỗi; không tiếp tục như thể đã đạt.
- `test:browser`: tự mở Chrome/Edge ở chế độ không cửa sổ, bấm phím và chụp ảnh. Trên máy Windows hiện tại dùng Chrome/Edge đã cài. Nếu máy khác không có, chạy `npx.cmd playwright install chromium` trước.
- `proof`: chạy lại test, lưu JSONL thật, kiểm tra output hai lần giống hệt và phát lại một lượt thắng từ thế giới mặc định.
- Kết quả: docs/proof/phase-1/. Các file này là bằng chứng từ lần chạy gần nhất, không được sửa tay để đổi kết quả.

`npm ci` trên máy mới có thể cần cho phép tải thư viện qua mạng/proxy. Không cần nâng npm chỉ để chạy game.

## 6. Hiểu và thử headless

Chế độ headless dùng cùng Game.step() như giao diện, nhưng không tạo cửa sổ hay cần GPU.

```powershell
node src/headless.mjs --seed 19 --night 1 --scenario tests/scenarios/win.json --inputs tests/scenarios/win.inputs.json --ticks 600 --out output.jsonl --snapshot-every 1
Get-Content output.jsonl
```

Scenario này đặt sẵn 4 đèn sáng, còn đèn L1 gần người chơi và đủ 8 con đang mang. Tick 0 chưa có điểm. Input tick 0 nhấn tương tác; tick 1 có deposit, lantern_lit, game_over rồi end. Đây là kiểm tra một cơ chế, không phải bằng chứng người chơi đã đi qua cả màn.

Lượt đầy đủ không dùng scenario dựng sẵn:

```powershell
node src/headless.mjs --seed 12 --night 1 --inputs docs/proof/phase-1/full-run.inputs.json --ticks 18000 --out output.jsonl
```

File input này do scripts/demo-route.mjs tạo từ việc điều khiển thế giới mặc định theo vị trí quan sát được, không sửa trạng thái. Đây là bot kiểm chứng, không phải video người học chơi. Xem end và các sự kiện ở output để xác nhận kết quả thực tế.

## 7. Kiểm tra thật trên Linux và macOS

Có hai cách; việc viết workflow chưa có nghĩa là các hệ đó đã chạy thành công.

### Cách A: GitHub Actions, không cần máy Mac

Repo đã có .github/workflows/verify.yml:

- `contract-and-build`: 3 job riêng trên Ubuntu, macOS và Windows, dùng Node.js 24, npm ci, verify và proof.
- `browser`: 2 job trên Ubuntu và macOS, cài Chromium rồi chạy bộ test giao diện.
- Artifact lưu bằng chứng riêng của mỗi hệ điều hành; không lấy báo cáo Windows gắn nhãn macOS/Linux.

Sau khi bạn review thay đổi và xác nhận vẫn trong hạn được phép commit:

1. Kiểm tra `git status` và `git diff`. Các file mới xem trực tiếp trong editor.
2. Commit phần triển khai đã review và push lên repo GitHub của bạn. Nếu đã có commit do Codex tạo thì chỉ push các commit đó.
3. Trên GitHub mở tab Actions → chọn “Verify game on Windows Linux macOS” → lần chạy mới nhất.
4. Mở từng job. Chỉ ghi “đã test Linux/macOS” khi job trên hệ đó thật sự xanh. Lỗi đỏ thì đọc bước đầu tiên thất bại, không chỉ bấm chạy lại.
5. Ở cuối trang run, tải `proof-ubuntu-latest`, `proof-macos-latest`, và artifact browser tương ứng. Xem report.json, tests.tap và ảnh.
6. Lưu link run xanh vào ghi chép. Nếu muốn chạy lại trên cùng commit, chọn Run workflow. Repo cần bật Actions và có quota runner macOS phù hợp.

Các commit local đã được Codex tạo. Sau khi review, lệnh push là:

```powershell
git status
git log -3 --oneline
git push origin main
```

Nếu GitHub mở cửa sổ đăng nhập, bạn đăng nhập trực tiếp; không dán token vào cuộc trò chuyện. Sau khi xác nhận CI và bài đạt, nếu còn trong hạn tag Phase 1 của Coach:

```powershell
git tag phase-1
git push origin phase-1
```

Nếu tag phase-1 đã tồn tại thì dừng và kiểm tra nó trỏ tới đâu; không tự xóa hoặc thay tag đã nộp.

Không tạo tag phase-N cho phase chưa hoàn thành. Tag phase-1 chỉ trỏ vào commit bạn đã kiểm chứng và còn trong hạn Coach; nếu đã quá hạn, ghi trung thực, không sửa thời gian.

### Cách B: Máy thật hoặc Linux WSL đã cài

Trên Linux hoặc Mac, cần Git và Node.js 24 LTS, rồi chạy Terminal:

```bash
git clone https://github.com/SonLNH19/K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long.git
cd K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long
npm ci
npm run verify
npm run proof
npx playwright install --with-deps chromium
npm run test:browser
npm start
```

Mở http://localhost:4173 trên trình duyệt của chính máy đó. Trên Mac nên chơi thử thêm Safari để kiểm tra đồ họa thực tế, vì CI Chromium không thay kiểm tra Safari/GPU thật.

Để thử Linux ngay trên Windows, mở PowerShell rồi chạy `wsl --list --verbose`. Nếu chưa có distro hoặc yêu cầu cài WSL, GitHub Actions là đường kiểm tra có sẵn; việc cài WSL có thể cần quyền quản trị và khởi động lại. Phiên Codex hiện tại bị từ chối truy cập WSL, chưa có bằng chứng Linux local.

## 8. Các file để đọc khi giải thích bài

| File | Vai trò |
|---|---|
| game.contract.json | Lệnh chấm và thông số luật chơi duy nhất |
| src/game.mjs | Lõi 60 Hz: di chuyển, nhặt, nạp, pulse, Bóng Mực, điểm, thắng/thua |
| src/validation.mjs | Bắt lỗi inputs/scenario trước khi mô phỏng |
| src/headless.mjs | Đọc tham số, phát input đúng tick, ghi JSONL và mã thoát |
| src/app.mjs | Nhận bàn phím, gọi cùng lõi, dựng hình 3D và cập nhật HUD |
| scripts/build.mjs | Tạo bản web tĩnh dist/ với thư viện cục bộ |
| scripts/serve.mjs | Phục vụ game qua HTTP trên loopback |
| tests/ | Test có kết quả mong đợi, scenario và kiểm tra browser |
| scripts/verify.mjs | Harness dừng khi kiểm chứng thất bại |
| .github/workflows/verify.yml | Tự kiểm trên hệ điều hành khác và lưu artifact |
| docs/notes/phase-1.md | Yêu cầu, giả định, trạng thái và nhật ký AI |

Điều cần giải thích được: vì sao giao diện/headless dùng chung logic; vì sao tick 0 chưa có input; vì sao phải chuẩn hóa đường chéo; vì sao nhấn nút theo cạnh; vì sao seed làm output tái lập; vì sao scenario setup không cộng điểm.

## 9. Video và bàn giao sau các phase

- Chưa có video người học chơi. Khi làm video, mở game, quay màn hình chơi thật và chạy verify/headless cho thấy kết quả. Windows có thể dùng Snipping Tool nếu hỗ trợ quay màn hình hoặc công cụ quay bạn đã cài.
- File .mp4 dưới 5 phút; không quay khóa bí mật hoặc dữ liệu riêng của người khác.
- Video đính kèm Release v1.0.0 sau Phase 4 hoặc docs/demo/demo.mp4 dưới 100 MB; đặt link ở đầu README.
- Release v1.0.0, phase-2/3/4 chưa thực hiện vì chưa có các ticket. Không gắn nhãn bản Phase 1 thành sản phẩm cuối 4 phase.
- Khi nhận ticket mới, gửi nội dung phase đó để cập nhật luật, test và bằng chứng; test cũ thay đổi phải có lý do.
