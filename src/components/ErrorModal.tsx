import React from 'react';
import NLBBModalFrame, { NLBBModalActions } from './ui/NLBBModalFrame';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  buttonLabel?: string;
}

export default function ErrorModal({
  visible,
  title,
  message,
  onDismiss,
  buttonLabel = 'Try again',
}: ErrorModalProps) {
  return (
    <NLBBModalFrame
      visible={visible}
      title={title}
      message={message}
      icon="alert-circle"
      tone="error"
      animated
      onRequestClose={onDismiss}
    >
      <NLBBModalActions
        primaryLabel={buttonLabel}
        onPrimary={onDismiss}
        secondaryLabel="Dismiss"
        onSecondary={onDismiss}
      />
    </NLBBModalFrame>
  );
}
