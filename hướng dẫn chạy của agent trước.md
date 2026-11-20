ĐỌC KỸ agent.md
# Hướng dẫn chạy của agent trước

Tài liệu bàn giao cho agent tiếp theo. Ngày ghi nhận: 20/11/2026, múi giờ Việt Nam (GMT+7). Các kết quả bên dưới là trạng thái tại lần bàn giao; cần kiểm tra lại Git và file hiện tại trước khi sửa.

## 1. Bối cảnh và yêu cầu người dùng

- Người dùng làm lab cá nhân **Day 12 AI SDLC — Đảo Đèn Lồng**.
- Workspace: `D:\LAB AITC\LAB 12`.
- Repo:

```text
D:\LAB AITC\LAB 12\K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long
```

- Người dùng muốn agent **thực hiện toàn bộ phần có đủ yêu cầu**, giải thích bằng tiếng Việt, hướng dẫn cụ thể khi cần họ chạy lệnh hoặc thao tác.
- Người dùng mới cài công cụ, cần hướng dẫn dễ hiểu.
- Đã cung cấp **PRD-0 và Test Contract v1.0**, chưa cung cấp Ticket-02/03/04.
- Người dùng báo hạn nộp là nửa đêm 20/11/2026, tức 0h ngày 21/11/2026. **Chưa xác nhận giờ kết thúc lab hoặc hạn tag riêng**; tài liệu phân biệt hạn nộp link và hạn commit/tag.
- Yêu cầu gần nhất trước khi viết tài liệu này: tóm tắt toàn bộ công việc để agent khác tiếp tục, sau đó lưu toàn bộ vào một file Markdown tên **hướng dẫn chạy của agent trước**.

## 2. Các tài liệu cần đọc

Đọc `agent.md`, `RULES.md`, `GUIDE.md`, `CHECKPOINTS.md`, `RUBRIC.md`, `SUBMISSION.md`, `AGENTS.md` và:

```text
docs/requirements/PRD-0.txt
docs/notes/phase-1.md
docs/notes/evaluation-phase-1.md
docs/HUONG-DAN.md
```

- `README.md` hiện là README sản phẩm.
- README đề bài ban đầu được giữ ở `docs/lab/README-original.md`.
- PRD-0 gốc do người dùng gửi đã được sao chép đầy đủ vào `docs/requirements/PRD-0.txt`.
- Link lab board: https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW . Công cụ web của agent trước không truy cập được nội dung; không phụ thuộc vào việc mở được link để đọc Phase 1 vì đã lưu bản người dùng cung cấp.

## 3. Đã triển khai

Bản **Phase 1**, gồm:

- Game 3D góc nhìn thứ ba bằng JavaScript và Three.js.
- Đảo tròn, Mây đội nón lá có đèn nhỏ, 5 đèn, đom đóm và Bóng Mực.
- Di chuyển, nhảy, xoay camera, nhặt, nạp đèn, tỏa sáng.
- Sát thương, bất tử sau đòn, choáng, đẩy lùi và vùng an toàn quanh đèn sáng.
- HUD, bản đồ nhỏ, điểm số, thời gian, thắng/thua và chơi lại.
- Hướng dẫn/tạm dừng, âm thanh tổng hợp tùy chọn.
- Headless theo Test Contract v1.0.
- Kiểm tra dữ liệu đầu vào, test logic/CLI/browser, build web tĩnh, CI đa hệ điều hành.
- Ghi nguồn, giấy phép, giả định, nhật ký và bằng chứng thực tế.

Chỉ có yêu cầu Phase 1 nên không tự nhận hoàn thành toàn bộ 4 phase.

## 4. Kiến trúc và file chính

