'use client';

import React, { useState, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Create a Wagmi client config
const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [injected()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

export default function WagmiWrapper({ children }: { children: React.ReactNode }) {
  // State for React Query client to avoid hydration issues
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  // Only render wagmi components client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  // If not mounted yet, just render children without Wagmi
  if (!mounted) return <>{children}</>;

  // Once mounted, wrap with Wagmi providers
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
} 