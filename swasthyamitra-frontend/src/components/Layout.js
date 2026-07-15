import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ currentView, onViewChange, isAdmin, children }) => {
  // Chat view needs to be strictly constrained to screen height to allow internal scrolling.
  // Other views can scroll the main container.
  const isChat = currentView === 'chat';
  
  return (
    <div className="flex h-screen overflow-hidden p-6 gap-6 relative">
      {/* Sidebar Navigation */}
      <Sidebar currentView={currentView} onViewChange={onViewChange} isAdmin={isAdmin} />

      {/* Main Content Area */}
      <main className={`flex-1 h-full glass-card p-6 md:p-8 flex flex-col ${isChat ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={`w-full mx-auto flex flex-col ${isChat ? 'h-full max-w-6xl' : 'max-w-6xl'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
