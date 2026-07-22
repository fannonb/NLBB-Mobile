import React from 'react';
import NLBBModalFrame, { NLBBModalActions } from './ui/NLBBModalFrame';

interface LoginErrorModalProps {
  visible: boolean;
  onDismiss: () => void;
  errorType?: 'invalid_credentials' | 'network' | 'server' | 'empty_fields';
  titleOverride?: string;
  messageOverride?: string;
  hintOverride?: string;
}

const ERROR_CONFIG = {
  invalid_credentials: {
    title: 'Sign in failed',
    message: 'The email or password you entered is incorrect. Please check your details and try again.',
    icon: 'lock' as const,
    hint: 'Tip: Make sure caps lock is off and check for extra spaces.',
  },
  network: {
    title: 'Connection problem',
    message: 'We could not reach NLBB right now. Check your internet connection and try again.',
    icon: 'wifi-off' as const,
    hint: 'A stable connection is required to sign in.',
  },
  server: {
    title: 'Something went wrong',
    message: 'Our servers hit a snag. Please wait a moment and try signing in again.',
    icon: 'cloud-off' as const,
    hint: 'If this keeps happening, try again in a few minutes.',
  },
  empty_fields: {
    title: 'Almost there',
    message: 'Enter both your email and password to continue into NLBB.',
    icon: 'edit-3' as const,
    hint: 'Both fields are required to sign in.',
  },
};

export default function LoginErrorModal({
  visible,
  onDismiss,
  errorType = 'invalid_credentials',
  titleOverride,
  messageOverride,
  hintOverride,
}: LoginErrorModalProps) {
  const config = ERROR_CONFIG[errorType];
  const title = titleOverride ?? config.title;
  const message = messageOverride ?? config.message;
  const hint = hintOverride ?? config.hint;

  return (
    <NLBBModalFrame
      visible={visible}
      title={title}
      message={message}
      icon={config.icon}
      tone="error"
      animated
      footer={hint}
      onRequestClose={onDismiss}
    >
      <NLBBModalActions
        primaryLabel="Try again"
        onPrimary={onDismiss}
        secondaryLabel="Dismiss"
        onSecondary={onDismiss}
      />
    </NLBBModalFrame>
  );
}
