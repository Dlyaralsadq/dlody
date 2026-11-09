"use client";

import { useState } from "react";

import Link from "next/link";

import { loginAction } from "@/app/actions/auth";

import { Eye, EyeOff, Lock, AtSign, ArrowRight } from "lucide-react";

import Alert from "@/components/ui/Alert";

import Button from "@/components/ui/Button";



export default function LoginForm({ locale }: { locale: string }) {

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const [showPwd, setShowPwd] = useState(false);

  const ar = locale === "ar";



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    e.preventDefault();

    setError("");

    setLoading(true);



    try {

      const formData = new FormData(e.currentTarget);

      formData.set("locale", locale);

      const result = await loginAction(formData);



      if (result && !result.success) {

        const errMap: Record<string, string> = {

          invalid_credentials: ar

            ? "البريد أو كلمة المرور غير صحيحة"

            : "Invalid email or password",

          email_only: ar

            ? "تسجيل الدخول بالبريد الإلكتروني فقط"

            : "Sign in with your email address",

          suspended: ar ? "الحساب موقوف — تواصل مع الإدارة" : "Account suspended — contact admin",

          account_incomplete: ar ? "الحساب غير مكتمل — تواصل مع الإدارة" : "Account incomplete — contact admin",
          rate_limited: ar
            ? "محاولات كثيرة. انتظر ربع ساعة ثم أعد المحاولة"
            : "Too many attempts. Wait 15 minutes and try again",

        };

        setError(errMap[result.error ?? ""] ?? (ar ? "فشل تسجيل الدخول" : "Login failed"));

        setLoading(false);

      }

    } catch {

      setError(ar ? "فشل الاتصال — أعد المحاولة" : "Connection failed — try again");

      setLoading(false);

    }

  };



  return (

    <form onSubmit={handleSubmit} className="space-y-4">

      {error && <Alert variant="error">{error}</Alert>}



      <div className="space-y-1">

        <label className="form-label">{ar ? "البريد الإلكتروني" : "Email"}</label>

        <div className="relative">

          <AtSign className="form-input-icon" />

          <input

            name="username"

            type="text"

            required

            autoComplete="username"

            dir="ltr"

            className="form-input form-input-with-icon"

            placeholder="name@gmail.com"

          />

        </div>

      </div>



      <div className="space-y-1">

        <div className="flex items-center justify-between">

          <label className="form-label !mb-0">{ar ? "كلمة المرور" : "Password"}</label>

          <Link href={`/${locale}/forgot-password`} className="text-xs text-indigo-400 hover:underline font-medium">

            {ar ? "نسيت كلمة المرور؟" : "Forgot password?"}

          </Link>

        </div>

        <div className="relative">

          <Lock className="form-input-icon" />

          <input

            name="password"

            type={showPwd ? "text" : "password"}

            required

            autoComplete="current-password"

            className="form-input form-input-with-icon pe-10"

            placeholder="••••••••"

          />

          <button

            type="button"

            onClick={() => setShowPwd(!showPwd)}

            className="absolute inset-y-0 end-3 my-auto text-app-3 hover:text-app-1 transition-colors"

          >

            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}

          </button>

        </div>

      </div>



      <Button type="submit" loading={loading} fullWidth className="mt-2">

        {ar ? "تسجيل الدخول" : "Sign In"}

        {!loading && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}

      </Button>

    </form>

  );

}

