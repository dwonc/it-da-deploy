# PowerShell Script: create-files.ps1
# 취미메이트 프론트엔드 전체 파일 생성 스크립트

Write-Host "📝 React 프로젝트 파일 생성 중..." -ForegroundColor Cyan

# 현재 위치 확인
if (-not (Test-Path ".\src")) {
    Write-Host "❌ src 폴더를 찾을 수 없습니다. 프로젝트 루트에서 실행하세요." -ForegroundColor Red
    exit 1
}

cd src

# ===========================================
# 1. Pages 폴더 파일 생성
# ===========================================
Write-Host "`n📁 Pages 생성 중..." -ForegroundColor Yellow

# Auth Pages
New-Item -ItemType File -Path "pages\auth\LoginPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\auth\SignupPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\auth\OAuth2CallbackPage.tsx" -Force | Out-Null

# Home
New-Item -ItemType File -Path "pages\home\HomePage.tsx" -Force | Out-Null

# Meeting Pages
New-Item -ItemType File -Path "pages\meeting\MeetingListPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\meeting\MeetingDetailPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\meeting\MeetingCreatePage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\meeting\MeetingCompletePage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\meeting\MeetingEditPage.tsx" -Force | Out-Null

# Category Pages
New-Item -ItemType File -Path "pages\category\CategoryListPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\category\CategoryDetailPage.tsx" -Force | Out-Null

# AI Page
New-Item -ItemType File -Path "pages\ai\AiMatchingPage.tsx" -Force | Out-Null

# Chat Pages
New-Item -ItemType File -Path "pages\chat\ChatPreviewPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\chat\ChatRoomPage.tsx" -Force | Out-Null

# MyPage
New-Item -ItemType File -Path "pages\mypage\MyPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\mypage\MyMeetingsPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\mypage\MyReviewsPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\mypage\MyBadgesPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\mypage\SettingsPage.tsx" -Force | Out-Null

# Support
New-Item -ItemType File -Path "pages\support\CustomerServicePage.tsx" -Force | Out-Null

# Error Pages
New-Item -ItemType File -Path "pages\error\NotFoundPage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "pages\error\ErrorPage.tsx" -Force | Out-Null

Write-Host "✅ Pages 생성 완료 (22개)" -ForegroundColor Green

# ===========================================
# 2. Components 폴더 파일 생성
# ===========================================
Write-Host "`n📁 Components 생성 중..." -ForegroundColor Yellow

# Layout
New-Item -ItemType File -Path "components\layout\Header.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\layout\Footer.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\layout\Sidebar.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\layout\MainLayout.tsx" -Force | Out-Null

# Common
New-Item -ItemType File -Path "components\common\Button.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\common\Input.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\common\Select.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\common\Modal.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\common\Loading.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\common\EmptyState.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\common\ErrorBoundary.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\common\Pagination.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\common\SearchBar.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\common\FAB.tsx" -Force | Out-Null

# Auth
New-Item -ItemType File -Path "components\auth\LoginForm.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\auth\SignupStepIndicator.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\auth\SocialLoginButtons.tsx" -Force | Out-Null

# Meeting
New-Item -ItemType File -Path "components\meeting\MeetingCard.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\meeting\MeetingGrid.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\meeting\MeetingFilter.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\meeting\MeetingForm.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\meeting\ParticipantList.tsx" -Force | Out-Null

# Chat
New-Item -ItemType File -Path "components\chat\ChatMessage.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\chat\ChatInput.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\chat\ChatMemberList.tsx" -Force | Out-Null

# Badge
New-Item -ItemType File -Path "components\badge\BadgeCard.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\badge\BadgeGrid.tsx" -Force | Out-Null
New-Item -ItemType File -Path "components\badge\BadgeProgress.tsx" -Force | Out-Null

Write-Host "✅ Components 생성 완료 (30개)" -ForegroundColor Green

# ===========================================
# 3. Stores (Zustand) 파일 생성
# ===========================================
Write-Host "`n📁 Stores (Zustand) 생성 중..." -ForegroundColor Yellow

New-Item -ItemType File -Path "stores\useAuthStore.ts" -Force | Out-Null
New-Item -ItemType File -Path "stores\useUserStore.ts" -Force | Out-Null
New-Item -ItemType File -Path "stores\useMeetingStore.ts" -Force | Out-Null
New-Item -ItemType File -Path "stores\useChatStore.ts" -Force | Out-Null
New-Item -ItemType File -Path "stores\useNotificationStore.ts" -Force | Out-Null
New-Item -ItemType File -Path "stores\useModalStore.ts" -Force | Out-Null
New-Item -ItemType File -Path "stores\index.ts" -Force | Out-Null

Write-Host "✅ Stores 생성 완료 (7개)" -ForegroundColor Green

# ===========================================
# 4. Hooks 파일 생성
# ===========================================
Write-Host "`n📁 Hooks 생성 중..." -ForegroundColor Yellow

# Auth Hooks
New-Item -ItemType File -Path "hooks\auth\useLogin.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\auth\useSignup.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\auth\useLogout.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\auth\useSocialLogin.ts" -Force | Out-Null

# Meeting Hooks
New-Item -ItemType File -Path "hooks\meeting\useMeetings.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\meeting\useMeeting.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\meeting\useCreateMeeting.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\meeting\useUpdateMeeting.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\meeting\useJoinMeeting.ts" -Force | Out-Null

