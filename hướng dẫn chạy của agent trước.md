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



---

# PHẦN TIẾP TỤC BÀN GIAO: PHASE 2 (TICKET-02 — "BA HÒN ĐẢO")
*Ghi nhận ngày: 20/11/2026 (GMT+7)*

## 16. Tổng quan công việc đã hoàn thành ở Phase 2

Agent tiếp quản đã triển khai và hoàn thiện trọn vẹn **Phase 2 (TICKET-02 — "Ba hòn đảo")** theo đúng **Test Contract v1.1**, đồng thời sửa triệt để lỗi hiển thị font chữ tiếng Việt do người dùng phản ánh.

### 16.1. Chuẩn hóa số liệu & Luật chơi (Phần 1 & Test Contract v1.1)
- Nâng cấp `game.contract.json` lên `contract_version: "1.1"`.
- **Tốc độ chạy:** 6.0 m/s; tăng tốc/dừng trong $\le 0.1$ s; điều khiển trên không đầy đủ.
- **Nhảy:** Vận tốc $7.0\text{ m/s}$, trọng lực $-20\text{ m/s}^2$, chỉ nhảy khi chạm đất (`grounded`).
- **Lướt (Dash - Mới):** Vận tốc $14\text{ m/s}$, kéo dài $0.2\text{ s}$ (12 ticks), hồi chiêu $1.5\text{ s}$ (90 ticks tính từ lúc bấm). Lướt theo hướng di chuyển (hoặc hướng mặt nếu đứng yên); lướt trên không giữ nguyên độ cao; không có bất tử khi lướt.
- **Đom đóm:** Sức chứa tối đa 10; nhặt tự động khi khoảng cách $\text{XZ} \le 1.0\text{ m}$ và $|dY| \le 1.5\text{ m}$. Bắt đầu có 20 con tại 20 điểm trống, trần 30 con; sinh thêm 1 con mỗi 240 ticks nếu còn điểm trống.
- **Đèn lồng:** Chi phí 10 đom đóm, nạp được nhiều lần, nhớ tiến độ. Tương tác trong bán kính $2.0\text{ m}$; nạp $\min(\text{đang mang}, \text{còn thiếu})$ vào đèn gần nhất (bằng nhau thì ID nhỏ hơn). Vùng an toàn bán kính $6\text{ m}$ chặn Bóng Mực; đẩy bóng ra mép trong 30 ticks không gây sát thương.
- **Tỏa Sáng (Pulse):** Chi phí 3 đom đóm, bán kính 3D $5.0\text{ m}$ (tâm = chân Mây $+ 0.8\text{ m}$), hồi chiêu $3.0\text{ s}$ (180 ticks). Choáng 120 ticks, 15 tick đầu bị đẩy lùi 4 m ngang.
- **Bóng Mực (Shades):** Tốc độ $4.0\text{ m/s}$ (Đêm 3: $4.5\text{ m/s}$). Phát hiện 12 m, bỏ đuổi 18 m. Chạm khi $\text{XZ} \le 1.0\text{ m}$ và $|dY| \le 1.5\text{ m}$. Bị đánh: $-1$ Ngọn Lửa, rơi $\lfloor \text{đang mang} / 2 \rfloor$ đom đóm ra vành $1.5\text{--}2.5\text{ m}$ (tồn tại 480 ticks), bất tử 90 ticks. Kẻ địch recoil 2 m trong 60 ticks.
- **Rơi khỏi đảo ($Y < -10$):** Bỏ qua bất tử: $-1$ Ngọn Lửa, mất sạch đom đóm, chờ 60 ticks (bất động, không nhặt, không bị chạm), hồi sinh ở điểm xuất phát, vận tốc 0, bất tử 90 ticks. Hết máu thua ngay (`no_flames`).
- **Thời lượng:** Đêm 1: 300s, Đêm 2: 330s, Đêm 3: 360s.
- **Tính điểm chuẩn hóa:** $+10$ mỗi đom đóm nạp, $+100$ mỗi đèn thắp, $+5$ mỗi Bóng Mực trúng Pulse. Khi thắng: $+\lfloor \text{giây còn lại} \rfloor \times 2 + 50 \times \text{máu còn lại}$.

