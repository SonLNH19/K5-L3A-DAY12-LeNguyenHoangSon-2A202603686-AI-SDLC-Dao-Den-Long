# Đảo Đèn Lồng · Phase 1

**Video demo:** chưa quay; sẽ thêm link video `.mp4` trước bàn giao cuối. [Ảnh và bằng chứng Phase 1](docs/proof/phase-1/).

Game 3D góc nhìn thứ ba: cùng Mây gom đom đóm, thắp 5 Đèn Lồng Lớn và xua Bóng Mực trên Đảo Bến. Nhân vật, bối cảnh và đề bài là bản gốc của lab Day 12 AI SDLC.

**Phạm vi hiện tại:** PRD-0 và Test Contract v1.0. Chưa triển khai Ticket-02/03/04, chưa tạo Release cuối `v1.0.0`. [Hướng dẫn chi tiết từng bước, kể cả kiểm tra Linux/macOS](docs/HUONG-DAN.md).

## Cài và chơi trong 3 lệnh

Cần Node.js 24 LTS hoặc mới hơn, npm và trình duyệt hỗ trợ WebGL2. Đã chạy local bằng Node.js 26 trên Windows. Cài thư viện lần đầu cần mạng; khi chơi không tải CDN, font hay asset bên ngoài.

Từ thư mục repo đã clone:

```bash
npm ci
npm run build
npm start
```

Mở **http://localhost:4173**. Giữ terminal mở; Ctrl+C để dừng. Trên Windows PowerShell, dùng `npm.cmd` thay `npm` nếu bị chặn script. `start` cũng tự build, nên lúc phát triển có thể bỏ lệnh build ở giữa.

Bản web tĩnh nằm ở `dist/`, có thể phục vụ bằng HTTP static server; không nhấp đúp file index.html.

## Điều khiển và luật chơi

| Phím | Hành động |
|---|---|
| WASD hoặc mũi tên | Di chuyển theo camera |
| Space | Nhảy |
| E | Nạp đom đóm vào đèn chưa sáng gần nhất |
| F | Tỏa sáng, tiêu hao 2 đom đóm đang mang |
| Q / R hoặc kéo chuột phải | Xoay camera |
| H / Esc | Hướng dẫn, tạm dừng hoặc tiếp tục |

- Tự nhặt đom đóm trong 1,8m, tối đa 15 con. Mỗi đèn cần 8 con; nạp một lần tối đa phần còn thiếu khi trong 3m.
- Bóng Mực đuổi với tốc độ 2,4m/s; chạm trong 1,1m mất 1 máu. Mây có 3 máu và bất tử 2 giây sau mỗi lần trúng, không rơi đom đóm.
- Tỏa sáng trong 8m làm choáng 3 giây, đẩy 5m; cooldown 1 giây. Nhấn theo cạnh: giữ E/F/Space không tự lặp hành động.
- Đèn đã sáng có vùng an toàn 6m. Tỏa sáng vẫn tiêu hao nếu không có Bóng Mực trong vùng.
- Thắp đủ 5 đèn thì thắng. Hết máu hoặc hết 300 giây thì thua. Có thể chơi lại sau cả hai kết quả.
- Mây bị giữ tại mép đảo nên `fall_enabled=false`; không có sát thương rơi. Nhảy không giúp tránh sát thương vì contract đo khoảng cách ngang XZ.

## Điểm số và giả định

- Nhặt 1 đom đóm: +10; thắp 1 đèn: +100; mỗi Bóng Mực bị pulse tác động: +15, kể cả làm choáng lại sau cooldown.
- Chỉ khi thắng: cộng `floor(time_left_s) × 2 + flames × 50`. Khi thua không cộng thưởng cuối.
- Scenario đặt sẵn trạng thái không phát sự kiện hay cộng điểm.
- Thứ tự mỗi tick: di chuyển/nhảy → nhặt → nạp đèn → pulse → sinh định kỳ → Bóng Mực di chuyển/gây sát thương → giảm giờ → xét kết thúc. Khi đồng thời kết thúc, ưu tiên đủ đèn, sau đó hết máu, rồi bình minh.
- Đảo bán kính 40m, tốc độ người chơi 7m/s; 95 đom đóm ban đầu, bổ sung một con mỗi 3 giây khi thiếu; 2 Bóng Mực ban đầu, thêm một con mỗi 10 giây, tối đa 8. Các số này là lựa chọn triển khai, không phải PRD quy định.
- Thời gian scenario override là thời gian còn lại ở tick 0; sau k bước giảm k/60. Biên bán kính tính `<=` với sai số số thực cực nhỏ.
- [Yêu cầu, giả định và nhật ký](docs/notes/phase-1.md), [PRD-0 gốc người học cung cấp](docs/requirements/PRD-0.txt).

