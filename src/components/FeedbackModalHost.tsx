import React from 'react';
import ErrorModal from './ErrorModal';
import InfoModal from './InfoModal';
import SuccessModal from './SuccessModal';
import { ModalState } from '../hooks/useModalManager';

interface FeedbackModalHostProps {
  modal: ModalState;
  onDismiss: () => void;
}

export default function FeedbackModalHost({ modal, onDismiss }: FeedbackModalHostProps) {
  return (
    <>
      <SuccessModal
        visible={modal.visible && modal.type === 'success'}
        title={modal.title ?? 'Success'}
        message={modal.message ?? ''}
        onDismiss={onDismiss}
      />
      <ErrorModal
        visible={modal.visible && modal.type === 'error'}
        title={modal.title ?? 'Error'}
        message={modal.message ?? ''}
        onDismiss={onDismiss}
      />
      <InfoModal
        visible={modal.visible && modal.type === 'info'}
        title={modal.title ?? 'Information'}
        message={modal.message ?? ''}
        onDismiss={onDismiss}
      />
    </>
  );
}
