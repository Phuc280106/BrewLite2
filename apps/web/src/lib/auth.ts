// ============================================================
// BrewLite Authentication Client & Storage
// Supports real API integration with graceful Demo Fallback
// ============================================================

import { AuthResponse, AuthUser, LoginCredentials, RegisterData } from '@/types/auth';

const TOKEN_KEY = 'brewlite_auth_token';
const USER_KEY = 'brewlite_auth_user';
const AUTH_EVENT = 'brewlite_auth_change';

// Chuẩn hóa đường dẫn API Base
const RAW_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const CLEAN_URL = RAW_URL.replace(/\/+$/, '');
const API_BASE = CLEAN_URL.endsWith('/api/v1') ? CLEAN_URL : `${CLEAN_URL}/api/v1`;

// Demo accounts for instant one-click login & offline presentation
export const DEMO_ACCOUNTS = {
  customer: {
    label: 'Khách hàng demo',
    roleLabel: 'Khách hàng',
    email: 'customer@gmail.com',
    password: '123456',
    user: {
      userId: 'demo-customer-001',
      name: 'Nguyễn Văn An',
      email: 'customer@gmail.com',
      role: 'CUSTOMER',
      points: 120,
    } as AuthUser,
  },
  barista: {
    label: 'Thu ngân / Pha chế demo',
    roleLabel: 'Pha chế',
    email: 'barista@gmail.com',
    password: '123456',
    user: {
      userId: 'demo-barista-002',
      name: 'Trần Thị Mai',
      email: 'barista@gmail.com',
      role: 'BARISTA',
      points: 350,
    } as AuthUser,
  },
};

/**
 * Lấy token xác thực từ localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Lấy thông tin người dùng hiện tại từ localStorage
 */
export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Kiểm tra xem người dùng đã đăng nhập chưa
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getCurrentUser();
}

/**
 * Lưu phiên đăng nhập vào localStorage và phát event
 */
function saveSession(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: user }));
  } catch (err) {
    console.error('Không thể lưu phiên đăng nhập:', err);
  }
}

/**
 * Đăng xuất tài khoản
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  try {
    const token = getAuthToken();
    if (token) {
      // Gửi yêu cầu đăng xuất tới backend, bỏ qua lỗi nếu không có mạng
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {
        // Bỏ qua lỗi mạng
      });
    }
  } catch {
    // Bỏ qua lỗi
  } finally {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: null }));
    } catch (err) {
      console.error('Lỗi khi đăng xuất:', err);
    }
  }
}

/**
 * Lắng nghe thay đổi trạng thái đăng nhập
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<AuthUser | null>;
    callback(customEvent.detail);
  };

  window.addEventListener(AUTH_EVENT, handler);
  // Cập nhật giá trị hiện tại ngay lập tức
  callback(getCurrentUser());

  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
  };
}

/**
 * Kiểm tra xem lỗi có phải do mạng không khả dụng / timeout không
 */
function isNetworkError(err: unknown): boolean {
  if (err instanceof TypeError) {
    return true; // "Failed to fetch", network errors
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return true; // Timeout
  }
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return err.name === 'AbortError' || msg.includes('fetch') || msg.includes('network') || msg.includes('econnrefused');
  }
  return false;
}

