'use client';

import React, { useState, useEffect } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Sample ERC20 ABI for approve function
const erc20AbiApprove = [
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function WalletExamplesPage() {
  const [mounted, setMounted] = useState(false);
  const { address, isConnected } = useAccount();
  
  // ETH transaction states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.001');
  
  // Contract states
  const [contractAddress, setContractAddress] = useState('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'); // USDC
  const [spender, setSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('10');
  
  // Only run on client-side
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // ETH Transaction hooks
  const { data: hash, sendTransaction, isPending } = useSendTransaction();
  
  // ETH Receipt hooks
  const { 
    data: receipt,
    isLoading: isConfirming,
    isSuccess: isSuccessful
  } = useWaitForTransactionReceipt({ hash });
  
  // Contract interaction hooks
  const {
    data: contractTxHash,
    writeContract,
    isPending: isContractPending
  } = useWriteContract();
  
  // Contract receipt hooks
  const {
    data: contractReceipt,
    isLoading: isContractConfirming,
    isSuccess: isContractSuccessful
  } = useWaitForTransactionReceipt({ hash: contractTxHash });
  
  // Handle ETH transaction
  const handleSendTransaction = async () => {
    if (!recipient.startsWith('0x')) {
      alert('Please enter a valid address starting with 0x');
      return;
    }
    
    try {
      await sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount)
      });
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  };
  
  // Handle contract interaction
  const handleContractInteraction = async () => {
    if (!contractAddress.startsWith('0x') || !spender.startsWith('0x')) {
      alert('Please enter valid addresses starting with 0x');
      return;
    }
    
    try {
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: erc20AbiApprove,
        functionName: 'approve',
        args: [spender as `0x${string}`, parseEther(approveAmount)]
      });
    } catch (error) {
      console.error('Error in contract interaction:', error);
    }
  };
  
  // Don't render during SSR
  if (!mounted) {
    return <div className="p-8 text-center">Loading wallet examples...</div>;
  }

  return (
    <main className="container max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">On-Chain Transaction Examples</h1>
      
      {!isConnected ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>You need to connect your wallet to interact with the blockchain.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
            Connected as: <span className="font-mono">{address}</span>
          </div>
          
          <Tabs defaultValue="eth" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="eth">Send ETH</TabsTrigger>
              <TabsTrigger value="contract">Contract Interaction</TabsTrigger>
            </TabsList>
            
            {/* ETH Transaction Tab */}
            <TabsContent value="eth">
              <Card>
                <CardHeader>
                  <CardTitle>Send Ethereum</CardTitle>
                  <CardDescription>Send ETH to any address on the network.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Recipient Address:</label>
                      <Input 
                        placeholder="0x..." 
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Amount (ETH):</label>
                      <Input 
                        placeholder="0.001" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleSendTransaction}
                      disabled={isPending || isConfirming}
                    >
                      {isPending ? 'Sending Transaction...' : 
                      isConfirming ? 'Waiting for Confirmation...' : 
                      'Send ETH'}
                    </Button>
                  </div>
                </CardContent>
                
                {isSuccessful && receipt && (
                  <CardFooter className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                    <div className="w-full">
                      <h3 className="font-semibold text-green-600 dark:text-green-400">Transaction Confirmed!</h3>
                      <p className="text-sm mt-2">Transaction Hash: <span className="font-mono">{hash?.substring(0, 12)}...</span></p>
                      <p className="text-sm mt-1">Gas Used: {receipt.gasUsed.toString()}</p>
                      <p className="text-sm mt-1">
                        <a
                          href={`https://etherscan.io/tx/${hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View on Etherscan
                        </a>
                      </p>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            {/* Contract Interaction Tab */}
            <TabsContent value="contract">
              <Card>
                <CardHeader>
                  <CardTitle>Contract Interaction</CardTitle>
                  <CardDescription>Approve an ERC20 token spend (e.g., USDC).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token Contract Address:</label>
                      <Input 
                        placeholder="0x..." 
                        value={contractAddress}
                        onChange={(e) => setContractAddress(e.target.value)}
                      />
                      <p className="text-xs text-gray-500">Default: USDC on Ethereum</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Spender Address:</label>
                      <Input 
                        placeholder="0x..." 
                        value={spender}
                        onChange={(e) => setSpender(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Approve Amount:</label>
                      <Input 
                        placeholder="10" 
                        value={approveAmount}
                        onChange={(e) => setApproveAmount(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={handleContractInteraction}
                      disabled={isContractPending || isContractConfirming}
                    >
                      {isContractPending ? 'Preparing Transaction...' : 
                      isContractConfirming ? 'Waiting for Confirmation...' : 
                      'Approve Tokens'}
                    </Button>
                  </div>
                </CardContent>
                
                {isContractSuccessful && contractReceipt && (
                  <CardFooter className="border-t border-gray-200 dark:border-gray-700 mt-4 pt-4">
                    <div className="w-full">
                      <h3 className="font-semibold text-green-600 dark:text-green-400">Contract Interaction Successful!</h3>
                      <p className="text-sm mt-2">Transaction Hash: <span className="font-mono">{contractTxHash?.substring(0, 12)}...</span></p>
                      <p className="text-sm mt-1">Gas Used: {contractReceipt.gasUsed.toString()}</p>
                      <p className="text-sm mt-1">
                        <a
                          href={`https://etherscan.io/tx/${contractTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View on Etherscan
                        </a>
                      </p>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>These examples demonstrate how to use wagmi and viem to perform on-chain transactions.</p>
            <p className="mt-1">The transactions are sent to the connected network (Ethereum Mainnet or testnet).</p>
            <p className="mt-4 text-xs">
              <strong>Note:</strong> Always use test networks or small amounts when testing.
            </p>
          </div>
        </>
      )}
    </main>
  );
} 