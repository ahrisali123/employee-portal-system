"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { logout as apiLogout } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { Avatar } from "@/components/Avatar";

function getCurrentNav(pathname: string): string {
  if (pathname === "/my-tickets") return "my";
  if (pathname === "/new-ticket") return "new";
  if (pathname === "/tickets/pending") return "pending";
  if (pathname === "/tickets" || pathname.startsWith("/tickets/")) return "all";
  if (pathname === "/announcements/new") return "announce-new";
  if (pathname === "/announcements" || pathname.startsWith("/announcements/"))
    return "announce";
  return "";
}

function getBreadcrumbs(pathname: string): string[] {
  const base = ["社内ポータル"];
  if (pathname === "/my-tickets") base.push("マイチケット");
  else if (pathname === "/new-ticket") base.push("新規申請");
  else if (pathname === "/tickets/pending") base.push("承認待ち");
  else if (pathname === "/tickets") base.push("すべてのチケット");
  else if (pathname.startsWith("/tickets/")) {
    base.push("チケット");
    base.push("詳細");
  } else if (pathname === "/announcements/new") base.push("お知らせ作成");
  else if (pathname === "/announcements") base.push("お知らせ");
  else if (pathname.startsWith("/announcements/")) {
    base.push("お知らせ");
    base.push("詳細");
  }
  return base;
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, switchRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const current = getCurrentNav(pathname);
  const crumbs = getBreadcrumbs(pathname);

  const handleLogout = async () => {
    try {
      await apiLogout(user.accessToken, user.refreshToken);
    } catch {
      alert("ログアウトに失敗しました。");
    }
    logout();
    router.replace("/login");
  };

  const empNav = [
    { key: "my", label: "マイチケット", icon: "inbox", href: "/my-tickets" },
    { key: "new", label: "新規申請", icon: "plus", href: "/new-ticket" },
    {
      key: "announce",
      label: "お知らせ",
      icon: "megaphone",
      href: "/announcements",
    },
  ];
  const admNav = [
    { key: "all", label: "すべてのチケット", icon: "list", href: "/tickets" },
    {
      key: "pending",
      label: "承認待ち",
      icon: "inbox",
      href: "/tickets/pending",
    },
    {
      key: "announce",
      label: "お知らせ",
      icon: "megaphone",
      href: "/announcements",
    },
    {
      key: "announce-new",
      label: "お知らせ作成",
      icon: "plus",
      href: "/announcements/new",
    },
  ];
  const navItems = user.activeRole === "ADMIN" ? admNav : empNav;

  return (
    <div
      className="grid min-h-screen"
      style={{ gridTemplateColumns: "240px 1fr" }}
    >
      {/* サイドバー */}
      <aside className="bg-bg-sidebar border-r border-line px-3.5 py-[18px] flex flex-col gap-1 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-2 pb-[18px] pt-1.5">
          <div className="w-7 h-7 bg-ink text-[#F4F2EC] grid place-items-center font-en font-bold text-[13px] rounded-[5px]">
            社
          </div>
          <div className="text-[13.5px] font-semibold tracking-[0.02em]">
            社内ポータル
            <small className="block text-[10px] font-mono text-ink-3 font-medium tracking-[0.04em] mt-px">
              SHANAI PORTAL
            </small>
          </div>
        </div>

        <div className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-4 px-2.5 pt-3.5 pb-1.5">
          {user.activeRole === "ADMIN" ? "管理者メニュー" : "メニュー"}
        </div>

        {navItems.map((it) => {
          const active = current === it.key;
          return (
            <button
              key={it.key}
              className={`flex items-center gap-2.5 px-2.5 py-[7px] rounded text-[13.5px] font-medium cursor-pointer bg-transparent border-none w-full text-left transition-colors duration-[0.08s] ${active ? "bg-bg-elev text-ink shadow-card nav-active" : "text-ink-2 hover:bg-bg-hover hover:text-ink"}`}
              onClick={() => router.push(it.href)}
            >
              <span className="relative inline-flex">
                <Icon name={it.icon} size={15} />
              </span>
              <span>{it.label}</span>
            </button>
          );
        })}

        <div className="mt-auto pt-2.5 pb-1 border-t border-line flex justify-between text-[11px] font-mono text-ink-4 px-1">
          <span>{user.activeRole === "ADMIN" ? "ADMIN" : "EMP"} · JP</span>
          <span>v1.0.0</span>
        </div>
      </aside>

      {/* メイン */}
      <main className="flex flex-col min-w-0">
        {/* トップバー */}
        <div className="flex items-center justify-between px-8 py-3.5 border-b border-line bg-bg sticky top-0 z-10">
          <div className="flex items-center gap-2 text-[12.5px] text-ink-3">
            {crumbs.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-2">
                {i > 0 && <span className="text-ink-5">/</span>}
                <span
                  className={
                    i === crumbs.length - 1 ? "text-ink font-medium" : ""
                  }
                >
                  {c}
                </span>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2.5">
            {user.roles.length > 1 && (
              <div
                className="inline-flex bg-bg-elev border border-line rounded overflow-hidden"
                title="ロール切替"
              >
                {(["EMPLOYEE", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`border-none px-2.5 py-1 text-[10.5px] font-mono font-semibold tracking-[0.06em] transition-colors ${user.activeRole === r ? "bg-ink text-[#F4F2EC]" : "bg-transparent text-ink-3 hover:bg-bg-hover hover:text-ink"}`}
                    onClick={() => {
                      switchRole(r);
                      router.push(r === "ADMIN" ? "/tickets" : "/my-tickets");
                    }}
                  >
                    {r === "ADMIN" ? "管理者用" : "社員用"}
                  </button>
                ))}
              </div>
            )}
            <div className="min-w-[105px] flex items-center gap-2.5 px-1 pr-2.5 border border-line bg-bg-elev rounded-full">
              <Avatar name={user.name} />
              <div className="leading-[1.2]">
                <div className="text-[12.5px] font-medium">{user.name}</div>
                <div className="text-[10px] text-ink-3 font-mono tracking-[0.04em]">
                  {user.activeRole}
                </div>
                <div className="text-[10px] text-ink-3 font-mono tracking-[0.04em]">
                  {user.departmentName}
                </div>
              </div>
            </div>
            <button
              className="inline-flex items-center justify-center p-1.5 rounded border border-line bg-bg-elev text-ink-2 hover:bg-bg-hover hover:text-ink transition-colors"
              onClick={handleLogout}
              title="ログアウト"
            >
              <Icon name="logout" size={15} />
            </button>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}
