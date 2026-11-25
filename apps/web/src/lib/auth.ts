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
 * Cập nhật một phần thông tin người dùng đang đăng nhập (ví dụ số điểm thưởng)
 * và báo cho các màn hình đang lắng nghe (menu, giỏ hàng...) cập nhật theo.
 */
export function updateCurrentUser(patch: Partial<AuthUser>): void {
  if (typeof window === 'undefined') return;
  const current = getCurrentUser();
  if (!current) return;
  try {
    const next: AuthUser = { ...current, ...patch };
    localStorage.setItem(USER_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: next }));
  } catch (err) {
    console.error('Không thể cập nhật thông tin người dùng:', err);
  }
}

/**
 * Đồng bộ số dư điểm thưởng thật từ server (GET /loyalty/me).
 * Lỗi mạng / token demo không hợp lệ thì bỏ qua, giữ nguyên số điểm đang hiển thị.
 */
export async function syncLoyaltyPoints(): Promise<void> {
  const token = getAuthToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/loyalty/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (typeof data.points === 'number') {
      updateCurrentUser({ points: data.points });
    }
  } catch {
    // Bỏ qua
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


//Đăng nhập tài khoản qua API backend

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const emailClean = credentials.email.trim().toLowerCase();
  const password = credentials.password;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: emailClean, password }),
      signal: controller.signal,
    });

    if (response.ok) {
      const data = await response.json();
      const token = data.accessToken || data.token;
      if (!token) {
        throw new Error('Không nhận được token xác thực từ máy chủ.');
      }

      const user: AuthUser = {
        userId: data.user?.userId || data.user?.id || 'user-' + Date.now(),
        name: data.user?.name || emailClean.split('@')[0],
        email: data.user?.email || emailClean,
        role: data.user?.role || 'CUSTOMER',
        points: data.user?.points ?? 0,
      };

      saveSession(token, user);
      void syncLoyaltyPoints();
      return { accessToken: token, user };
    }

    const errData = await response.json().catch(() => ({}));
    const message =
      errData.message ||
      (response.status === 401 ? 'Thông tin đăng nhập không chính xác' : 'Đăng nhập không thành công');
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  } catch (err: unknown) {
    if (isNetworkError(err)) {
      throw new Error('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Đăng ký tài khoản mới qua API backend
export async function register(data: RegisterData): Promise<AuthResponse> {
  const emailClean = data.email.trim().toLowerCase();
  const nameClean = data.name.trim();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
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

    if (response.ok) {
      const respData = await response.json();
      const token = respData.accessToken || respData.token;
      if (!token) {
        return await login({ email: emailClean, password: data.password });
      }

      const user: AuthUser = {
        userId: respData.user?.userId || respData.user?.id || 'user-' + Date.now(),
        name: respData.user?.name || nameClean,
        email: respData.user?.email || emailClean,
        role: respData.user?.role || 'CUSTOMER',
        points: 10,
      };

      saveSession(token, user);
      return { accessToken: token, user };
    }

    const errData = await response.json().catch(() => ({}));
    const message =
      errData.message ||
      (response.status === 409 ? 'Email này đã được sử dụng' : 'Đăng ký tài khoản không thành công');
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  } catch (err: unknown) {
    if (isNetworkError(err)) {
      throw new Error('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