### 16.2. Bản đồ chuẩn 3 Đêm (Phần 2)
1. **Đêm 1 — Đảo Bến:** Đảo tròn tâm $(0,0,0)$, bán kính 40 m. 5 đèn L1–L5. 24 điểm sinh đom đóm (8 điểm $R=12$, 16 điểm $R=33$). 12 điểm sinh Bóng Mực $R=37\text{ m}$.
2. **Đêm 2 — Đảo Cau:** 2 đảo tròn bán kính 28 m, tâm A $(0,0,0)$ và B $(70,0,0)$, nối bằng cầu tre $x \in [26, 44], z \in [-2, 2]$. 2 bục nhảy $R=1\text{ m}$ tại $(20,0,18)$ và $(50,0,-18)$ phóng $V_y = 14\text{ m/s}, V_{\text{ngang}} = 24\text{ m/s}$ sang đảo đối diện. 6 đèn L1–L6.
3. **Đêm 3 — Đảo Chuông:** Đảo 3 tầng (Tầng 0: $Y=0, R=45\text{ m}$; Tầng 1: $Y=3, R=12\text{--}24\text{ m}, z > 0$; Tầng 2: $Y=6, R=8\text{ m}$). 2 dốc nghiêng rộng 3 m ở góc $30^\circ$ và $150^\circ$. Bục nhảy tại $(0,3,13)$ phóng $V_y = 12\text{ m/s}, V_z = -8\text{ m/s}$ lên tầng 2. Tháp chuông cao 8 m ở tâm tầng 2. 7 đèn L1–L7. Gió mạnh mỗi 30s kéo dài 5s đẩy 2 m/s, báo trước 2s.

### 16.3. Tính năng mới & UI/UX (Phần 3)
- **Gió Lạc (Drifters D1, D2):** Tốc độ 7 m/s, xuất hiện Đêm 2 & 3. Chuyển sang đuổi khi Mây mang $\ge 5$ đom đóm và cự ly $\le 15\text{ m}$. Cướp $\min(3, \text{đang mang})$, sau đó bỏ chạy (flee 240 ticks). Tỏa Sáng trúng Gió Lạc đang flee sẽ làm rơi lại toàn bộ số đom đóm đã cướp.
- **Bùa Gió (Charms C1, C2):** Tồn tại 600 ticks (10s), tăng tốc độ lên 7.2 m/s và xóa hồi chiêu Lướt. Tự hồi sinh sau 2700 ticks (45s).
- **Chuỗi 3 Đêm:** Menu chính $\to$ Giới thiệu Đêm $\to$ Chơi $\to$ Kết quả $\to$ Đêm kế tiếp.
- **Tạm dừng & Cài đặt:** Phím Esc hoặc P. Menu cài đặt cho phép chỉnh âm lượng tổng và độ nhạy chuột, lưu vào `localStorage`.
- **HUD & Chỉ dẫn:** Hiển thị 10 ô đom đóm, đồng hồ nhấp nháy đỏ khi $\le 30\text{ s}$, vòng tròn SVG hồi chiêu Lướt / Tỏa Sáng, và mũi tên 2D chỉ hướng đến đèn chưa thắp gần nhất khi nằm ngoài tầm nhìn.
- **Bảng màu & Ánh sáng chuẩn:** Độ sáng đảo tăng tuyến tính theo tiến độ thắp đèn: `intensity = 0.15 + 0.55 * (lit / total)`.

