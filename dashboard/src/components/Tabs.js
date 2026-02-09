import React, { useState } from 'react';
import { Button } from './ui/button'; // Assuming shadcn/ui button

const Tabs = ({ tabs, activeTab: externalActiveTab, onTabChange }) => {
  const [internalActiveTab, setInternalActiveTab] = useState(0);

  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  return (
    <div className="flex flex-col h-full">
      <div className="flex space-x-1 p-1 bg-zinc-800 rounded-lg">
        {tabs.map((tab, index) => (
          <Button
            key={index}
            variant={activeTab === index ? 'default' : 'ghost'}
            onClick={() => setActiveTab(index)}
            className="flex-1"
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div className="flex-grow p-2 mt-2 bg-zinc-800/50 rounded-lg overflow-y-auto">
        {tabs[activeTab] && tabs[activeTab].content}
      </div>
    </div>
  );
};

export default Tabs;
