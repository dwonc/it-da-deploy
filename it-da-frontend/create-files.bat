@echo off
REM 취미메이트 프론트엔드 전체 파일 생성

echo 📝 React 프로젝트 파일 생성 중...

cd src

REM Pages
echo.
echo 📁 Pages 생성 중...
echo. > pages\auth\LoginPage.tsx
echo. > pages\auth\SignupPage.tsx
echo. > pages\auth\OAuth2CallbackPage.tsx
echo. > pages\home\HomePage.tsx
echo. > pages\meeting\MeetingListPage.tsx
echo. > pages\meeting\MeetingDetailPage.tsx
echo. > pages\meeting\MeetingCreatePage.tsx
echo. > pages\meeting\MeetingCompletePage.tsx
echo. > pages\category\CategoryListPage.tsx
echo. > pages\category\CategoryDetailPage.tsx
echo. > pages\ai\AiMatchingPage.tsx
echo. > pages\chat\ChatPreviewPage.tsx
echo. > pages\chat\ChatRoomPage.tsx
echo. > pages\mypage\MyPage.tsx
echo. > pages\mypage\MyMeetingsPage.tsx
echo. > pages\mypage\SettingsPage.tsx
echo. > pages\support\CustomerServicePage.tsx
echo. > pages\error\NotFoundPage.tsx
echo ✅ Pages 생성 완료

REM Components
echo.
echo 📁 Components 생성 중...
echo. > components\layout\Header.tsx
echo. > components\layout\Footer.tsx
echo. > components\layout\MainLayout.tsx
echo. > components\common\Button.tsx
echo. > components\common\Input.tsx
echo. > components\common\Modal.tsx
echo. > components\common\Loading.tsx
echo. > components\auth\LoginForm.tsx
echo. > components\meeting\MeetingCard.tsx
echo. > components\meeting\MeetingGrid.tsx
echo. > components\chat\ChatMessage.tsx
echo. > components\chat\ChatInput.tsx
echo ✅ Components 생성 완료

REM Stores
echo.
echo 📁 Stores 생성 중...
echo. > stores\useAuthStore.ts
echo. > stores\useMeetingStore.ts
echo. > stores\useChatStore.ts
echo. > stores\useNotificationStore.ts
echo. > stores\useModalStore.ts
echo. > stores\index.ts
echo ✅ Stores 생성 완료

REM Hooks
echo.
echo 📁 Hooks 생성 중...
echo. > hooks\auth\useLogin.ts
echo. > hooks\auth\useSignup.ts
echo. > hooks\auth\useLogout.ts
echo. > hooks\meeting\useMeetings.ts
echo. > hooks\meeting\useMeeting.ts
echo. > hooks\meeting\useCreateMeeting.ts
echo. > hooks\chat\useChatRoom.ts
echo. > hooks\chat\useWebSocket.ts
echo ✅ Hooks 생성 완료

REM API
echo.
echo 📁 API 생성 중...
echo. > api\client.ts
echo. > api\auth.api.ts
echo. > api\meeting.api.ts
echo. > api\chat.api.ts
echo. > api\user.api.ts
echo ✅ API 생성 완료

REM Types
echo.
echo 📁 Types 생성 중...
echo. > types\auth.types.ts
echo. > types\meeting.types.ts
echo. > types\chat.types.ts
echo. > types\common.types.ts
echo. > types\index.ts
echo ✅ Types 생성 완료

REM Utils
echo.
echo 📁 Utils 생성 중...
echo. > utils\format.ts
echo. > utils\validation.ts
echo. > utils\constants.ts
echo ✅ Utils 생성 완료

REM Router
echo.
echo 📁 Router 생성 중...
echo. > router\index.tsx
echo. > router\ProtectedRoute.tsx
echo. > router\PublicRoute.tsx
echo ✅ Router 생성 완료

REM Styles
echo.
echo 📁 Styles 생성 중...
echo. > styles\globals.css
echo. > styles\variables.css
echo ✅ Styles 생성 완료

cd ..

echo.
echo ========================================
echo ✨ 파일 생성 완료!
echo ========================================
pause