| File | Vai trò |
|---|---|
| `game.contract.json` | Nguồn thông số luật chơi cho cả browser và headless |
| `src/game.mjs` | Lõi `Game`, `step()`, `snapshot()`, `end()`, fixed-step 60 Hz |
| `src/validation.mjs` | Kiểm tra inputs/scenario, `InputError` |
| `src/headless.mjs` | CLI, đọc input đúng tick, ghi JSONL, mã thoát |
| `src/app.mjs` | Three.js, thu phím, HUD, âm thanh; dùng cùng lõi game |
| `index.html`, `style.css` | Giao diện toàn màn hình |
| `scripts/build.mjs` | Copy bản web và Three.js vào `dist/`, kèm giấy phép |
| `scripts/serve.mjs` | Build và phục vụ HTTP tại `localhost:4173` |
| `scripts/verify.mjs` | Kiểm tra cú pháp, test, build; dừng khi lỗi |
| `scripts/proof.mjs` | Chạy test và tạo bằng chứng thực tế |
| `scripts/demo-route.mjs` | Bot tạo input để kiểm tra thắng từ thế giới mặc định |
| `tests/game.test.mjs` | Test logic thuần và một lượt mặc định đầy đủ |
| `tests/headless.test.mjs` | Kiểm tra CLI, mã lỗi, JSONL, tính tất định |
| `tests/scenarios/` | Scenario và input cho các tình huống cô lập |
| `tests/browser/game.spec.mjs` | Kiểm tra giao diện và thao tác trình duyệt |
| `playwright.config.mjs` | Cấu hình browser, web server và Chrome/Edge local |
| `.github/workflows/verify.yml` | CI Windows/Linux/macOS |
| `AGENTS.md` | Hướng dẫn agent và các lệnh của dự án |
| `CREDITS.md`, `LICENSE` | Nguồn nội dung và giấy phép |

Thiết kế chính: **một lõi mô phỏng dùng chung**, tránh browser và headless chạy hai bộ luật khác nhau. Các thông số luật chơi lấy từ `game.contract.json`, không sao chép sang renderer.

Hình ảnh, geometry và texture được tạo bằng code; không dùng CDN hoặc asset bên ngoài khi chơi. Build giữ giấy phép Three.js trong `dist/THREE-LICENSE.txt`.

Skill đã dùng cho phần game trên trình duyệt: Sites. Đã đọc skill tại `C:/Users/NeoK/.codex/plugins/cache/openai-curated-remote/sites/1.1.7/skills/sites/SKILL.md` và hướng dẫn local preview. Công việc được thực hiện trong repo local của bài lab, chưa tạo hoặc deploy một Site hosted.

## 5. Môi trường

- Windows, Node.js `v26.13.1`, npm `11.20.0`.
- Node cài tại `D:\nodejs`.
- Nếu terminal chưa nhận PATH:

```powershell
$env:Path += ';D:\nodejs'
```

- Dùng `npm.cmd` để tránh lỗi PowerShell chặn `npm.ps1`.
- Project yêu cầu Node.js từ 24; CI dùng Node.js 24.
- Dependencies được khóa trong `package-lock.json`: Three.js `0.187.0`, Playwright `1.65.1`.
- Máy có Chrome và Edge.
- Sandbox cho phép ghi trong workspace, mạng bị hạn chế. Agent trước đã phải dùng quyền phù hợp để tải npm và để browser test đóng các tiến trình nó tạo.
- Không cần API key để chạy game hoặc test.

## 6. Quyết định thiết kế đã chốt

Đây là giả định triển khai, không phải tất cả đều do đề quy định:

- Tốc độ người chơi: 7m/s; đảo bán kính 40m.
- Sức chứa 15; mỗi đèn cần 8.
- Nhặt trong 1,8m, tương tác trong 3m.
- Tỏa sáng tốn 2 đom đóm đang mang; bán kính 8m; choáng 3s; đẩy 5m; cooldown 1s.
- 3 máu; bất tử 2s; không đánh rơi đom đóm (`hit_drop_ratio=0`).
- Bóng Mực tốc độ 2,4m/s, sát thương trong 1,1m.
- Đèn sáng có vùng an toàn 6m.
- Đêm dài 300s; không phạt rơi, giữ người chơi tại mép đảo (`fall_enabled=false`).
- Điểm: nhặt +10, thắp đèn +100, mỗi đối tượng pulse tác động +15. Khi thắng cộng `floor(time_left_s) * 2 + flames * 50`.
- Pulse vẫn tốn tài nguyên khi không có đối tượng trong vùng; có thể tác động lại đối tượng đang choáng khi cooldown cho phép, theo giả định đã ghi trong README.
- Scenario setup không cộng điểm/phát event.
- Đèn chưa sáng gần nhất được nạp; nếu hòa khoảng cách thì chọn theo id. Một lần nhấn nạp tối đa phần đèn còn thiếu và lượng đang mang.
- Thứ tự tick: di chuyển/nhảy → nhặt → nạp → pulse → sinh định kỳ → Bóng Mực/sát thương → giảm thời gian → xét kết thúc.
- Kết thúc đồng thời ưu tiên `all_lit`, rồi `no_flames`, rồi `dawn`.
- Ban đầu có 95 đom đóm và 2 Bóng Mực. Bổ sung một đom đóm mỗi 3 giây khi thiếu; một Bóng Mực mỗi 10 giây, tối đa 8. Chỉ sinh khi cờ random tương ứng bật.
- Nhảy chỉ đổi Y; va chạm và nhặt vẫn tính trên XZ theo contract.
- Thời gian scenario override là thời gian còn lại tại tick 0, sau k bước giảm k/60.
- Tạm dừng và trang trí là tính năng giao diện; headless không chạy trang trí hoặc tạm dừng.

