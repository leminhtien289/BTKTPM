# Design Pattern

| | | | |
|---|---|---|---|
| **Thực hành:** | Observer | Composite | Adapter |
| **Mục tiêu:** | Hiểu và áp dụng các Design Pattern đúng trong từng trường hợp cụ thể | | |

**Cho các mô tả sau:**

Bạn được giao nhiệm vụ xây dựng một hệ thống quản lý thư mục và tập tin theo mô hình cây (tree structure). Trong hệ thống này:

Một thư mục có thể chứa nhiều tập tin hoặc các thư mục con.
Một tập tin chỉ có thể chứa dữ liệu, không thể chứa thư mục hoặc tập tin khác.
Cả thư mục và tập tin đều có thể được hiển thị với thông tin của chúng.

Trong một giao diện người dùng, các thành phần như nút bấm, các hộp thoại, thanh điều hướng có thể là các phần tử riêng biệt hoặc nhóm lại thành các phần tử phức tạp hơn. Composite Design Pattern có thể giúp bạn tổ chức các phần tử UI này vào các nhóm hợp lý mà không cần phải thay đổi cách thức hoạt động của chúng.

Hãy áp dụng Composite Design Pattern để giải bài toán trên.
Yêu cầu: vẽ sơ đồ trước khi viết code.

Khi giá của một cổ phiếu thay đổi, các nhà đầu tư đã đăng ký để theo dõi cổ phiếu đó sẽ nhận thông báo ngay lập tức về sự thay

Trong một dự án phần mềm, khi có sự thay đổi về tình trạng hoặc trạng thái công việc (task), các thành viên trong nhóm sẽ nhận được thông báo tự động để theo dõi tiến độ.

Hãy áp dụng Observer Design Pattern vào các trường hợp trên
Yêu cầu: vẽ sơ đồ trước khi viết code.

Một dịch vụ web yêu cầu đầu vào ở định dạng JSON, nhưng một hệ thống khác chỉ hỗ trợ XML. Bạn có thể viết một adapter để chuyển đổi dữ liệu từ XML sang JSON và ngược lại.

Hãy áp dụng Adapter Design Pattern vào trường hợp trên
Yêu cầu: vẽ sơ đồ trước khi viết code.


**Bài tập: Thiết kế hệ thống quản lý thư viện sử dụng các Design Pattern**

Đề bài: Bạn đang xây dựng một hệ thống quản lý thư viện. Hệ thống này sẽ cho phép người dùng thực hiện các chức năng cơ bản như: mượn sách, trả sách, thêm sách mới vào thư viện, xem danh sách sách có sẵn, tìm kiếm sách theo tên, tác giả và thể loại. Hệ thống sẽ được phát triển với nhiều thành phần và có thể mở rộng trong tương lai.

Hãy sử dụng các Design Patterns phù hợp để xây dựng hệ thống này. Các yêu cầu chi tiết như sau:

**1. Singleton Pattern:**
Xây dựng một đối tượng Library để quản lý tất cả các sách trong thư viện. Đảm bảo rằng chỉ có một đối tượng duy nhất của Library trong hệ thống (chỉ có một thư viện duy nhất).

**2. Factory Method Pattern:**
Khi thêm sách mới vào thư viện, bạn có thể chọn loại sách (sách giấy, sách điện tử, sách nói, v.v.). Hãy sử dụng Factory Method để tạo ra các loại sách khác nhau.

**3. Strategy Pattern:**
Xây dựng các chiến lược tìm kiếm sách khác nhau (tìm kiếm theo tên, theo tác giả, theo thể loại). Dựa vào lựa chọn của người dùng, chiến lược tìm kiếm sẽ được thay đổi.

**4. Observer Pattern:**
Khi có sách mới hoặc sách đã hết hạn mượn, hệ thống sẽ gửi thông báo cho những người quan tâm (ví dụ: các nhân viên thư viện hoặc những người dùng đã đăng ký theo dõi). Hãy sử dụng Observer Pattern để xử lý việc này.

**5. Decorator Pattern:**
Cho phép người dùng mượn sách với các tính năng bổ sung như gia hạn thời gian mượn, hay yêu cầu sách với phiên bản đặc biệt (sách có chữ nổi, sách có bản dịch, v.v.). Sử dụng Decorator Pattern để mở rộng các tính năng của việc mượn sách mà không thay đổi các lớp sách cơ bản.