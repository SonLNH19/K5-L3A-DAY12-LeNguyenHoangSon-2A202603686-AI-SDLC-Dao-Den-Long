# Đảo Đèn Lồng — hướng dẫn agent (Phase 3 — Contract v1.2)

- Phạm vi: Phase 3 (Đèn cạn dầu), giữ Phase 1–2 chưa bị thay. Xem docs/notes/phase-3.md và ADR-003-fuel-and-dawn.md.
- Lệnh: Cài đặt `npm ci`. Chơi: `npm start`. Build: `npm run build`. Kiểm chứng: `npm run verify`.
- Windows: dùng `npm.cmd` thay `npm` nếu PowerShell chặn `npm.ps1`. PATH: `$env:Path += ';D:\nodejs'`.
- Lõi mô phỏng: `src/game.mjs` chạy fixed-step 60 Hz dùng chung cho cả browser và headless.
- Tuning chuẩn duy nhất: `game.contract.json` (contract_version: "1.2").
- Điều khiển: WASD (di chuyển), Space (nhảy), Shift/J (lướt - dash), E (nạp đèn), F (tỏa sáng), Q/R hoặc chuột phải (camera), Esc/P (tạm dừng).
- Headless: `node src/headless.mjs --seed 1 --night [1|2|3] --ticks 600 --out output.jsonl`.
- Input: các nút (jump, interact, pulse, dash, pause) kích hoạt ở cạnh false → true; frame giữ nguyên giá trị cũ nếu vắng mặt.
- Snapshot v1.1: gồm mảng motes (id, pos, kind = random/dropped, ttl_s), drifters (id, pos, state, stolen), charms (id, available, respawn_s), wind {active, dir_deg}.
- v1.2 thêm fuel/ever_lit/relit_count và player.capacity; scenario có successful_lights/target_lantern_id. Fuel lưu nguyên đơn vị 1/60; không dùng fuel làm tròn để xét an toàn.
- Dầu hao/drain ở bước 2; kết thúc sau mọi cập nhật: no_flames trước, rồi dawn_survived nếu đủ 60% đèn. Không còn all_lit thắng sớm.
- Bằng chứng mới ở docs/proof/phase-3/; giữ bằng chứng và tag phase trước. Không force push.
- Kiểm chứng: `npm run verify` dừng ngay khi có lỗi. Tạo bằng chứng: `npm run proof`.
- Tuyệt đối không can thiệp bằng chứng thủ công, không sửa test giả, giữ lịch sử git rõ ràng.
- Ghi nguồn tài sản trong `CREDITS.md`.