## Kiểm chứng

```bash
npm run verify
npm run test:browser
npm run proof
```

`verify` kiểm tra cú pháp, test logic/headless và build; dừng khi có lỗi. `test:browser` cần Chrome/Edge trên Windows hoặc Chromium của Playwright (`npx playwright install --with-deps chromium` trên Linux/macOS). `proof` tạo JSONL, báo cáo môi trường, kết quả test, so sánh tính tất định và lượt thắng từ thế giới mặc định.

Test headless không cần cửa sổ/GPU. Test browser có kiểm tra dựng hình WebGL và thao tác thực; không thay thế kiểm tra GPU/Safari trên máy Mac thật.

## Headless · Test Contract v1.0

```bash
node src/headless.mjs --seed 19 --night 1 --ticks 600 --out output.jsonl
```

Ví dụ kiểm tra thắp đèn cuối và thắng:

```bash
node src/headless.mjs --seed 19 --night 1 --scenario tests/scenarios/win.json --inputs tests/scenarios/win.inputs.json --ticks 600 --out output.jsonl --snapshot-every 1
```

Tái lập lượt thắng đầy đủ, không dùng scenario override (chạy `npm run proof` trước để tạo inputs):

```bash
node src/headless.mjs --seed 12 --night 1 --inputs docs/proof/phase-1/full-run.inputs.json --ticks 18000 --out output.jsonl
```

- 60 tick/giây cố định, chạy nhanh nhất có thể; snapshot tick 0 trước input, sau đó mặc định mỗi 10 tick; dòng `end` luôn cuối.
- `--ticks 0` chỉ dựng trạng thái và ghi snapshot/end. Dừng sớm nếu thắng/thua.
- Input mặc định đứng yên; trường vắng mặt giữ giá trị cũ; tick frame tăng nghiêm ngặt.
- Thành công thoát 0; inputs/scenario sai định dạng thoát 2, lỗi khác thoát 1; thông báo lỗi ra stderr.
- `game.contract.json` là nguồn tuning duy nhất cho cả browser và headless. Cùng seed, scenario và inputs cho output giống hệt giữa hai lần chạy.

## Kiểm tra Windows, Linux và macOS

Workflow [.github/workflows/verify.yml](.github/workflows/verify.yml) chạy test/contract/build trên ba hệ điều hành và browser trên Ubuntu/macOS. Sau push, mở tab **Actions** để xem từng job và tải artifact bằng chứng.

**Không coi việc có workflow là bằng chứng đã chạy xanh.** Trạng thái thực tế của lần triển khai xem [đánh giá Phase 1](docs/notes/evaluation-phase-1.md). [Hướng dẫn chạy trên máy thật, WSL và đọc CI](docs/HUONG-DAN.md).

## Sáng tạo của tôi

Đảo low-poly, đường đá dẫn tới năm đèn, nón lá có đèn nhỏ, đom đóm lung linh, vòng sáng an toàn, bản đồ vị trí và âm thanh tổng hợp theo sự kiện. Trang trí chỉ nằm ở renderer, không thêm thực thể vào headless. Các test tính tất định và cơ chế lõi là bằng chứng kiểm tra phần cũ; ảnh thực tế ở docs/proof/phase-1/browser/.

## Cấu trúc và tài liệu lab

| Đường dẫn | Vai trò |
|---|---|
| src/game.mjs | Một lõi logic cho cả giao diện và headless |
| src/app.mjs | Hiển thị 3D, bàn phím, HUD, âm thanh |
| src/headless.mjs, src/validation.mjs | CLI, dữ liệu input/scenario, JSONL |
| tests/, scripts/ | Test, scenario, build, server, harness kiểm chứng |
| AGENTS.md | Hướng dẫn agent đã dùng và giữ trong repo |
| docs/notes/, docs/proof/ | Giả định, đánh giá, nhật ký AI và bằng chứng |
| docs/lab/README-original.md | README đề bài trước khi bổ sung README sản phẩm |

[GUIDE](GUIDE.md) · [CHECKPOINTS](CHECKPOINTS.md) · [RULES](RULES.md) · [RUBRIC](RUBRIC.md) · [SUBMISSION](SUBMISSION.md)

[CREDITS](CREDITS.md) · [LICENSE](LICENSE). Không commit `.env`, token, API key. Không dùng bằng chứng sửa tay hoặc gắn tag cho phase chưa hoàn thành.
