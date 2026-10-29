import type { ChangePasswordResult } from '../components/ChangePasswordModal';
import { authApi } from './api/auth';
import { isApiClientError } from './api/client';

/** Shared submit handler for ChangePasswordModal (customer and provider profiles). */
export const submitPasswordChange = async (
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> => {
  try {
    await authApi.changePassword({ currentPassword, newPassword });
    return { success: true };
  } catch (error) {
    if (isApiClientError(error) && (error.code === 'INVALID_CREDENTIALS' || error.status === 401)) {
      return {
        success: false,
        field: 'currentPassword',
        errorMessage: 'Current password is incorrect',
      };
    }

    return {
      success: false,
      errorMessage:
        isApiClientError(error) ? error.message : error instanceof Error ? error.message : 'Failed to change password',
    };
  }
};
