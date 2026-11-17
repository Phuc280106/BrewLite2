'use client';

// ============================================================
// AuthForm Component (BrewLite Authentication)
// 4 Variants matching Figma Component Set (IUwGwAon8cvD3CtxHPsfHW):
//   1. Sign In (Đăng nhập)
//   2. Sign Up (Đăng ký)
//   3. Forgot Password (Quên mật khẩu)
//   4. Confirmation (Xác nhận gửi email)
// ============================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Coffee,
  Sparkles,
  Loader2,
  Gift,
} from 'lucide-react';
import { AuthMode, AuthUser } from '@/types/auth';
import { login, register, DEMO_ACCOUNTS } from '@/lib/auth';

interface AuthFormProps {
  initialMode?: AuthMode;
  onSuccess?: (user: AuthUser) => void;
  className?: string;
}

const VALID_TLDS = new Set([
  'com', 'vn', 'net', 'org', 'edu', 'gov', 'io', 'co', 'ai', 'app', 'dev', 'me', 'info', 'biz', 'xyz', 'tech', 'online', 'store'
]);

interface EmailValidationResult {
  isValid: boolean;
  errorMessage: string | null;
}

function validateEmail(emailInput: string, currentMode: AuthMode): EmailValidationResult {
  const trimmed = emailInput.trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, errorMessage: null };
  }

  // 1. Kiểm tra thiếu tên tài khoản trước @ (Ví dụ: @brewlite.vn)
  if (trimmed.startsWith('@')) {
    return { isValid: false, errorMessage: 'Vui lòng nhập tên tài khoản trước ký tự @' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, errorMessage: 'Email chỉ được chứa đúng 1 ký tự @' };
  }

  const [localPart, domainPart] = parts;
  if (!localPart || localPart.length < 1) {
    return { isValid: false, errorMessage: 'Vui lòng nhập tên tài khoản trước ký tự @' };
  }

  if (!domainPart || !domainPart.includes('.')) {
    return { isValid: false, errorMessage: 'Tên miền email phải có phần mở rộng (Ví dụ: .com, .vn)' };
  }

  // 2. Bắt lỗi sai chính tả phổ biến (Typo detection: .comm, .con)
  if (domainPart === 'gmail.comm' || domainPart === 'gmail.con' || domainPart === 'gmail.co') {
    return { isValid: false, errorMessage: 'Đuôi email không hợp lệ. Có phải bạn muốn nhập @gmail.com?' };
  }
  if (domainPart.endsWith('.comm') || domainPart.endsWith('.con')) {
    return { isValid: false, errorMessage: 'Đuôi tên miền không tồn tại. Có phải bạn muốn nhập .com?' };
  }

  // 3. Tên miền nội bộ brewlite.vn (Chỉ cho phép nhân viên đăng nhập, không cho khách hàng đăng ký mới)
  if (currentMode === 'signup' && domainPart === 'brewlite.vn') {
    return {
      isValid: false,
      errorMessage: 'Tên miền @brewlite.vn chỉ dành cho nhân viên nội bộ BrewLite. Vui lòng sử dụng email cá nhân (ví dụ: Gmail, Outlook).',
    };
  }

  // 4. Kiểm tra danh sách TLD hợp lệ thực tế
  const domainSegments = domainPart.split('.');
  const tld = domainSegments[domainSegments.length - 1];
  if (!VALID_TLDS.has(tld)) {
    return {
      isValid: false,
      errorMessage: `Phần mở rộng tên miền ".${tld}" không hợp lệ hoặc chưa được hỗ trợ.`,
    };
  }

  // 5. Cú pháp RFC 5322 tổng quát
  const EMAIL_SYNTAX_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!EMAIL_SYNTAX_REGEX.test(trimmed)) {
    return { isValid: false, errorMessage: 'Định dạng email không hợp lệ (Ví dụ: tenban@gmail.com).' };
  }

  return { isValid: true, errorMessage: null };
}

