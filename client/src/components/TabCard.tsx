import { useState } from "react";

export function TabCardWithState({
  className,
  defaultTab,
  render,
  tabs,
}: {
  className?: string;
  defaultTab?: string;
  render: (tab: string) => React.ReactNode | React.ReactNode[];
  tabs: { label: string; id: string }[];
}) {
  const [selectedTab, setSelectedTab] = useState(() => {
    if (defaultTab) {
      return defaultTab;
    }
    if (tabs.length > 0) {
      return tabs[0].id;
    }
    return "";
  });

  return (
    <div className={className}>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              if (tab.id === selectedTab) {
                return (
                  <button className="border-indigo-500 text-indigo-600 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm">
                    {tab.label}
                  </button>
                );
              }

              return (
                <button
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm"
                  onClick={() => {
                    setSelectedTab(tab.id);
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="px-6 py-5">{render(selectedTab)}</div>
      </div>
    </div>
  );
}
