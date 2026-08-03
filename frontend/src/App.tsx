import React from 'react';
import { ChatProvider } from './context/ChatContext';
import { ChatPage } from './pages/ChatPage';

export function App() {
  return (
    <ChatProvider>
      <ChatPage />
    </ChatProvider>
  );
}

export default App;
