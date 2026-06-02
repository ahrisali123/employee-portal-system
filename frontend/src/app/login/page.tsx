"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { login as apiLogin } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      login(data);
      router.replace(data.role.includes("ADMIN") ? "/tickets" : "/my-tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
  };

  return (
    <div
      className="min-h-screen grid bg-bg"
      style={{ gridTemplateColumns: "1fr 1fr" }}
    >
      {/* ブランドパネル */}
      <div className="login-brand bg-ink text-[#F4F2EC] p-12 flex flex-col justify-between">
        <div className="flex items-center gap-3 relative">
          <div className="w-8 h-8 border border-[#F4F2EC] border-[1.5px] grid place-items-center font-en font-bold text-sm tracking-[-0.02em]">
            社
          </div>
          <div className="text-[13px] tracking-[0.04em] font-medium uppercase font-en">
            Shanai Portal
          </div>
        </div>
        <div className="relative max-w-[440px]">
          <h1 className="text-[38px] font-semibold leading-[1.3] m-0 mb-5 tracking-[-0.01em]">
            申請から承認まで、
            <br />
            すべてをひとつの画面で。
          </h1>
          <p className="text-[rgba(244,242,236,0.6)] text-sm leading-[1.7] m-0">
            休暇申請、出張、経費精算、研修参加 ──
            社内の手続きを統一されたワークフローで管理します。
            承認状況はリアルタイムで反映され、いつでも進捗を確認できます。
            さらに、お知らせ機能により、社内情報を迅速かつ確実に共有します。
          </p>
        </div>
        <div className="relative flex justify-between text-[11px] font-mono text-[rgba(244,242,236,0.4)]">
          <span>V {currentVersion}</span>
        </div>
      </div>

      {/* フォームパネル */}
      <div className="flex items-center justify-center p-12">
        <form className="w-full max-w-[360px]" onSubmit={submit}>
          <h2 className="text-[22px] font-semibold m-0 mb-1.5 tracking-[-0.005em]">
            ログイン
          </h2>
          <p className="text-ink-3 text-[13px] m-0 mb-7">
            登録メールアドレスとパスワードを入力してください。
          </p>

          {error && (
            <div className="mb-3 px-3 py-2.5 bg-status-rejected-bg border border-status-rejected-dot rounded text-[13px] text-status-rejected-fg">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              メールアドレス
            </label>
            <input
              className="w-full bg-bg-elev border border-line rounded py-[9px] px-3 text-ink outline-none transition-[border-color,box-shadow] duration-[0.12s] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-bg)]"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-ink-2 mb-1.5">
              パスワード
            </label>
            <input
              className="w-full bg-bg-elev border border-line rounded py-[9px] px-3 text-ink outline-none transition-[border-color,box-shadow] duration-[0.12s] focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-bg)]"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center py-[11px] px-3.5 rounded border border-ink bg-ink text-[#F4F2EC] font-medium text-[13px] transition-colors hover:bg-[#2A2A28] hover:border-[#2A2A28] disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>

          <div className="mt-5 p-3.5 bg-bg-subtle border border-line rounded text-xs">
            <div className="font-semibold mb-2 text-ink-2">デモアカウント</div>
            <div className="flex justify-between font-mono text-ink-3 py-0.5">
              <span>社員用</span>
              <button
                type="button"
                className="bg-none border-none p-0 text-accent font-mono text-xs cursor-pointer underline underline-offset-2"
                onClick={() =>
                  fillDemo("employee@shanai-portal.online", "cK_uO|0Ec579")
                }
              >
                使用
              </button>
            </div>
            <div className="flex justify-between font-mono text-ink-3 py-0.5">
              <span>管理者用</span>
              <button
                type="button"
                className="bg-none border-none p-0 text-accent font-mono text-xs cursor-pointer underline underline-offset-2"
                onClick={() =>
                  fillDemo("admin@shanai-portal.online", "r+.5uS4*1`n3")
                }
              >
                使用
              </button>
            </div>
            <div className="flex justify-between font-mono text-ink-3 py-0.5">
              <span>社員 & 管理者用</span>
              <button
                type="button"
                className="bg-none border-none p-0 text-accent font-mono text-xs cursor-pointer underline underline-offset-2"
                onClick={() =>
                  fillDemo(
                    "adminandemployee@shanai-portal.online",
                    "kmpD?B5&0h9/",
                  )
                }
              >
                使用
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