export function AuthForm({ initialMode = 'signin', onSuccess, className = '' }: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const emailValidation = validateEmail(email, mode);
  const isEmailValid = emailValidation.isValid;
  const emailError = emailValidation.errorMessage;
  const isPasswordMatch = mode === 'signup' ? password.length > 0 && password === confirmPassword : true;

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
  };

  const handleFastLogin = async (acc: typeof DEMO_ACCOUNTS.customer) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await login({ email: acc.email, password: acc.password });
      if (onSuccess) {
        onSuccess(res.user);
      } else {
        router.push('/menu');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng nhập không thành công';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!isEmailValid) {
      setErrorMessage(emailError || 'Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (mode === 'signin') {
      if (!password) {
        setErrorMessage('Vui lòng nhập mật khẩu.');
        return;
      }
      setIsLoading(true);
      try {
        const res = await login({ email, password });
        if (onSuccess) {
          onSuccess(res.user);
        } else {
          router.push('/menu');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Vui lòng nhập họ và tên của bạn.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
        return;
      }

      setIsLoading(true);
      try {
        const res = await register({ name, email, password, confirmPassword });
        if (onSuccess) {
          onSuccess(res.user);
        } else {
          router.push('/menu');
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại sau.';
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
      }
    } else if (mode === 'forgot') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setSubmittedEmail(email);
        setMode('confirm');
      }, 750);
    }
  };

  return (
    <div className={`w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E0D8] shadow-xl shadow-stone-200/40 text-[#1F1612] ${className}`}>
      {/* 1. Header: Pill Tab Switcher cho Sign In / Sign Up */}
      {(mode === 'signin' || mode === 'signup') && (
        <div className="mb-6">
          <div className="flex bg-[#F5ECE5] p-1.5 rounded-full" role="tablist" aria-label="Lựa chọn xác thực">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              onClick={() => handleModeSwitch('signin')}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-semibold transition-all duration-200 text-center ${
                mode === 'signin'
                  ? 'bg-[#2B1810] text-white shadow-md'
                  : 'text-[#6B5D55] hover:text-[#1F1612]'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              onClick={() => handleModeSwitch('signup')}
              className={`flex-1 py-2.5 px-4 rounded-full text-sm font-semibold transition-all duration-200 text-center ${
                mode === 'signup'
                  ? 'bg-[#2B1810] text-white shadow-md'
                  : 'text-[#6B5D55] hover:text-[#1F1612]'
              }`}
            >
              Đăng ký
            </button>
          </div>
        </div>
      )}

      {/* Thông báo lỗi nếu có */}
      {errorMessage && (
        <div
          className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-sm animate-fadeIn"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* VARIANT 1: SIGN IN & VARIANT 2: SIGN UP                      */}
      {/* ============================================================ */}
      {(mode === 'signin' || mode === 'signup') && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trường Họ tên (Chỉ hiển thị khi Đăng ký) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-semibold text-[#6B5D55] mb-1.5 uppercase tracking-wider">
                Họ và tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full pl-10 pr-4 py-3 bg-[#FCFBF9] border border-[#E5E0D8] rounded-xl text-sm focus:border-[#C8682E] focus:ring-2 focus:ring-[#C8682E]/20 transition outline-none text-[#1F1612]"
                />
              </div>
            </div>
          )}

          {/* Trường Email */}
          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#6B5D55] mb-1.5 uppercase tracking-wider">
              Địa chỉ Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@email.com"
                className={`w-full pl-10 pr-10 py-3 bg-[#FCFBF9] border rounded-xl text-sm transition outline-none text-[#1F1612] ${
                  email.trim().length > 0 && !isEmailValid
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                    : 'border-[#E5E0D8] focus:border-[#C8682E] focus:ring-2 focus:ring-[#C8682E]/20'
                }`}
              />
              {isEmailValid && (
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#10B981]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </div>
            {email.trim().length > 0 && !isEmailValid && (
              <p className="mt-1 text-xs text-rose-600">{emailError || 'Định dạng email không hợp lệ (Ví dụ: tenban@gmail.com).'}</p>
            )}
          </div>

          {/* Trường Mật khẩu */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="auth-password" className="text-xs font-semibold text-[#6B5D55] uppercase tracking-wider">
                Mật khẩu
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => handleModeSwitch('forgot')}
                  className="text-xs font-semibold text-[#C8682E] hover:text-[#A85320] transition hover:underline"
                >
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full pl-10 pr-10 py-3 bg-[#FCFBF9] border rounded-xl text-sm transition outline-none text-[#1F1612] ${
                  mode === 'signup' && password.length > 0 && password.length < 6
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                    : 'border-[#E5E0D8] focus:border-[#C8682E] focus:ring-2 focus:ring-[#C8682E]/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {mode === 'signup' && password.length > 0 && password.length < 6 && (
              <p className="mt-1 text-xs text-rose-600">Mật khẩu phải có ít nhất 6 ký tự.</p>
            )}
          </div>

          {/* Trường Xác nhận Mật khẩu (Chỉ hiển thị khi Đăng ký) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="auth-confirm-password" className="block text-xs font-semibold text-[#6B5D55] mb-1.5 uppercase tracking-wider">
                Xác nhận Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  className={`w-full pl-10 pr-10 py-3 bg-[#FCFBF9] border rounded-xl text-sm transition outline-none text-[#1F1612] ${
                    password.length > 0 && confirmPassword.length > 0 && !isPasswordMatch
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                      : 'border-[#E5E0D8] focus:border-[#C8682E] focus:ring-2 focus:ring-[#C8682E]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition"
                  aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiển thị mật khẩu xác nhận'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password.length > 0 && confirmPassword.length > 0 && !isPasswordMatch && (
                <p className="mt-1 text-xs text-rose-600">Mật khẩu xác nhận chưa trùng khớp.</p>
              )}
            </div>
          )}

          {/* Helper Text khi Đăng ký */}
          {mode === 'signup' && (
            <div className="flex items-center gap-2 py-1 px-3 bg-[#EEF7F2] text-[#2D7A4D] rounded-xl text-xs font-medium border border-[#D5EFE0]">
              <Gift className="w-4 h-4 shrink-0 text-[#2D7A4D]" />
              <span>Cùng BrewLite tích điểm mỗi ngày. Tặng ngay 10 điểm chào mừng!</span>
            </div>
          )}

          {/* Pill CTA Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-6 rounded-full bg-[#2B1810] hover:bg-[#1E100A] active:scale-[0.99] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#2B1810]/20 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : mode === 'signin' ? (
              <>
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Đăng ký tài khoản</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Demo Fast-Login Section (Chỉ hiển thị ở chế độ Đăng nhập) */}
      {mode === 'signin' && (
        <div className="mt-6 pt-5 border-t border-[#E5E0D8]">
          <p className="text-xs font-semibold text-stone-500 mb-3 text-center uppercase tracking-wider">
            Tài khoản dùng thử nhanh (1-Click)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Khách hàng demo */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleFastLogin(DEMO_ACCOUNTS.customer)}
              className="p-3 bg-[#FBF8F5] hover:bg-[#F5ECE5] border border-[#E5E0D8] hover:border-[#D97706]/40 rounded-2xl transition text-left flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#EEF7F2] text-[#2D7A4D] flex items-center justify-center shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#1F1612] truncate group-hover:text-[#C8682E] transition">
                  {DEMO_ACCOUNTS.customer.label}
                </p>
                <p className="text-[11px] text-stone-500 truncate">
                  {DEMO_ACCOUNTS.customer.email}
                </p>
              </div>
            </button>

            {/* Thu ngân / Pha chế demo */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleFastLogin(DEMO_ACCOUNTS.barista)}
              className="p-3 bg-[#FBF8F5] hover:bg-[#F5ECE5] border border-[#E5E0D8] hover:border-[#D97706]/40 rounded-2xl transition text-left flex items-center gap-2.5 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#1F1612] truncate group-hover:text-[#C8682E] transition">
                  {DEMO_ACCOUNTS.barista.label}
                </p>
                <p className="text-[11px] text-stone-500 truncate">
                  {DEMO_ACCOUNTS.barista.email}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VARIANT 3: FORGOT PASSWORD (Quên mật khẩu)                  */}
      {/* ============================================================ */}
      {mode === 'forgot' && (
        <div className="space-y-5 animate-fadeIn">
          <div>
            <h2 className="text-2xl font-bold text-[#1F1612]">Quên mật khẩu?</h2>
            <p className="mt-1.5 text-sm text-[#6B5D55]">
              Nhập email đã đăng ký của bạn để nhận liên kết đặt lại mật khẩu an toàn.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="auth-forgot-email" className="block text-xs font-semibold text-[#6B5D55] mb-1.5 uppercase tracking-wider">
                Địa chỉ Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="auth-forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tenban@email.com"
                  className={`w-full pl-10 pr-10 py-3 bg-[#FCFBF9] border rounded-xl text-sm transition outline-none text-[#1F1612] ${
                    email.trim().length > 0 && !isEmailValid
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                      : 'border-[#E5E0D8] focus:border-[#C8682E] focus:ring-2 focus:ring-[#C8682E]/20'
                  }`}
                />
                {isEmailValid && (
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-[#10B981]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                )}
              </div>
              {email.trim().length > 0 && !isEmailValid && (
                <p className="mt-1 text-xs text-rose-600">{emailError || 'Định dạng email không hợp lệ (Ví dụ: tenban@gmail.com).'}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-full bg-[#2B1810] hover:bg-[#1E100A] active:scale-[0.99] text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#2B1810]/20 disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang gửi liên kết...</span>
                </>
              ) : (
                <>
                  <span>Gửi liên kết đặt lại</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleModeSwitch('signin')}
                className="text-sm font-semibold text-[#6B5D55] hover:text-[#1F1612] transition"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* VARIANT 4: CONFIRMATION (Kiểm tra hộp thư)                   */}
      {/* ============================================================ */}
      {mode === 'confirm' && (
        <div className="text-center py-4 space-y-4 animate-fadeIn">
          {/* Big Green Checkmark Icon */}
          <div className="w-16 h-16 rounded-full bg-[#EEF7F2] text-[#10B981] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#1F1612]">Kiểm tra hộp thư của bạn</h2>
            <p className="mt-2 text-sm text-[#6B5D55] max-w-sm mx-auto leading-relaxed">
              Chúng tôi đã gửi đường dẫn đặt lại mật khẩu đến{' '}
              <strong className="text-[#1F1612]">{submittedEmail || 'email của bạn'}</strong>.
              Vui lòng kiểm tra hòm thư chính và thư mục thư rác (Spam).
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleModeSwitch('signin')}
              className="w-full py-3.5 px-6 rounded-full bg-[#2B1810] hover:bg-[#1E100A] active:scale-[0.99] text-white font-semibold text-sm transition-all duration-200 shadow-md cursor-pointer"
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      )}

      {/* Guest Bypass (Áp dụng cho mọi màn hình để vào Menu) */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={() => router.push('/menu')}
          className="text-xs sm:text-sm text-stone-500 hover:text-[#2B1810] font-medium transition inline-flex items-center gap-1.5 cursor-pointer py-1"
        >
          <span>Tiếp tục với tư cách Khách</span>
          <span className="text-stone-300">·</span>
          <span className="text-[#C8682E] font-semibold hover:underline">Khám phá thực đơn →</span>
        </button>
      </div>
    </div>
  );
}
