import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <div>취미메이트 - 홈페이지</div>,
  },
  {
    path: "/login",
    element: <div>로그인 페이지</div>,
  },
  {
    path: "/signup",
    element: <div>회원가입 페이지</div>,
  },
  {
    path: "*",
    element: <div>404 - 페이지를 찾을 수 없습니다</div>,
  },
]);

export default router;
