import React from 'react';
import { PhoneIde } from '../../phone ide';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Phone IDE - Cloud Mobile IDE & DevCopilot AI',
  description: 'Mobile-first cloud code editor, file explorer, integrated terminal, and AI coding assistant.'
};

export default function PhoneIdePage() {
  return <PhoneIde />;
}