### 16.4. Sửa lỗi vỡ font tiếng Việt
- **Lỗi:** Font serif `Georgia` trên Windows bị lỗi tách dấu huyền khỏi chữ `ê` trong cụm từ "Mang ánh sáng về nhà." (thành `v` `ê` ``` ` ``` rồi cách trống đến chữ `nhà.`).
- **Khắc phục:** Thay thế toàn bộ font stack tiêu đề trong `style.css` sang font sans-serif hệ thống chuẩn Unicode:
  `font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif;`
- Đã kiểm tra lại giao diện thực tế và cập nhật ảnh chụp tại `docs/proof/phase-2/browser/intro.png`.

---

## 17. Trạng thái kiểm chứng & Bằng chứng thực tế Phase 2

Toàn bộ bằng chứng được lưu tại thư mục:
```text
docs/proof/phase-2/
```

1. **Unit tests & Regression:**
   - Lệnh: `npm test` hoặc `npm run verify`
   - Kết quả: **45/45 tests passed (100%)** trong thời gian ~1.0s.
   - Báo cáo TAP: `docs/proof/phase-2/tests.tap`.
2. **Tính tất định 3 Đêm (Determinism):**
   - Chạy 2 lần cùng seed trên cả 3 đêm:
     - `determinism-night1-a.jsonl` trùng khớp từng byte với `determinism-night1-b.jsonl`.
     - `determinism-night2-a.jsonl` trùng khớp từng byte với `determinism-night2-b.jsonl`.
     - `determinism-night3-a.jsonl` trùng khớp từng byte với `determinism-night3-b.jsonl`.
3. **Headless Benchmark hiệu năng (DoD $\le 30\text{ s}$):**
   - Chạy 21.600 ticks headless trên Đêm 3: hoàn thành trong **0.510 giây** (nhanh hơn 58 lần so với yêu cầu).
   - Bằng chứng: `docs/proof/phase-2/benchmark-21600.jsonl` và `report.json`.
4. **Bot chơi tự động (Full run):**
   - Chạy bằng input thật trong thế giới mặc định: thắng Đêm 1 trong **11.837 ticks (197.28s)** với **1.055 điểm**.
   - Bằng chứng: `docs/proof/phase-2/full-run.inputs.json`, `full-run.jsonl`, `full-run.summary.json`.
5. **Kịch bản Headless Scenario cho từng tính năng mới:**
   - `dash.jsonl`: kiểm chứng lướt 14 m/s, thời gian 12 ticks, hồi chiêu.
   - `wind-charm.jsonl`: kiểm chứng bùa gió tăng tốc 7.2 m/s, lướt liên tục.
   - `jump-pad.jsonl`: kiểm chứng lực phóng bục nhảy $V_y = 14, V_{\text{ngang}} = 24$.
   - `stray-wind.jsonl`: kiểm chứng Gió Lạc đuổi, cướp và rơi đom đóm khi dính Pulse.
   - `fall.jsonl`: kiểm chứng rơi khỏi đảo $Y < -10$, trừ máu và hồi sinh sau 60 ticks.
   - `pause.jsonl`: kiểm chứng dừng logic game khi tạm dừng.
   - `night2.jsonl` & `night3.jsonl`: kiểm chứng mô phỏng Đêm 2 và Đêm 3.
6. **Browser Tests (Playwright):**
   - 4/4 tests passed: kiểm tra render 3D WebGL, bàn phím WASD, Lướt, Tạm dừng, nạp đèn, tỏa sáng, responsive cửa sổ nhỏ.
   - Ảnh chụp thực tế: `intro.png`, `playing.png`, `won.png`, `lost.png`, `pulse-and-lit-lamp.png`, `small-window.png`.

---

## 18. Các lỗi AI đã gặp và cách sửa trong Phase 2

1. **Lỗi thứ tự gán vận tốc bục nhảy (Jump Pad):**
   - *Nguyên nhân:* Vận tốc `padVel` được gán sau khối tính toán `p.vel`, khiến tick kích hoạt có vận tốc ngang bằng 0.
   - *Khắc phục:* Gán trực tiếp `p.vel` ngay khi chạm bục để bảo đảm người chơi được phóng tức thì.
2. **Lỗi lọc mảng Gió Lạc khi bị Tỏa Sáng:**
   - *Nguyên nhân:* Bộ lọc mảng loại bỏ drifter khi `fleeTicks <= 0`, trong khi drifter bị bắn rơi đồ vẫn cần tồn tại `despawnTicks = 120`.
   - *Khắc phục:* Điều chỉnh điều kiện giữ lại thực thể nếu `d.despawnTicks > 0`.
3. **Độ sâu rơi khỏi đảo ($Y < -10$):**
   - *Nguyên nhân:* Test ban đầu chỉ cho 60 bước di chuyển từ mép đảo nên chưa kịp rơi xuống dưới $-10\text{ m}$.
   - *Khắc phục:* Tăng thời gian kiểm tra lên 90 bước để rơi qua ngưỡng $-10\text{ m}$ dứt khoát.
4. **Trùng lặp cờ CLI trong `scripts/proof.mjs`:**
   - *Nguyên nhân:* Nối mảng tham số làm lặp cờ `--night`.
   - *Khắc phục:* Sử dụng `Map` để ghi đè tham số trước khi gọi tiến trình con.
5. **Bot chơi tự động bị hết giờ ở Đêm 1:**
   - *Nguyên nhân:* Bot cũ chỉ đến đèn khi gom đủ 10 con, trong khi ở Phase 2 đom đóm phân tán và Bóng Mực đuổi ráo riết.
   - *Khắc phục:* Bổ sung chiến lược nạp sớm (khi mang $\ge 4$ con gần đèn hoặc $\ge 7$ con) và kết hợp Lướt (Dash).

---

## 19. Tình trạng Git, Lịch sử Commits & Tags

Kho mã nguồn local hiện đang ở trạng thái sạch (`working tree clean`), nhánh `main`, với các mốc commit:

* `ea2b375`: **Tag `phase-1`** (Hoàn thành Phase 1).
* `11ab069`: Lưu tài liệu bàn giao từ agent trước.
* `d23ba37`: Chuẩn hóa số liệu và triển khai Test Contract v1.1.
* `ddd0991`: Mở rộng 3 hòn đảo, HUD, điều khiển lướt và browser test.
* `3ec4cc7`: Ghi chép tài liệu, bằng chứng proof và benchmark Phase 2.
* `fc02144`: **Tag `phase-2`** (Sửa triệt để lỗi font tiếng Việt `Segoe UI`).

Lệnh để người dùng đẩy toàn bộ lên GitHub:
```powershell
cd "d:\LAB AITC\LAB 12\K5-L3A-DAY12-LeNguyenHoangSon-2A202603686-AI-SDLC-Dao-Den-Long"
git push origin main
git push origin phase-1
git push origin phase-2 --force
```

---

## 20. Hướng dẫn tiếp tục cho Agent tiếp theo (Phase 3 — Ticket-03)

Khi nhận được đề bài **Ticket-03 (Phase 3)** từ người dùng / giảng viên:

1. **Đọc kỹ đề bài Ticket-03:**
   - Xác định rõ các luật mới nào được thêm vào.
   - Xác định các luật cũ nào ở Phase 1 hoặc Phase 2 bị **thay thế hoặc bãi bỏ**.
   - Tuyệt đối không tự suy đoán luật chơi khi chưa có đề bài Ticket-03.
2. **Cập nhật tài liệu spec & kế hoạch kiểm chứng:**
   - Tạo file `docs/notes/phase-3.md` ghi rõ acceptance criteria và bảng đối chiếu thay đổi luật.
   - Sửa các test cũ bị luật mới thay thế kèm giải trình lý do rõ ràng trong file test (không xóa âm thầm).
3. **Cập nhật mã nguồn & Test Contract:**
   - Cập nhật `game.contract.json` (nếu có version mới, ví dụ v1.2 hoặc nâng cấp tuning).
   - Triển khai logic trong `src/game.mjs` (giữ tính tất định PRNG và fixed-step 60 Hz).
   - Cập nhật hiển thị 3D trong `src/app.mjs` nếu có cơ chế/thực thể mới.
4. **Kiểm tra và sinh bằng chứng:**
   - Chạy `npm test` và `npm run verify` bảo đảm 100% tests pass.
   - Chạy `npm run proof` để sinh bằng chứng đầy đủ vào `docs/proof/phase-3/`.
   - Chạy `npm run test:browser` chụp lại ảnh màn hình.
   - Ghi lại đánh giá và các lỗi AI gặp phải vào `docs/notes/evaluation-phase-3.md`.
5. **Commit & Gắn tag:**
   - Thực hiện commit nhỏ, rõ ràng.
   - Gắn tag `phase-3` vào commit hoàn thành Phase 3 và hướng dẫn người dùng push.
