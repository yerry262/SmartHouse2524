import React, { createContext, useContext, useState, useEffect } from 'react';

const AccountContext = createContext();

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
};

export const AccountProvider = ({ children }) => {
  const [linkedAccounts, setLinkedAccounts] = useState(() => {
    const saved = localStorage.getItem('smarthouse_linked_accounts');
    return saved ? JSON.parse(saved) : {};
  });
  const [accountsPanelOpen, setAccountsPanelOpen] = useState(false);

  // Save to localStorage whenever linkedAccounts changes
  useEffect(() => {
    localStorage.setItem('smarthouse_linked_accounts', JSON.stringify(linkedAccounts));
  }, [linkedAccounts]);

  const linkAccount = (providerId, accountData) => {
    setLinkedAccounts(prev => ({
      ...prev,
      [providerId]: {
        ...accountData,
        linkedAt: new Date().toISOString(),
      }
    }));
  };

  const unlinkAccount = (providerId) => {
    setLinkedAccounts(prev => {
      const updated = { ...prev };
      delete updated[providerId];
      return updated;
    });
  };

  const isAccountLinked = (providerId) => {
    return !!linkedAccounts[providerId];
  };

  const getAccountData = (providerId) => {
    return linkedAccounts[providerId] || null;
  };

  const openAccountsPanel = () => setAccountsPanelOpen(true);
  const closeAccountsPanel = () => setAccountsPanelOpen(false);
  const toggleAccountsPanel = () => setAccountsPanelOpen(prev => !prev);

  const value = {
    linkedAccounts,
    linkAccount,
    unlinkAccount,
    isAccountLinked,
    getAccountData,
    accountsPanelOpen,
    openAccountsPanel,
    closeAccountsPanel,
    toggleAccountsPanel,
    linkedCount: Object.keys(linkedAccounts).length,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export default AccountContext;
