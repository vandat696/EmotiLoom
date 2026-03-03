# Sử dụng bản Node.js ổn định
FROM node:20

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy file quản lý thư viện vào trước
COPY package*.json ./

# Cài đặt các thư viện
RUN npm install

# Copy toàn bộ code vào trong container
COPY . .

# Mở cổng 5000 cho server
EXPOSE 5000

# Lệnh khởi chạy server
CMD ["node", "server.js"]