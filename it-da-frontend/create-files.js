// create-files.js
// Node.js 파일 생성 스크립트

const fs = require('fs');
const path = require('path');

const files = {
  // Pages
  'src/pages/auth/LoginPage.tsx': '',
  'src/pages/auth/SignupPage.tsx': '',
  'src/pages/auth/OAuth2CallbackPage.tsx': '',
  'src/pages/home/HomePage.tsx': '',
  'src/pages/meeting/MeetingListPage.tsx': '',
  'src/pages/meeting/MeetingDetailPage.tsx': '',
  'src/pages/meeting/MeetingCreatePage.tsx': '',
  'src/pages/meeting/MeetingCompletePage.tsx': '',
  'src/pages/category/CategoryListPage.tsx': '',
  'src/pages/category/CategoryDetailPage.tsx': '',
  'src/pages/ai/AiMatchingPage.tsx': '',
  'src/pages/chat/ChatPreviewPage.tsx': '',
  'src/pages/chat/ChatRoomPage.tsx': '',
  'src/pages/mypage/MyPage.tsx': '',
  'src/pages/mypage/MyMeetingsPage.tsx': '',
  'src/pages/mypage/SettingsPage.tsx': '',
  'src/pages/support/CustomerServicePage.tsx': '',
  'src/pages/error/NotFoundPage.tsx': '',

  // Components
  'src/components/layout/Header.tsx': '',
  'src/components/layout/Footer.tsx': '',
  'src/components/layout/MainLayout.tsx': '',
  'src/components/common/Button.tsx': '',
  'src/components/common/Input.tsx': '',
  'src/components/common/Modal.tsx': '',
  'src/components/common/Loading.tsx': '',
  'src/components/auth/LoginForm.tsx': '',
  'src/components/meeting/MeetingCard.tsx': '',
  'src/components/meeting/MeetingGrid.tsx': '',
  'src/components/chat/ChatMessage.tsx': '',
  'src/components/chat/ChatInput.tsx': '',

  // Stores
  'src/stores/useAuthStore.ts': '',
  'src/stores/useMeetingStore.ts': '',
  'src/stores/useChatStore.ts': '',
  'src/stores/useNotificationStore.ts': '',
  'src/stores/useModalStore.ts': '',
  'src/stores/index.ts': '',

  // Hooks
  'src/hooks/auth/useLogin.ts': '',
  'src/hooks/auth/useSignup.ts': '',
  'src/hooks/auth/useLogout.ts': '',
  'src/hooks/meeting/useMeetings.ts': '',
  'src/hooks/meeting/useMeeting.ts': '',
  'src/hooks/meeting/useCreateMeeting.ts': '',
  'src/hooks/chat/useChatRoom.ts': '',
  'src/hooks/chat/useWebSocket.ts': '',

  // API
  'src/api/client.ts': '',
  'src/api/auth.api.ts': '',
  'src/api/meeting.api.ts': '',
  'src/api/chat.api.ts': '',

  // Types
  'src/types/auth.types.ts': '',
  'src/types/meeting.types.ts': '',
  'src/types/chat.types.ts': '',
  'src/types/common.types.ts': '',
  'src/types/index.ts': '',

  // Utils
  'src/utils/format.ts': '',
  'src/utils/validation.ts': '',
  'src/utils/constants.ts': '',

  // Router
  'src/router/index.tsx': '',
  'src/router/ProtectedRoute.tsx': '',
  'src/router/PublicRoute.tsx': '',

  // Styles
  'src/styles/globals.css': '',
  'src/styles/variables.css': '',
};

let created = 0;
let skipped = 0;

console.log('📝 React 프로젝트 파일 생성 중...\n');

Object.keys(files).forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`⏭️  ${filePath} (이미 존재)`);
    skipped++;
  } else {
    fs.writeFileSync(fullPath, files[filePath], 'utf8');
    console.log(`✅ ${filePath}`);
    created++;
  }
});

console.log('\n========================================');
console.log('✨ 파일 생성 완료!');
console.log('========================================');
console.log(`📄 생성: ${created}개`);
console.log(`⏭️  건너뜀: ${skipped}개`);
console.log('========================================');
