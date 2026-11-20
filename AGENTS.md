# Đảo Đèn Lồng — hướng dẫn agent

- Chỉ thực hiện yêu cầu phase đã được cung cấp. Xem docs/requirements/ và docs/notes/phase-1.md.
- Cài: npm ci. Chơi: npm start. Build: npm run build. Kiểm chứng: npm run verify.
- Dùng npm.cmd thay npm trên Windows nếu PowerShell chặn npm.ps1.
- Logic duy nhất ở src/game.mjs, chạy fixed-step 60 Hz cho cả browser và headless.
- game.contract.json là nguồn tuning; không sao chép hằng số luật chơi sang renderer.
- Headless: node src/headless.mjs --seed 1 --night 1 --ticks 600 --out output.jsonl.
- Input nút theo cạnh false→true; frame giữ trường vắng mặt; khoảng cách XZ dùng <=.
- Không dùng Math.random, Date.now hay GPU trong lõi; RNG có seed, id ổn định.
- Sau sửa logic: chạy npm run verify. scripts/verify.mjs dừng với mã khác 0 khi test/build thất bại.
- Bằng chứng: npm run proof. Không sửa output, không ghi đạt cho phần chưa kiểm chứng.
- Khi luật đổi, cập nhật test/giả định kèm lý do. Giữ file harness trong lịch sử.
- Không commit node_modules, .env, khóa bí mật; ghi nguồn asset/công cụ trong CREDITS.md.
- Người học review diff, chơi thử, kiểm tra bằng chứng và giải thích được phần nộp.
