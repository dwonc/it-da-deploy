// src/pages/mypage/MyBadgesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useBadges } from "@/hooks/badge/useBadges";
import type { UserBadgeDto } from "@/types/badge";
import BadgeGrid from "@/components/badge/BadgeGrid";
import BadgeDetailModal from "@/components/badge/BadgeDetailModal";
import { getBadgeEmoji } from "@/utils/badge/getBadgeEmoji";

type Tab = "EARNED" | "LOCKED";

function safeNumber(v: unknown, fallback = 0): number {
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function parseUnlockedAt(b: UserBadgeDto): number {
    if (!b.unlockedAt) return 0;
    const t = Date.parse(b.unlockedAt);
    return Number.isFinite(t) ? t : 0;
}

export default function MyBadgesPage(): React.ReactElement {
    const navigate = useNavigate();
    const location = useLocation();

    const { data, isLoading, isError, refetch } = useBadges();
    const badges: UserBadgeDto[] = Array.isArray(data) ? (data as UserBadgeDto[]) : [];

    const [tab, setTab] = useState<Tab>("EARNED");
    const [selected, setSelected] = useState<UserBadgeDto | null>(null);
    const [open, setOpen] = useState<boolean>(false);

    // ✅ 이 페이지에서만 강제로 "풀폭 + 흰 배경" + "가운데 몰림 방지"
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;
        const root = document.getElementById("root");

        const prevHtmlBg = html.style.background;
        const prevBodyBg = body.style.background;
        const prevBodyMargin = body.style.margin;
        const prevBodyWidth = body.style.width;

        const prevRootMaxWidth = root?.style.maxWidth ?? "";
        const prevRootWidth = root?.style.width ?? "";
        const prevRootMargin = root?.style.margin ?? "";
        const prevRootDisplay = root?.style.display ?? "";
        const prevRootJustify = root?.style.justifyContent ?? "";
        const prevRootAlign = root?.style.alignItems ?? "";

        html.style.background = "#f6f7fb";
        body.style.background = "#f6f7fb";
        body.style.margin = "0";
        body.style.width = "100%";

        if (root) {
            root.style.maxWidth = "none";
            root.style.width = "100%";
            root.style.margin = "0";
            root.style.display = "block";
            // ✅ 어떤 레이아웃이 와도 가운데 몰림 방지용 초기화
            root.style.justifyContent = "initial";
            root.style.alignItems = "initial";
        }

        return () => {
            html.style.background = prevHtmlBg;
            body.style.background = prevBodyBg;
            body.style.margin = prevBodyMargin;
            body.style.width = prevBodyWidth;

            if (root) {
                root.style.maxWidth = prevRootMaxWidth;
                root.style.width = prevRootWidth;
                root.style.margin = prevRootMargin;
                root.style.display = prevRootDisplay;
                root.style.justifyContent = prevRootJustify;
                root.style.alignItems = prevRootAlign;
            }
        };
    }, []);

    const earned = useMemo(() => badges.filter((b) => b.unlocked === true), [badges]);
    const locked = useMemo(() => badges.filter((b) => b.unlocked !== true), [badges]);

    const recentTop3 = useMemo(() => {
        return earned
            .slice()
            .sort((a, b) => {
                const bt = parseUnlockedAt(b);
                const at = parseUnlockedAt(a);
                if (bt !== at) return bt - at;

                const bid = safeNumber(b.badgeId, 0);
                const aid = safeNumber(a.badgeId, 0);
                return bid - aid;
            })
            .slice(0, 3);
    }, [earned]);

    const list = tab === "EARNED" ? earned : locked;

    function handleClickBadge(b: UserBadgeDto) {
        setSelected(b);
        setOpen(true);
    }

    function handleCloseModal() {
        setOpen(false);
        setSelected(null);
    }

    // ✅ 핵심: "뒤로가기"가 히스토리 없으면 /badges로 보내기 (먹통/무한반복 방지)
    function handleBack() {
        if (window.history.length <= 1 || location.key === "default") {
            navigate("/badges", { replace: true });
            return;
        }
        navigate(-1);
    }

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <header style={styles.header}>
                    <div style={styles.headerLeft}>
                        {/* ✅ 전역 CSS가 color를 죽여도 안 사라지게: SVG path에 색 직접 지정 */}
                        <button
                            type="button"
                            style={styles.backBtn}
                            onClick={handleBack}
                            aria-label="뒤로가기"
                            title="뒤로가기"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                style={{ display: "block" }}
                            >
                                <path
                                    d="M15 18L9 12L15 6"
                                    stroke="#111827" // ✅ currentColor 금지
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    </div>

                    <h1 style={styles.title}>도감</h1>

                    <div style={styles.headerRight}>
                        <button type="button" onClick={() => void refetch()} style={styles.primaryBtn}>
                            새로고침
                        </button>
                    </div>
                </header>

                <section style={{ marginTop: 18 }}>
                    <h2 style={styles.sectionTitle}>최근 획득</h2>

                    {isLoading && <div style={styles.infoBox}>불러오는 중...</div>}
                    {!isLoading && isError && <div style={styles.errorBox}>불러오기에 실패했습니다.</div>}

                    {!isLoading && !isError && (
                        <div style={styles.recentGrid}>
                            {recentTop3.length === 0 ? (
                                <div style={styles.infoBox}>아직 획득한 배지가 없습니다.</div>
                            ) : (
                                recentTop3.map((b) => (
                                    <button
                                        key={String(b.badgeId ?? b.badgeCode)}
                                        type="button"
                                        onClick={() => handleClickBadge(b)}
                                        style={styles.recentCard}
                                    >
                                        <div style={styles.recentTop}>
                                            <div style={styles.recentIcon}>{getBadgeEmoji(b)}</div>
                                            <div style={styles.recentName}>{b.badgeName ?? ""}</div>
                                        </div>
                                        {b.description ? <div style={styles.recentDesc}>{b.description}</div> : null}
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </section>

                <section style={{ marginTop: 22 }}>
                    <div style={styles.tabs}>
                        <button
                            type="button"
                            onClick={() => setTab("EARNED")}
                            style={{ ...styles.tabBtn, ...(tab === "EARNED" ? styles.tabBtnActive : null) }}
                        >
                            획득 ({earned.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("LOCKED")}
                            style={{ ...styles.tabBtn, ...(tab === "LOCKED" ? styles.tabBtnActive : null) }}
                        >
                            미획득 ({locked.length})
                        </button>
                    </div>

                    <div style={{ marginTop: 14 }}>
                        {!isLoading && !isError && <BadgeGrid badges={list} onBadgeClick={handleClickBadge} />}
                    </div>
                </section>

                <BadgeDetailModal open={open} badge={selected} onClose={handleCloseModal} />
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    page: {
        minHeight: "100vh",
        width: "100%",
        background: "#f6f7fb",
        color: "#111",
    },

    container: {
        width: "100%",
        maxWidth: 1440,
        margin: "0 auto",
        padding: "28px 32px",
        boxSizing: "border-box",
    },

    header: {
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 12,
        width: "100%",
    },

    headerLeft: {
        minWidth: 0,
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
    },

    headerRight: {
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
    },

    title: {
        margin: 0,
        textAlign: "center",
        fontSize: 30,
        fontWeight: 900,
        letterSpacing: -0.4,
        lineHeight: 1.1,
    },

    // ✅ 버튼 자체는 보이는데 아이콘만 사라지는 케이스 방지(레이아웃/색 안정)
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
    },

    primaryBtn: {
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        color: "#111",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
        whiteSpace: "nowrap",
    },

    sectionTitle: { margin: "10px 0 12px 0", fontSize: 14, fontWeight: 900, color: "#111827" },

    infoBox: {
        padding: 12,
        fontSize: 13,
        color: "#6b7280",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
    },

    errorBox: {
        padding: 12,
        fontSize: 13,
        fontWeight: 900,
        color: "#b91c1c",
        background: "#fff5f5",
        border: "1px solid #fecaca",
        borderRadius: 12,
    },

    recentGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 12,
        width: "100%",
    },

    recentCard: {
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        borderRadius: 14,
        padding: 14,
        textAlign: "left",
        cursor: "pointer",
        color: "#111",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    },

    recentTop: { display: "flex", alignItems: "center", gap: 10 },
    recentIcon: { fontSize: 26, lineHeight: 1 },
    recentName: { fontWeight: 900, fontSize: 14, color: "#111827" },
    recentDesc: { marginTop: 8, fontSize: 13, color: "#4b5563", lineHeight: 1.4 },

    tabs: { display: "flex", gap: 8, flexWrap: "wrap" },

    tabBtn: {
        padding: "8px 12px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        color: "#374151",
        fontWeight: 900,
        cursor: "pointer",
        opacity: 0.9,
    },

    tabBtnActive: { background: "#111827", border: "1px solid #111827", color: "#ffffff", opacity: 1 },
};
