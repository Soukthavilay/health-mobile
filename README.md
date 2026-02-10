# Smart Health Assistant - Mobile

## Yêu cầu

- Node.js (khuyến nghị 18+)
- Expo CLI (được cài qua `npx expo ...` là đủ)
- Điện thoại có Expo Go hoặc iOS Simulator/Android Emulator

## Cài đặt

```bash
npm install
```

## Cấu hình API Base URL

App gọi backend qua biến môi trường Expo:

- `EXPO_PUBLIC_API_BASE_URL`

Tạo file `.env` tại `mobile/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

Ghi chú:

- Nếu chạy trên **điện thoại thật**, bạn cần dùng **IP LAN** của máy chạy backend:
  - Ví dụ: `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:4000/api`
- Backend mặc định chạy port `4000`.

## Chạy mobile

```bash
npm start
```

Một số lệnh tiện:

```bash
npm run ios
npm run android
```

## Troubleshooting

### Lỗi không navigate được (route name)

Nếu thấy warning kiểu `NAVIGATE ... was not handled`, hãy kiểm tra route name đã đăng ký trong `src/navigation/RootNavigator.js` và dùng đúng `navigation.navigate('<RouteName>')`.

### Notifications

`expo-notifications` có giới hạn trên Expo Go (đặc biệt push notifications). Nếu cần push/notification đầy đủ, nên dùng Development Build (dev-client).
