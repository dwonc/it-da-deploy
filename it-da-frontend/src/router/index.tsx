import React from "react";
import { createBrowserRouter } from "react-router-dom";
import MyBadgesPage from "@/pages/mypage/MyBadgesPage";
import BadgeCatalogPage from "@/pages/badge/BadgeCatalogPage";

const router = createBrowserRouter([
    { path: "/", element: React.createElement("div", null, "홈") },

    // ✅ 도감: 흰 배경 + 풀폭
    { path: "/badges", element: React.createElement(BadgeCatalogPage) },

    // ✅ 마이페이지 뱃지: 기존 그대로
    { path: "/mypage/badges", element: React.createElement(MyBadgesPage) },

    { path: "*", element: React.createElement("div", null, "404 - 페이지를 찾을 수 없습니다") },
]);

export default router;
