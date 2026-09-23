import React from 'react';
import './Layout.scss';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => (
  <div className={'layout'}>
    {children}
  </div>
);