## 7. Lưu ý Test Contract quan trọng

- File `game.contract.json` ở gốc repo, khai thông số đúng game đang dùng.
- Headless chạy cố định 60 tick/giây, không cần cửa sổ/GPU, không đợi thời gian thực.
- Tick 0 là sau dựng scenario, trước input.
- Input tick `k` tạo trạng thái `k+1`; event ghi tick `k+1`.
- `sim_tick` trong Phase 1 bằng `tick`.
- Trường input vắng mặt giữ giá trị cũ.
- Nút kích hoạt theo cạnh `false → true`; frame input có tick tăng nghiêm ngặt.
- Chuẩn hóa vector di chuyển chéo, áp dụng đúng công thức yaw trong contract.
- Đơn vị mét, Y hướng lên, người chơi mặc định bắt đầu tại `(0,0,0)`.
- Khoảng cách tính trên XZ, biên bán kính là `<=`, có sai số số thực cực nhỏ trong code.
- Scenario `motes`/`shades` thay danh sách; `lanterns` cập nhật theo id, không thay toàn bộ 5 đèn.
- Trường scenario thiếu dùng mặc định; `random_motes=false`/`random_shades=false` tắt sinh tương ứng.
- Snapshot tọa độ làm tròn 3 chữ số; thời gian giữ công thức giảm theo số bước.
- Snapshot từ tick 0, mặc định mỗi 10 tick; mảng `motes` đã được cung cấp dù chỉ là khuyến nghị ở v1.0.
- JSONL luôn kết thúc bằng dòng `end`.
- `--ticks 0` chỉ dựng trạng thái, ghi snapshot/end, không áp dụng input.
- Dừng khi đủ bước hoặc đã thắng/thua.
- Thành công thoát 0; inputs/scenario sai định dạng thoát mã 2; lỗi khác thoát mã 1; thông báo lỗi ra stderr.
- Cùng seed/scenario/inputs phải cho output giống hệt giữa hai lần chạy, kể cả id sinh tự động.
- Bản tóm tắt không thay thế văn bản contract gốc trong `docs/requirements/PRD-0.txt`.

## 8. Kiểm chứng đã thực hiện

- **41 test logic/CLI đạt**.
- **4 test browser đạt**, bộ test hoàn tất với mã 0.
- Browser kiểm tra dựng hình, di chuyển, nhảy, tạm dừng, bố cục cửa sổ nhỏ, thắng/thua, chơi lại và pulse.
- Kiểm tra browser dùng Chrome với **software WebGL**, chưa chứng minh GPU/Safari trên Mac thật.
- Bot thắng trong thế giới mặc định, không chỉnh trạng thái hoặc scenario override: **1.845 tick, 30,75 giây mô phỏng, 1.808 điểm**.
- Phát lại input bot qua CLI cho kết quả khớp.
- Hai output cùng seed giống hệt.
- Đã cài lại, test và build trong bản sao sạch tại `.qa/clean-check`.
- Sau khi tạo đủ 3 commit, đã **clone local sạch** tại `.qa/clone-check`, cài `npm ci` từ cache và chạy `npm run verify` thành công.
- Bản clone sạch nói trên là clone local trên Windows, chưa phải clone public từ GitHub hay kiểm tra trên Linux/macOS.

Bằng chứng nằm trong:

```text
docs/proof/phase-1/
```

Các file đáng chú ý:

```text
tests.tap
report.json
source-hashes.json
pickup.jsonl
win.jsonl
lose.jsonl
determinism-a.jsonl
determinism-b.jsonl
full-run.inputs.json
full-run.jsonl
full-run.summary.json
browser/intro.png
browser/playing.png
browser/small-window.png
browser/won.png
browser/lost.png
browser/pulse-and-lit-lamp.png
browser/render.json
```

