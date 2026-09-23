import React from 'react';
import { HelmetProvider } from 'react-helmet-async';

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => (
  <HelmetProvider>
    {children}
  </HelmetProvider>
);
