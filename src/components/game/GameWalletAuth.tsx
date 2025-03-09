'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Spinner from "../ui/spinner";

interface GameWalletAuthProps {
  onAuthenticated: () => void;
  isGameStarted: boolean;
}

export default function GameWalletAuth({ onAuthenticated, isGameStarted }: GameWalletAuthProps) {
  // Client-side rendering state
  const [mounted, setMounted] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  // Only initialize Wagmi hooks after mounting to prevent hydration errors
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessage, isPending: isSigningPending } = useSignMessage();

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true);
    
    // Initialize dialog state only after mounting
    setShowAuthDialog(!isGameStarted);
    
    // Check if already authenticated in localStorage
    const isAuthenticated = localStorage.getItem('wallet_authenticated');
    if (isAuthenticated && address) {
      setIsSigned(true);
      onAuthenticated();
    }
  }, [address, isGameStarted, onAuthenticated]);

  // Check if the dialog should be shown based on game state
  useEffect(() => {
    if (mounted && !isGameStarted && !isSigned) {
      setShowAuthDialog(true);
    }
  }, [isGameStarted, mounted, isSigned]);

  const handleConnect = async () => {
    try {
      await connect({ connector: injected() });
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  const handleSignAndPlay = async () => {
    if (!isConnected) {
      handleConnect();
      return;
    }
    
    try {
      const signature = await signMessage({ 
        message: 'I confirm that I want to play the Mystery Room Game' 
      });
      console.log('Message signed:', signature);
      
      // Store authentication in localStorage
      localStorage.setItem('wallet_authenticated', 'true');
      localStorage.setItem('wallet_address', address || '');
      localStorage.setItem('wallet_signature', String(signature));
      
      setIsSigned(true);
      onAuthenticated();
      setShowAuthDialog(false);
    } catch (error) {
      console.error('Signing error:', error);
    }
  };

  // Don't render during SSR or before mounting
  if (!mounted) return null;

  return (
    <>
      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md bg-slate-900 text-white border border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Mystery Room</DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-center">
                Connect your wallet and sign a message to begin your investigation.
              </p>
              
              {isConnected ? (
                <div className="space-y-6 w-full">
                  <div className="text-center text-sm bg-slate-800 p-3 rounded-md">
                    <span className="font-medium">Connected as:</span>
                    <div className="text-amber-400 font-mono mt-1">{address}</div>
                  </div>
                  
                  {isSigned ? (
                    <div className="bg-green-900/50 p-3 rounded-md text-center">
                      <span className="text-green-400">✓ Signature verified</span>
                    </div>
                  ) : (
                    <Button 
                      onClick={handleSignAndPlay}
                      disabled={isSigningPending}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {isSigningPending ? (
                        <span className="flex items-center">
                          <Spinner className="mr-2 h-4 w-4" /> Signing...
                        </span>
                      ) : (
                        'Sign & Begin Investigation'
                      )}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={() => disconnect()}
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Use Different Wallet
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isConnecting ? (
                    <span className="flex items-center">
                      <Spinner className="mr-2 h-4 w-4" /> Connecting...
                    </span>
                  ) : (
                    'Connect Wallet'
                  )}
                </Button>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-col sm:space-y-2">
            <p className="text-xs text-slate-400 text-center">
              By connecting your wallet, you&apos;ll be able to authenticate your progress and potentially earn rewards.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Mini display in game */}
      {isConnected && isSigned && !showAuthDialog && (
        <div className="fixed top-4 right-4 z-10">
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-800/70 hover:bg-slate-700/70 text-amber-400 border-slate-700 text-xs"
            onClick={() => setShowAuthDialog(true)}
          >
            <div className="flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              <span className="font-mono truncate max-w-[100px]">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </div>
          </Button>
        </div>
      )}
    </>
  );
} 