`report.json` ghi môi trường thật, commit nền khi chạy, kết quả và SHA-256 so sánh tính tất định. `source-hashes.json` lưu hash của một số file nguồn tại lần kiểm tra. Không sửa tay bằng chứng để đổi kết quả. Nếu nguồn thay đổi, chạy lại kiểm chứng phù hợp và tạo lại bằng chứng.

Ảnh thắng/thua bằng scenario chỉ chứng minh tình huống tương ứng. Lượt bot mặc định là kiểm chứng đầu-cuối tự động, không phải video người học chơi.

## 9. Các lỗi đã phát hiện và sửa

1. **Helper test truyền trùng `--ticks`:** CLI từ chối tham số trùng làm bốn test thất bại. Sửa helper dùng Map ghi đè trước khi tạo args; không nới CLI để che lỗi.
2. **Tap nhanh E/F bị mất giữa hai frame:** thêm `pendingActions` giữ lần nhấn tới tick tiếp theo. Test browser vẫn dùng nhấn nhanh để bắt hồi quy.
3. **Bot ban đầu không dùng pulse nên thua:** bổ sung chiến lược phòng vệ bằng input thật, không giảm độ khó hay sửa máu.
4. **Browser test trong sandbox từng treo khi đóng tiến trình trên Windows:** chạy lại với quyền cần thiết đã hoàn tất, 4 test đạt. Không mô tả lần treo là một lần suite thành công; kết quả thành công là lần sau hoàn tất với exit code 0.
5. **File báo cáo test ban đầu chưa ép TAP reporter:** đã sửa `scripts/proof.mjs` dùng `--test-reporter=tap`, tạo lại `tests.tap` đúng định dạng.

## 10. Các lệnh chạy cho người dùng

### 10.1. Vào đúng thư mục

```powershell
cd 'D:\LAB AITC\LAB 12\K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long'
```

### 10.2. Cài và mở game trên Windows

```powershell
npm.cmd ci
npm.cmd start
```

Mở **http://localhost:4173** trong Chrome hoặc Edge. Không nhấp đúp `index.html`. Giữ terminal chạy server; Ctrl+C để dừng. Thư viện đã cài ở máy hiện tại nên có thể chỉ chạy `npm.cmd start`.

Điều khiển:

| Phím | Hành động |
|---|---|
| WASD hoặc mũi tên | Di chuyển theo camera |
| Space | Nhảy |
| E | Nạp đèn chưa sáng gần nhất |
| F | Tỏa sáng, tốn 2 đom đóm |
| Q/R hoặc kéo chuột phải | Xoay camera |
| H/Esc | Hướng dẫn, tạm dừng/tiếp tục |

Nếu cổng 4173 đang dùng, dừng server cũ hoặc đặt `$env:PORT=4174` trước khi chạy và mở cổng 4174.

### 10.3. Chạy kiểm chứng

Mở terminal thứ hai tại repo:

```powershell
npm.cmd run verify
npm.cmd run test:browser
npm.cmd run proof
```

- `verify`: kiểm tra cú pháp giao diện, test và build, dừng khi thất bại.
- `test:browser`: kiểm tra GUI và lưu ảnh; cần browser phù hợp. Windows hiện tại dùng Chrome/Edge đã cài.
- `proof`: chạy lại test, các tình huống headless, hai lượt tất định, lượt mặc định đầy đủ và ghi bằng chứng.
- Nếu chưa có browser Playwright hoặc Chrome/Edge phù hợp: `npx.cmd playwright install chromium`.

### 10.4. Headless thông thường

```powershell
node src/headless.mjs --seed 19 --night 1 --ticks 600 --out output.jsonl
Get-Content output.jsonl
```

### 10.5. Kiểm tra thắp đèn cuối và thắng

```powershell
node src/headless.mjs --seed 19 --night 1 --scenario tests/scenarios/win.json --inputs tests/scenarios/win.inputs.json --ticks 600 --out output.jsonl --snapshot-every 1
```

Scenario này đặt sẵn bốn đèn sáng, đủ tài nguyên và đèn cuối gần người chơi. Không nhận là bằng chứng chơi toàn màn từ trạng thái mặc định.

### 10.6. Phát lại lượt thắng mặc định

```powershell
node src/headless.mjs --seed 12 --night 1 --inputs docs/proof/phase-1/full-run.inputs.json --ticks 18000 --out output.jsonl
```

Không truyền scenario, nên dùng thế giới mặc định. Input được tạo bởi bot quan sát trạng thái rồi điều khiển theo luật thật.