# AI Hooks
New-Item -ItemType File -Path "hooks\ai\useAiRecommend.ts" -Force | Out-Null

# Chat Hooks
New-Item -ItemType File -Path "hooks\chat\useChatRoom.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\chat\useChatMessages.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\chat\useWebSocket.ts" -Force | Out-Null

# Common Hooks
New-Item -ItemType File -Path "hooks\common\useDebounce.ts" -Force | Out-Null
New-Item -ItemType File -Path "hooks\common\useLocalStorage.ts" -Force | Out-Null

Write-Host "✅ Hooks 생성 완료 (15개)" -ForegroundColor Green

# ===========================================
# 5. API 파일 생성
# ===========================================
Write-Host "`n📁 API 생성 중..." -ForegroundColor Yellow

New-Item -ItemType File -Path "api\client.ts" -Force | Out-Null
New-Item -ItemType File -Path "api\auth.api.ts" -Force | Out-Null
New-Item -ItemType File -Path "api\user.api.ts" -Force | Out-Null
New-Item -ItemType File -Path "api\meeting.api.ts" -Force | Out-Null
New-Item -ItemType File -Path "api\participation.api.ts" -Force | Out-Null
New-Item -ItemType File -Path "api\review.api.ts" -Force | Out-Null
New-Item -ItemType File -Path "api\chat.api.ts" -Force | Out-Null
New-Item -ItemType File -Path "api\ai.api.ts" -Force | Out-Null
New-Item -ItemType File -Path "api\badge.api.ts" -Force | Out-Null
New-Item -ItemType File -Path "api\notification.api.ts" -Force | Out-Null

Write-Host "✅ API 생성 완료 (10개)" -ForegroundColor Green

# ===========================================
# 6. Types 파일 생성
# ===========================================
Write-Host "`n📁 Types 생성 중..." -ForegroundColor Yellow

New-Item -ItemType File -Path "types\auth.types.ts" -Force | Out-Null
New-Item -ItemType File -Path "types\user.types.ts" -Force | Out-Null
New-Item -ItemType File -Path "types\meeting.types.ts" -Force | Out-Null
New-Item -ItemType File -Path "types\participation.types.ts" -Force | Out-Null
New-Item -ItemType File -Path "types\review.types.ts" -Force | Out-Null
New-Item -ItemType File -Path "types\chat.types.ts" -Force | Out-Null
New-Item -ItemType File -Path "types\badge.types.ts" -Force | Out-Null
New-Item -ItemType File -Path "types\notification.types.ts" -Force | Out-Null
New-Item -ItemType File -Path "types\common.types.ts" -Force | Out-Null
New-Item -ItemType File -Path "types\index.ts" -Force | Out-Null

Write-Host "✅ Types 생성 완료 (10개)" -ForegroundColor Green

# ===========================================
# 7. Utils 파일 생성
# ===========================================
Write-Host "`n📁 Utils 생성 중..." -ForegroundColor Yellow

New-Item -ItemType File -Path "utils\format.ts" -Force | Out-Null
New-Item -ItemType File -Path "utils\validation.ts" -Force | Out-Null
New-Item -ItemType File -Path "utils\storage.ts" -Force | Out-Null
New-Item -ItemType File -Path "utils\distance.ts" -Force | Out-Null
New-Item -ItemType File -Path "utils\constants.ts" -Force | Out-Null

Write-Host "✅ Utils 생성 완료 (5개)" -ForegroundColor Green

# ===========================================
# 8. Router 파일 생성
# ===========================================
Write-Host "`n📁 Router 생성 중..." -ForegroundColor Yellow

New-Item -ItemType File -Path "router\index.tsx" -Force | Out-Null
New-Item -ItemType File -Path "router\ProtectedRoute.tsx" -Force | Out-Null
New-Item -ItemType File -Path "router\PublicRoute.tsx" -Force | Out-Null

Write-Host "✅ Router 생성 완료 (3개)" -ForegroundColor Green

# ===========================================
# 9. Styles 파일 생성
# ===========================================
Write-Host "`n📁 Styles 생성 중..." -ForegroundColor Yellow

New-Item -ItemType File -Path "styles\globals.css" -Force | Out-Null
New-Item -ItemType File -Path "styles\variables.css" -Force | Out-Null
New-Item -ItemType File -Path "styles\reset.css" -Force | Out-Null

Write-Host "✅ Styles 생성 완료 (3개)" -ForegroundColor Green

cd ..

# ===========================================
# 요약
# ===========================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✨ 파일 생성 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📄 Pages: 22개" -ForegroundColor White
Write-Host "🧩 Components: 30개" -ForegroundColor White
Write-Host "📦 Stores: 7개" -ForegroundColor White
Write-Host "🪝 Hooks: 15개" -ForegroundColor White
Write-Host "🌐 API: 10개" -ForegroundColor White
Write-Host "📝 Types: 10개" -ForegroundColor White
Write-Host "🛠️  Utils: 5개" -ForegroundColor White
Write-Host "🗺️  Router: 3개" -ForegroundColor White
Write-Host "🎨 Styles: 3개" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 총 105개 파일 생성!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
