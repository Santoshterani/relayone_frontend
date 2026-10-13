import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ToastProvider from './components/common/ToastProvider';
import { SessionProvider } from './utils/contexts';
import Main from './components/Main';

/** Root: context providers around the main view. */
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SessionProvider>
          <Main />
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