### 10.7. Hook QA của browser

Chỉ khi URL có `?qa=1`, browser mới có `window.__qa`:

- Getter `game` để đọc trạng thái.
- `loadScenario(scenario)` để bắt đầu tình huống kiểm thử.
- `advance(count, patch)` chạy bằng `Game.step()` thật.
- `pause()` và getter `renderer` phục vụ kiểm tra.

Không dùng hook để sửa trạng thái rồi giả làm bằng chứng gameplay bình thường. Hook đang dùng cho test GUI các tình huống được khai rõ.

## 11. Git và lịch sử

Remote:

```text
https://github.com/SonLNH19/K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long
```

Đã tạo 3 commit local trên `main`:

```text
1427a34 Implement deterministic Phase 1 simulation and headless contract tests
4b6b7a0 Add 3D island gameplay, browser checks and multi-platform CI
ea2b375 Document Phase 1 decisions, test evidence and cross-platform instructions
```

Working tree sạch tại lần kiểm tra trước khi tạo chính file bàn giao này. **File bàn giao này mới được tạo theo yêu cầu, chưa commit.** Chưa push, chưa tạo tag, chưa xác minh repo public. Kiểm tra lại trạng thái trước khi sửa vì người dùng có thể đã thao tác thêm.

`.gitignore` có dòng ignore `AGENTS.md` trong phần cũ và ngoại lệ `!AGENTS.md` phía sau để giữ harness trong Git theo RULES mục 7. Không bỏ ngoại lệ này. `agent.md` và `starter/` vẫn bị ignore theo cấu hình sẵn có. `.qa/`, `node_modules/`, `dist/`, `test-results/`, `playwright-report/` và output tạm được ignore.

Các thư mục `.qa/clean-check`, `.qa/clone-check`, `.qa/npm-cache` là scratch của việc kiểm chứng; không commit. Không xóa thư mục đệ quy ngoài phạm vi đã xác định.

## 12. Kiểm tra Linux và macOS — việc đang chờ

Người dùng đặc biệt yêu cầu game chạy trên Linux và macOS, kèm hướng dẫn kiểm tra.

**Workflow đã chuẩn bị, chưa chạy remote.** Không ghi các nền tảng này đã đạt chỉ vì có workflow.

`.github/workflows/verify.yml` gồm:

- `contract-and-build`: ba job riêng trên `ubuntu-latest`, `macos-latest`, `windows-latest`; Node.js 24; `npm ci`, `npm run verify`, `npm run proof`; upload artifact bằng chứng theo hệ.
- `browser`: hai job riêng trên Ubuntu và macOS; cài Chromium bằng Playwright, chạy `npm run test:browser`, upload ảnh và kết quả.
- Kích hoạt khi push, pull request hoặc chạy thủ công qua workflow_dispatch.

### 12.1. Hướng dẫn người dùng chạy CI

Sau khi người học review thay đổi và kiểm tra vẫn trong hạn Coach:

```powershell
git status
git log -3 --oneline
git push origin main
```

File bàn giao mới chưa commit nên lệnh push chỉ đưa ba commit đã có lên remote, không đưa file mới này lên. Nếu người dùng muốn bàn giao file qua Git, cần commit file theo đúng hạn và yêu cầu của họ trước khi push.

Sau push:

1. Mở repo trên GitHub → **Actions**.
2. Chọn **Verify game on Windows Linux macOS**.
3. Mở lần chạy mới nhất và kiểm tra cả năm job.
4. Job đỏ thì đọc bước thất bại đầu tiên và sửa nguyên nhân; không chỉ bấm chạy lại để bỏ qua lỗi.
5. Tải `proof-ubuntu-latest`, `proof-macos-latest`, `proof-windows-latest` và artifact browser tương ứng.
6. Chỉ ghi hệ nào đã kiểm chứng khi job tương ứng xanh. Lưu link run trong ghi chép.

Nếu GitHub yêu cầu đăng nhập, người dùng đăng nhập trực tiếp; không gửi token/API key vào chat.

### 12.2. Chạy trên Linux hoặc Mac thật

Cần Git và Node.js 24 LTS hoặc mới hơn. Sau khi code đã được push:

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

Mở http://localhost:4173 trên chính máy đó. Nên thử thêm Safari trên Mac thật vì CI Chromium/software WebGL không thay thế kiểm tra Safari/GPU thật.

