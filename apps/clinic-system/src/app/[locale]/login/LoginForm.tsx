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

            ? "البريد أو الرقم أو كلمة المرور غير صحيحة"

            : "Invalid email, phone, or password",

          suspended: ar ? "الحساب موقوف — تواصل مع الإدارة" : "Account suspended — contact admin",

          account_incomplete: ar ? "الحساب غير مكتمل — تواصل مع الإدارة" : "Account incomplete — contact admin",
          email_unverified: ar ? "أكّد البريد أولاً من الحساب، أو ادخل باسم المستخدم أو رقم الهاتف" : "Confirm this email from your account first, or sign in with your username or phone",

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

        <label className="form-label">{ar ? "البريد أو رقم الهاتف" : "Email or phone"}</label>

        <div className="relative">

          <AtSign className="form-input-icon" />

          <input

            name="username"

            type="text"

            required

            autoComplete="username"

            dir="ltr"

            className="form-input form-input-with-icon"

            placeholder={ar ? "email@example.com أو 07XXXXXXXXX" : "email@example.com or 07XXXXXXXXX"}

          />

        </div>

        <p className="form-hint">

          {ar ? "يمكنك أيضاً استخدام اسم المستخدم إن وُجد" : "Username still works if you have one"}

        </p>

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

