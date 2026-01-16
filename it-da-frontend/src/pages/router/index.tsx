import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/pages/home/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import AIMatchingPage from "@/pages/ai/AiMatchingPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import OAuth2CallbackPage from "@/pages/auth/OAuth2CallbackPage";
import ChatRoomPage from "@/pages/chat/ChatRoomPage";
import CategoryListPage from "@/pages/category/CategoryListPage";
import CategoryDetailPage from "@/pages/category/CategoryDetailPage";
import MeetingListPage from "@/pages/meeting/MeetingListPage";
import MeetingDetailPage from "@/pages/meeting/MeetingDetailPage";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <HomePage />,
    },
    {
      path: "/login",
      element: (
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      ),
    },
    {
      path: "/signup",
      element: (
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      ),
    },
    {
      path: "/ai-matching",
      element: <AIMatchingPage />,
    },
      {
          path: "/category",
          element: <CategoryListPage />,
      },
      {
          path: "/category/:category",
          element: <CategoryDetailPage />,
      },
      {
          path: "/meetings",
          element: <MeetingListPage />,
      },
      {
          path: "/meeting/:id",
          element: <MeetingDetailPage />,
      },
    // {
    //   path: "/auth/callback/:provider",
    //   element: <OAuth2CallbackPage />,
    // },
    // {
    //   path: "/chat/:roomId",
    //   element: (
    //     <ProtectedRoute>
    //       <ChatRoomPage />
    //     </ProtectedRoute>
    //   ),
    // },
  ],

  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  } as any
);
