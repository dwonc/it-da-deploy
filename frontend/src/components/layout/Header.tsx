// src/components/layout/Header.tsx
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  useProfileWebSocket,
  ProfileUpdate,
} from "@/hooks/auth/useProfileWebSocket";
import { useCallback, useState, useEffect } from "react";
import NotificationDropdown from "../../pages/mypage/components/NotificationDropdown";
import "./Header.css";

const Header = () => {
  const { user } = useAuthStore();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileImage(user.profileImageUrl || null);
      setUsername(user.username || "");
    }
  }, [user]);

  // 모바일 메뉴 열릴 때 스크롤 방지
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleProfileUpdate = useCallback((update: ProfileUpdate) => {
    if (update.type === "PROFILE_INFO_UPDATE") {
      if (update.profileImageUrl !== undefined) {
        setProfileImage(update.profileImageUrl);
      }
      if (update.username !== undefined) {
        setUsername(update.username);
      }
    }
  }, []);

  useProfileWebSocket({
    profileUserId: user?.userId,
    onProfileUpdate: handleProfileUpdate,
  });

  const getProfileImageUrl = () => {
    if (profileImage) {
      if (profileImage.startsWith("http")) {
        return profileImage;
      }
      return `${import.meta.env.VITE_API_URL || "https://api.it-da.cloud"}${profileImage}`;
    }
    return null;
  };

  const imageUrl = getProfileImageUrl();

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="header">
        <div className="header-content">
          {/* 로고 */}
          <Link to="/" className="logo" onClick={closeMenu}>
            IT-DA
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="nav-menu">
            <Link to="/meetings" className="nav-item">
              모임 찾기
            </Link>
            <Link to="/my-meetings" className="nav-item">
              내 모임
            </Link>
            <Link to="/meetings/create" className="nav-item">
              모임 만들기
            </Link>
            <Link to="/notices" className="nav-item">
              공지사항
            </Link>
          </nav>

          {/* 데스크톱 우측 영역 */}
          <div className="header-right">
            <NotificationDropdown />
            {user ? (
              <Link to="/mypage" className="user-profile-wrapper">
                <div className="user-avatar">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={username}
                      className="avatar-image"
                    />
                  ) : (
                    <span className="avatar-initial">
                      {username?.[0] || user.username?.[0] || "U"}
                    </span>
                  )}
                </div>
              </Link>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn-login">
                  로그인
                </Link>
                <Link to="/signup" className="btn-signup">
                  회원가입
                </Link>
              </div>
            )}
          </div>

          {/* 모바일 햄버거 버튼 */}
          <button
            className={`hamburger ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* 모바일 오버레이 */}
      {menuOpen && <div className="mobile-overlay" onClick={closeMenu} />}

      {/* 모바일 슬라이드 메뉴 */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <nav className="mobile-nav">
          <Link to="/meetings" className="mobile-nav-item" onClick={closeMenu}>
            모임 찾기
          </Link>
          <Link
            to="/my-meetings"
            className="mobile-nav-item"
            onClick={closeMenu}
          >
            내 모임
          </Link>
          <Link
            to="/meetings/create"
            className="mobile-nav-item"
            onClick={closeMenu}
          >
            모임 만들기
          </Link>
          <Link to="/notices" className="mobile-nav-item" onClick={closeMenu}>
            공지사항
          </Link>
        </nav>

        <div className="mobile-auth">
          {user ? (
            <Link
              to="/mypage"
              className="mobile-nav-item mobile-mypage"
              onClick={closeMenu}
            >
              <div className="user-avatar" style={{ width: 32, height: 32 }}>
                {imageUrl ? (
                  <img src={imageUrl} alt={username} className="avatar-image" />
                ) : (
                  <span
                    className="avatar-initial"
                    style={{ fontSize: "0.9rem" }}
                  >
                    {username?.[0] || user.username?.[0] || "U"}
                  </span>
                )}
              </div>
              마이페이지
            </Link>
          ) : (
            <div className="mobile-auth-buttons">
              <Link to="/login" className="btn-login" onClick={closeMenu}>
                로그인
              </Link>
              <Link to="/signup" className="btn-signup" onClick={closeMenu}>
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
