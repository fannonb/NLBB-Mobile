import React from 'react';
import NLBBModalFrame, { NLBBModalActions } from './ui/NLBBModalFrame';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <NLBBModalFrame
      visible={visible}
      title={title}
      message={message}
      icon={isDanger ? 'alert-triangle' : 'help-circle'}
      tone={isDanger ? 'danger' : 'neutral'}
      animated
      onRequestClose={busy ? undefined : onCancel}
    >
      <NLBBModalActions
        primaryLabel={confirmLabel}
        onPrimary={onConfirm}
        secondaryLabel={cancelLabel}
        onSecondary={onCancel}
        primaryDanger={isDanger}
        busy={busy}
      />
    </NLBBModalFrame>
  );
}
