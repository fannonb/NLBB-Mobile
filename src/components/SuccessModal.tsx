import React from 'react';
import NLBBModalFrame, { NLBBModalActions } from './ui/NLBBModalFrame';

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  buttonLabel?: string;
}

export default function SuccessModal({
  visible,
  title,
  message,
  onDismiss,
  buttonLabel = 'Continue',
}: SuccessModalProps) {
  return (
    <NLBBModalFrame
      visible={visible}
      title={title}
      message={message}
      icon="check-circle"
      tone="success"
      animated
      onRequestClose={onDismiss}
    >
      <NLBBModalActions primaryLabel={buttonLabel} onPrimary={onDismiss} single />
    </NLBBModalFrame>
  );
}
