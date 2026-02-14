import React, { type PropsWithChildren } from 'react';

import { SettingsProvider } from './settings-context';
import { AuthProvider } from './auth-context';
import { UploadProvider } from './upload-context';

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <SettingsProvider>
      <AuthProvider>
        <UploadProvider>{children}</UploadProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
