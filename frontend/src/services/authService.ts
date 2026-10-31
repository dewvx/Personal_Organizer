import api from './api';
import { ApiResponse } from '../types';

export interface PinStatusResponse {
  hasPin: boolean;
}

export interface PinVerifyResponse {
  verified: boolean;
  hasPin?: boolean;
  token?: string;
}

export const AuthService = {
  /**
   * Check if PIN passcode is configured on the backend
   */
  async getPinStatus(): Promise<PinStatusResponse> {
    const res = await api.get<ApiResponse<PinStatusResponse>>('/auth/pin/status');
    return res.data.data;
  },

  /**
   * Verify PIN for unlocking
   */
  async verifyPin(pin: string): Promise<PinVerifyResponse> {
    const res = await api.post<ApiResponse<PinVerifyResponse>>('/auth/pin/verify', { pin });
    if (res.data.data.token) {
      sessionStorage.setItem('app_auth_token', res.data.data.token);
      sessionStorage.setItem('app_unlocked', 'true');
    }
    return res.data.data;
  },

  /**
   * Set or update PIN
   */
  async setPin(pin: string, currentPin?: string): Promise<{ hasPin: boolean; token?: string }> {
    const res = await api.post<ApiResponse<{ hasPin: boolean; token?: string }>>('/auth/pin/set', {
      pin,
      currentPin,
    });
    if (res.data.data.token) {
      sessionStorage.setItem('app_auth_token', res.data.data.token);
      sessionStorage.setItem('app_unlocked', 'true');
    }
    return res.data.data;
  },

  /**
   * Disable / remove PIN
   */
  async disablePin(currentPin: string): Promise<{ hasPin: boolean }> {
    const res = await api.post<ApiResponse<{ hasPin: boolean }>>('/auth/pin/disable', {
      currentPin,
    });
    sessionStorage.removeItem('app_auth_token');
    return res.data.data;
  },
};
