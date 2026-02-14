import { useContext } from 'react';

import { AuthContext } from '@/providers/auth-context';

export function useGoogleAuth() {
  return useContext(AuthContext);
}