WSL local từng trả `Access denied` trong phiên công cụ; chưa kiểm chứng Linux local. Có thể hướng dẫn người dùng kiểm tra bằng `wsl --list --verbose`, nhưng chưa cài thêm WSL hoặc distro giúp họ.

## 13. Việc tiếp theo ưu tiên cho agent mới

1. Kiểm tra `git status`, lịch sử và các thay đổi mới của người dùng. Đọc tài liệu trước khi sửa.
2. Hỗ trợ người dùng mở game và tự chơi thử, đọc/review code, hiểu giả định. Đây là review độc lập với AI đã viết mã.
3. Ưu tiên hoàn tất việc kiểm tra Linux/macOS theo mục 12, vì đó là mối quan tâm người dùng nêu rõ.
4. Sau review và kiểm tra hạn Coach, push để CI chạy; sửa lỗi nếu có; lưu kết quả thực tế.
5. Chỉ gắn/push `phase-1` vào commit đã kiểm chứng khi phù hợp và còn trong hạn Coach. Không thay tag đã nộp hoặc sửa thời gian.
6. Nhận Ticket-02/03/04 rồi mới triển khai phase tiếp; cập nhật giả định, test và bằng chứng theo từng phase.
7. Quay video `.mp4` dưới 5 phút khi bàn giao cuối, có chơi thật và phần bằng chứng.
8. Release `v1.0.0`, video, tag phase-2/3/4 **chưa thực hiện**.

Ví dụ tag khi đã đủ điều kiện:

```powershell
git tag phase-1
git push origin phase-1
```

Nếu tag đã tồn tại, kiểm tra nó trỏ tới đâu; không tự xóa hay thay tag đã nộp.

## 14. Quy định phải giữ

- Không bịa yêu cầu phase chưa có, không nhận đã qua test ẩn của giảng viên.
- Không ghi Linux/macOS đã đạt chỉ vì có workflow.
- Không ghi FPS/hiệu năng đạt Phase 4: chưa có ticket hay ngưỡng, chưa chạy phép đo tương ứng. Draw calls/triangles trong render.json không phải chứng nhận FPS.
- Không xóa harness hoặc force-push làm mất lịch sử sau tag.
- Không commit API key/token/`.env`; không yêu cầu người dùng gửi khóa.
- Ghi nguồn asset và công cụ AI trong `CREDITS.md`; giữ giấy phép thư viện khi phân phối.
- Không sửa output bằng tay, viết test luôn đạt, lấy ảnh không khớp code, hoặc ghi đạt cho phần chưa kiểm chứng.
- Không dùng ảnh scenario thắng/thua để nói người học đã tự chơi hết màn; lượt bot không thay video demo.
- Người học cần hiểu và giải thích được bài.
- Token/chi phí chưa có thống kê xác thực; không bịa số. Chỉ bổ sung ước tính có căn cứ từ thông tin thực tế.
- Tài liệu lab yêu cầu sau hết giờ lab không commit thêm nội dung sản phẩm; hạn nộp link không tự thay thế hạn này. Xác định thông báo Coach trước các bước phát hành.
- Giữ các sửa đổi của người dùng. Trong quá trình làm, người dùng có chỉnh ghi chép và .gitignore; không ghi đè hàng loạt chỉ để đưa về trạng thái cũ của agent.
- Có hướng dẫn chi tiết cho người dùng trong `docs/HUONG-DAN.md`; tiếp tục cập nhật theo trạng thái thật.

## 15. Cách giao tiếp và phạm vi tiếp tục

- Giải thích bằng tiếng Việt, ngắn gọn ở chat; đưa hướng dẫn dài vào tài liệu khi phù hợp.
- Người dùng đã yêu cầu làm toàn bộ phần có đủ yêu cầu, nên tiếp tục chủ động trong phạm vi đó, không bắt họ tự làm lại phần agent có thể thực hiện.
- Khi người dùng cần thao tác, ghi rõ mở terminal nào, đứng ở thư mục nào, chạy lệnh gì, chờ thấy gì và gửi lại phần nào khi lỗi.
- Đừng để người dùng phải cung cấp lại PRD-0; đã có bản trong repo.
- Chưa có ticket phase sau; có thể chuẩn bị quy trình nhưng không tự tạo tính năng và gọi đó là yêu cầu khách hàng.
- Chưa triển khai hosting công khai bằng Sites, chưa tạo GitHub Release, chưa gửi bài lên LMS.

