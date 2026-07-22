import React from 'react';
import NLBBModalFrame, { NLBBModalActions } from './ui/NLBBModalFrame';

interface InfoModalProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  buttonLabel?: string;
}

export default function InfoModal({
  visible,
  title,
  message,
  onDismiss,
  buttonLabel = 'Got it',
}: InfoModalProps) {
  return (
    <NLBBModalFrame
      visible={visible}
      title={title}
      message={message}
      icon="info"
      tone="info"
      animated
      onRequestClose={onDismiss}
    >
      <NLBBModalActions primaryLabel={buttonLabel} onPrimary={onDismiss} single />
    </NLBBModalFrame>
  );
}
