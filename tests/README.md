# Kiểm thử

**Cách nhanh nhất:** `bash tests/run_local.sh` — tự dựng MariaDB + PHP tạm trong /tmp, chạy mọi bộ test rồi dọn sạch; không đụng CSDL thật. Cần mariadb-server, php-cli, python3-requests, python3-bs4, python3-pymysql.

## Chạy thủ công (v10)

Chỉ chạy trên **CSDL thử nghiệm riêng**. Tests seed tạo giáo viên/lớp/học sinh/bài làm giả, không tự xóa dữ liệu. Không dùng server thật đang có lớp học. Schema ghi cứng tên `ars`, vì vậy dùng MariaDB instance riêng/cổng riêng để không nhầm CSDL.

Cần PHP 8.3 + MySQL/mbstring/ZIP/XML/fileinfo/cURL, MariaDB 10.11, Python với requests, beautifulsoup4, pymysql. Chạy schema và migrations 002–007; `migrate_004` phải chạy với database `ars`.

Đặt `ARS_CONFIG` đến config của DB thử nghiệm; mở PHP:

```bash
ARS_CONFIG=/path/test.ini php -S 127.0.0.1:8091 -t web
```

Ở terminal khác:

```bash
export ARS_CONFIG=/path/test.ini
export TEST_BASE=http://127.0.0.1:8091/
python3 tests/http_smoke.py > /tmp/ars-smoke.json
python3 tests/ingest_integration.py /tmp/ars-smoke.json
python3 tests/extended_integration.py /tmp/ars-smoke.json
python3 tests/v11_integration.py /tmp/ars-smoke.json
python3 tests/oauth_integration.py /tmp/ars-smoke.json
```

`v11_integration.py` cần migration 006 và PHP server nhiều worker, vì nút Sync to Cloud gọi lại chính server thử (Cloud = cùng server, giáo viên 2 nhận dữ liệu của giáo viên 1): `PHP_CLI_SERVER_WORKERS=4 ARS_CONFIG=/path/test.ini php -S 127.0.0.1:8091 -t web`. Zalo/SMS dùng stub localhost:8093; test tự khôi phục settings thông báo trong finally.

`extended_integration.py` mở stub AI localhost:8092, tạm đổi settings AI của DB thử nghiệm và khôi phục trong finally. Không gọi API AI thật. Kết quả smoke chứa thông tin tài khoản test, không đưa output đó lên server công khai.

Kiểm tra cú pháp: `php -l` từng file PHP, `node --check` JS, `python3 -m py_compile server/ingest/ingest.py`. Test HTTP không chứng minh JavaScript/microphone chạy đúng trên mọi trình duyệt; test ingest không giả lập RF hoặc MQTT broker.

Kiểm trình duyệt (tùy chọn): cài Playwright cho Node và Chromium theo hướng dẫn của Playwright. Chạy `node tests/ui_smoke.cjs /tmp/ars-smoke.json`. Nếu dùng Chrome đã cài, đặt `CHROME_PATH` đến binary. Test tạo thêm một bài tập trong DB giả, thử KaTeX và canvas rồi lưu ảnh vào `/tmp/ars-ui/`. Test không xin quyền microphone.

Kiểm tra bố cục: khi máy chủ tạm đang chạy (`KEEP=1 bash tests/run_local.sh`), dùng đường dẫn `smoke.json` trong thư mục tạm mà script in ra:

```bash
TEST_BASE=http://127.0.0.1:8091/ node tests/layout_smoke.cjs /tmp/ars-test.XXXXXX/smoke.json
```

Kiểm tra màn hình đăng nhập, tổng quan / lớp / bài tập giáo viên, tổng quan / bài tập học sinh, tiến độ / tài khoản phụ huynh ở 320, 390, 768, 1024 và 1440 px. Kiểm tra tràn ngang, vị trí menu, phím Escape và điều hướng phụ huynh trên điện thoại. Chặn mạng ngoài để kiểm tra asset cục bộ; ảnh lưu ở `/tmp/ars-layout/` (đổi bằng `SCREENSHOT_DIR`). Chỉ dùng fixture thử nghiệm, không dùng CSDL thật.

`oauth_integration.py` dùng nhà cung cấp Google/Facebook giả lập localhost:8094 (kiểm client secret, PKCE, appsecret_proof, code dùng một lần). Thêm mục `[oauth_endpoints]` vào config thử nghiệm như ghi ở đầu file test. Không dùng mục này trên server thật.
