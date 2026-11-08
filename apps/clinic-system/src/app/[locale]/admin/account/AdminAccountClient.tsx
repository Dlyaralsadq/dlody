"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, UserRound } from "lucide-react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { updateAdminAccount } from "@/app/actions/adminAccount";

export default function AdminAccountClient({
  locale,
  name,
  username,
}: {
  locale: string;
  name: string;
  username: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [loginName, setLoginName] = useState(username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const result = await updateAdminAccount({
        locale,
        name: displayName,
        username: loginName,
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(
        result.passwordChanged
          ? ar
            ? "تم حفظ الاسم وكلمة السر. استخدم البيانات الجديدة في الدخول القادم."
            : "Name and password saved. Use the new details next time you sign in."
          : ar
            ? "تم حفظ بيانات الحساب."
            : "Account details saved."
      );
      router.refresh();
    } catch {
      setError(ar ? "تعذر حفظ التغييرات" : "Could not save the changes");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-app-1">{ar ? "حساب مدير النظام" : "Admin account"}</h1>
        <p className="mt-1 text-sm text-app-3">
          {ar
            ? "غيّر الاسم الظاهر واسم الدخول وكلمة السر. كلمة السر الحالية مطلوبة قبل أي حفظ."
            : "Change the display name, sign-in name, and password. Your current password is required."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle icon={<UserRound className="h-4 w-4 text-indigo-400" />}>
              {ar ? "بيانات الدخول" : "Sign-in details"}
            </CardTitle>
            <CardDescription>
              {ar
                ? "اسم الدخول هو ما تكتبه في صفحة تسجيل الدخول."
                : "The sign-in name is what you type on the login page."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}

            <Input
              label={ar ? "الاسم الظاهر" : "Display name"}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
            />
            <Input
              label={ar ? "اسم الدخول" : "Sign-in name"}
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              required
              autoComplete="username"
              hint={ar ? "حروف إنجليزية أو أرقام" : "Letters or numbers"}
            />

            <div className="relative">
              <Input
                label={ar ? "كلمة السر الحالية" : "Current password"}
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                icon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                className="absolute end-3 top-8 text-app-3"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={ar ? "إظهار كلمة السر" : "Show password"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label={ar ? "كلمة السر الجديدة" : "New password"}
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                hint={ar ? "اتركها فارغة إذا أردت الإبقاء على كلمة السر الحالية" : "Leave blank to keep the current password"}
                icon={<Lock className="h-4 w-4" />}
              />
              <button
                type="button"
                className="absolute end-3 top-8 text-app-3"
                onClick={() => setShowNew((v) => !v)}
                aria-label={ar ? "إظهار كلمة السر الجديدة" : "Show new password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Input
              label={ar ? "تأكيد كلمة السر الجديدة" : "Confirm new password"}
              type={showNew ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              icon={<Lock className="h-4 w-4" />}
            />

            <Button type="submit" loading={loading}>
              {ar ? "حفظ" : "Save"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
