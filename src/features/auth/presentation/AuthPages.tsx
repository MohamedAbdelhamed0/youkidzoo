import { ErrorText } from "../../../shared/components/ErrorText";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../core/i18n/i18n";
import { errorMessage } from "../../../core/errors/AppError";
import { useAuthController } from "../controllers/useAuthController";
const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(8).max(72),
});
const signupSchema = z.object({
  username: z.string().regex(/^[a-z0-9_]{3,30}$/),
  email: z.email(),
  password: z.string().min(8).max(72),
  fullName: z.string().trim().min(2).max(200),
});
export function AuthPage({ register: signUp = false }: { register?: boolean }) {
  const { t } = useLanguage();
  const { user, refresh, login, registerAccount } = useAuthController();
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<Record<string, string>>();
  const from =
    typeof location.state?.from === "string" &&
    location.state.from.startsWith("/") &&
    !location.state.from.startsWith("//")
      ? location.state.from
      : "/account";
  if (user) return <Navigate to={from} replace />;
  const submit = handleSubmit(async (values) => {
    setError("");
    setMessage("");
    try {
      if (signUp) {
        const input = signupSchema.parse(values);
        const result = await registerAccount(input);
        if (result.confirmationRequired) {
          setMessage(
            t(
              "Check your email to confirm your account, then sign in.",
              "تحقق من بريدك الإلكتروني لتأكيد الحساب، ثم سجل الدخول.",
            ),
          );
          return;
        }
      } else {
        const input = loginSchema.parse(values);
        await login(input.identifier, input.password);
      }
      await refresh();
      navigate(from, { replace: true });
    } catch (e) {
      setError(
        e instanceof z.ZodError
          ? e.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ")
          : e instanceof Error
            ? e.message
            : "Unable to continue.",
      );
    }
  });
  return (
    <section className="form-card">
      <span className="eyebrow">
        {t("A LITTLE MAGIC STARTS WITH YOU", "السحر يبدأ معك")}
      </span>
      <h1>
        {signUp
          ? t("Join the family", "انضم للعائلة")
          : t("Welcome back", "مرحبًا بعودتك")}
      </h1>
      <form className="stack" onSubmit={submit}>
        {signUp ? (
          <>
            <label>
              {t("Full name", "الاسم الكامل")}
              <input
                {...register("fullName")}
                autoComplete="name"
                required
                maxLength={200}
              />
            </label>
            <label>
              {t("Username", "اسم المستخدم")}
              <input
                {...register("username")}
                pattern="[a-z0-9_]{3,30}"
                required
                autoComplete="username"
              />
              <small>
                {t(
                  "3–30 lowercase letters, numbers, or underscores.",
                  "٣–٣٠ حرفًا إنجليزيًا صغيرًا أو رقمًا أو شرطة سفلية.",
                )}
              </small>
            </label>
            <label>
              {t("Email", "البريد الإلكتروني")}
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                required
              />
            </label>
          </>
        ) : (
          <label>
            {t("Email or username", "البريد الإلكتروني أو اسم المستخدم")}
            <input
              {...register("identifier")}
              required
              autoComplete="username"
            />
          </label>
        )}
        <label>
          {t("Password", "كلمة المرور")}
          <input
            {...register("password")}
            type="password"
            autoComplete={signUp ? "new-password" : "current-password"}
            minLength={8}
            maxLength={72}
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            <ErrorText message={error} />
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <button disabled={isSubmitting} className="pink-button">
          {isSubmitting
            ? t("Please wait…", "يرجى الانتظار…")
            : signUp
              ? t("Create account", "إنشاء حساب")
              : t("Sign in", "تسجيل الدخول")}
        </button>
        <Link to={signUp ? "/login" : "/register"} state={{ from }}>
          {signUp
            ? t("Already have an account? Sign in", "لديك حساب؟ سجل الدخول")
            : t("New here? Create an account", "جديد هنا؟ أنشئ حسابًا")}
        </Link>
      </form>
    </section>
  );
}
const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(200),
  phone: z.string().max(40),
  preferredLanguage: z.enum(["en", "ar"]),
});
export function AccountPage() {
  const { user, refresh, saveProfile, logout } = useAuthController();
  const { t, setAr } = useLanguage();
  const [message, setMessage] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      preferredLanguage: user?.preferredLanguage || "en",
    },
  });
  return (
    <section className="form-card">
      <h1>{t("Your account", "حسابك")}</h1>
      <p>
        {user?.email} · @{user?.username}
      </p>
      <form
        className="stack"
        onSubmit={handleSubmit(async (input) => {
          try {
            await saveProfile(input);
            await refresh();
            setAr(input.preferredLanguage === "ar");
            setMessage(t("Profile updated.", "تم تحديث الحساب."));
          } catch (e) {
            setMessage(errorMessage(e, "Update failed."));
          }
        })}
      >
        <label>
          {t("Full name", "الاسم الكامل")}
          <input
            {...register("fullName")}
            required
            minLength={2}
            maxLength={200}
          />
          {errors.fullName && (
            <small className="form-error" role="alert">
              {errors.fullName.message}
            </small>
          )}
        </label>
        <label>
          {t("Phone", "الهاتف")}
          <input {...register("phone")} type="tel" maxLength={40} />
        </label>
        <label>
          {t("Preferred language", "اللغة المفضلة")}
          <select {...register("preferredLanguage")}>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </label>
        <button className="pink-button" disabled={isSubmitting}>
          {t("Save profile", "حفظ الحساب")}
        </button>
        <p role="status">{message}</p>
      </form>
      <div className="account-links">
        {user?.role === "shop_owner" && user.isActive && (
          <Link to="/owner/products">
            {t("My shop products", "منتجات متاجري")}
          </Link>
        )}
        <Link to="/orders">{t("My orders", "طلباتي")}</Link>
        {user?.role === "admin" && (
          <Link to="/admin">{t("Admin dashboard", "لوحة الإدارة")}</Link>
        )}
        <button
          onClick={async () => {
            try {
              await logout();
              await refresh();
            } catch (e) {
              setMessage(e instanceof Error ? e.message : "Sign out failed.");
            }
          }}
        >
          {t("Sign out", "تسجيل الخروج")}
        </button>
      </div>
    </section>
  );
}
