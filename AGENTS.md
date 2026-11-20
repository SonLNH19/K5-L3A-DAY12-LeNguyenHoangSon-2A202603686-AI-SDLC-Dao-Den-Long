# Đảo Đèn Lồng — hướng dẫn agent (Phase 2 — Contract v1.1)

- Phạm vi: Phase 1 và Phase 2 (TICKET-02: Ba hòn đảo). Xem docs/notes/phase-2.md.
- Lệnh: Cài đặt `npm ci`. Chơi: `npm start`. Build: `npm run build`. Kiểm chứng: `npm run verify`.
- Windows: dùng `npm.cmd` thay `npm` nếu PowerShell chặn `npm.ps1`. PATH: `$env:Path += ';D:\nodejs'`.
- Lõi mô phỏng: `src/game.mjs` chạy fixed-step 60 Hz dùng chung cho cả browser và headless.
- Tuning chuẩn duy nhất: `game.contract.json` (contract_version: "1.1").
- Điều khiển: WASD (di chuyển), Space (nhảy), Shift/J (lướt - dash), E (nạp đèn), F (tỏa sáng), Q/R hoặc chuột phải (camera), Esc/P (tạm dừng).
- Headless: `node src/headless.mjs --seed 1 --night [1|2|3] --ticks 600 --out output.jsonl`.
- Input: các nút (jump, interact, pulse, dash, pause) kích hoạt ở cạnh false → true; frame giữ nguyên giá trị cũ nếu vắng mặt.
- Snapshot v1.1: gồm mảng motes (id, pos, kind = random/dropped, ttl_s), drifters (id, pos, state, stolen), charms (id, available, respawn_s), wind {active, dir_deg}.
- Kiểm chứng: `npm run verify` dừng ngay khi có lỗi. Tạo bằng chứng: `npm run proof`.
- Tuyệt đối không can thiệp bằng chứng thủ công, không sửa test giả, giữ lịch sử git rõ ràng.
- Ghi nguồn tài sản trong `CREDITS.md`.