/**
 * Đăng nhập tài khoản (kết nối API backend hoặc tự động fallback sang Demo khi offline)
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const emailClean = credentials.email.trim().toLowerCase();
  const password = credentials.password;

  let networkFailed = false;

  // 1. Thử gọi Backend API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: emailClean, password }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const token = data.accessToken || data.token || 'jwt-backend-token';
      const user: AuthUser = {
        userId: data.user?.userId || data.user?.id || 'user-' + Date.now(),
        name: data.user?.name || emailClean.split('@')[0],
        email: data.user?.email || emailClean,
        role: data.user?.role || 'CUSTOMER',
        points: data.user?.points ?? 120,
      };

      saveSession(token, user);
      return { accessToken: token, user };
    }

    // Backend phản hồi lỗi HTTP (401 Unauthorized, 400 Bad Request, v.v.)
    // KHÔNG nuốt lỗi mà ném trực tiếp ra UI
    const errData = await response.json().catch(() => ({}));
    const message =
      errData.message ||
      (response.status === 401 ? 'Thông tin đăng nhập không chính xác' : 'Đăng nhập không thành công');
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  } catch (err: unknown) {
    if (!isNetworkError(err)) {
      // Lỗi logic từ backend (ví dụ 401 sai mật khẩu) -> ném lỗi trực tiếp
      throw err;
    }
    // Lỗi mạng thực sự -> kích hoạt fallback offline
    networkFailed = true;
  }

  // 2. Fallback Demo Accounts (CHỈ KHI backend offline / không thể kết nối mạng)
  if (networkFailed) {
    if (emailClean === DEMO_ACCOUNTS.customer.email && password === DEMO_ACCOUNTS.customer.password) {
      const res: AuthResponse = {
        accessToken: 'demo-jwt-customer-token',
        user: DEMO_ACCOUNTS.customer.user,
      };
      saveSession(res.accessToken, res.user);
      return res;
    }

    if (emailClean === DEMO_ACCOUNTS.barista.email && password === DEMO_ACCOUNTS.barista.password) {
      const res: AuthResponse = {
        accessToken: 'demo-jwt-barista-token',
        user: DEMO_ACCOUNTS.barista.user,
      };
      saveSession(res.accessToken, res.user);
      return res;
    }

    // Nếu người dùng nhập thông tin bất kỳ khi Backend offline
    if (password.length >= 6) {
      const fallbackUser: AuthUser = {
        userId: 'usr-local-' + Date.now().toString(36),
        name: emailClean.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        email: emailClean,
        role: 'CUSTOMER',
        points: 50,
      };
      const res: AuthResponse = {
        accessToken: 'local-session-token-' + Date.now(),
        user: fallbackUser,
      };
      saveSession(res.accessToken, res.user);
      return res;
    }
  }

  throw new Error('Mật khẩu phải chứa ít nhất 6 ký tự.');
}

/**
 * Đăng ký tài khoản mới (kết nối API backend hoặc tự động fallback khi offline)
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  const emailClean = data.email.trim().toLowerCase();
  const nameClean = data.name.trim();

  let networkFailed = false;

  // 1. Thử gọi Backend API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: nameClean,
        email: emailClean,
        password: data.password,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const respData = await response.json();
      let token = respData.accessToken || respData.token;
      if (!token) {
        try {
          const loginRes = await login({ email: emailClean, password: data.password });
          return loginRes;
        } catch {
          token = 'jwt-session-' + Date.now();
        }
      }

      const user: AuthUser = {
        userId: respData.user?.userId || respData.user?.id || 'user-' + Date.now(),
        name: respData.user?.name || nameClean,
        email: respData.user?.email || emailClean,
        role: respData.user?.role || 'CUSTOMER',
        points: 0,
      };

      saveSession(token, user);
      return { accessToken: token, user };
    }

    // Backend phản hồi lỗi (ví dụ 409 Conflict "Email này đã được sử dụng")
    // KHÔNG nuốt lỗi mà ném trực tiếp ra UI
    const errData = await response.json().catch(() => ({}));
    const message =
      errData.message ||
      (response.status === 409 ? 'Email này đã được sử dụng' : 'Đăng ký tài khoản không thành công');
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  } catch (err: unknown) {
    if (!isNetworkError(err)) {
      // Lỗi logic từ backend (ví dụ 409 trùng email) -> ném lỗi trực tiếp
      throw err;
    }
    // Lỗi mạng thực sự -> kích hoạt fallback offline
    networkFailed = true;
  }

  // 2. Fallback giả lập đăng ký thành công cục bộ khi offline
  if (networkFailed) {
    const newUser: AuthUser = {
      userId: 'usr-new-' + Date.now().toString(36),
      name: nameClean,
      email: emailClean,
      role: 'CUSTOMER',
      points: 10, // Thưởng 10 điểm chào mừng
    };

    const authRes: AuthResponse = {
      accessToken: 'local-reg-token-' + Date.now(),
      user: newUser,
    };

    saveSession(authRes.accessToken, authRes.user);
    return authRes;
  }

  throw new Error('Đăng ký không thành công.');
}
