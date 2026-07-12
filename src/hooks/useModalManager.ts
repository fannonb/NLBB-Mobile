import { useState } from 'react';

export interface ModalState {
  type: 'success' | 'error' | 'info' | 'confirm' | 'actionSheet' | null;
  title?: string;
  message?: string;
  visible: boolean;
  data?: any;
}

export const useModalManager = () => {
  const [modal, setModal] = useState<ModalState>({
    type: null,
    visible: false,
  });

  const showSuccess = (title: string, message: string, data?: any) => {
    setModal({ type: 'success', title, message, visible: true, data });
  };

  const showError = (title: string, message: string, data?: any) => {
    setModal({ type: 'error', title, message, visible: true, data });
  };

  const showInfo = (title: string, message: string, data?: any) => {
    setModal({ type: 'info', title, message, visible: true, data });
  };

  const showConfirm = (title: string, message: string, data?: any) => {
    setModal({ type: 'confirm', title, message, visible: true, data });
  };

  const showActionSheet = (title: string, data: any) => {
    setModal({ type: 'actionSheet', title, visible: true, data });
  };

  const hideModal = () => {
    setModal((prev) => ({ ...prev, visible: false }));
  };

  const clearModal = () => {
    setModal({ type: null, visible: false });
  };

  return {
    modal,
    showSuccess,
    showError,
    showInfo,
    showConfirm,
    showActionSheet,
    hideModal,
    clearModal,
  };
};
