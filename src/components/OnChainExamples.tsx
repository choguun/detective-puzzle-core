'use client';

import React, { useState } from 'react';
import { 
  useAccount, 
  useBalance, 
  useSendTransaction, 
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract
} from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Example ERC20 ABI (simplified for demo)
const erc20Abi = [
  {
    "inputs": [
      {"name": "spender", "type": "address"},
      {"name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// USDC contract on Ethereum mainnet
const usdcContractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as const;

export default function OnChainExamples() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  
  // ETH Transfer states
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('0.001');
  
  // Contract interaction states  
  const [spender, setSpender] = useState('');
  const [approveAmount, setApproveAmount] = useState('10');
  
  // Transaction sending hooks
  const { 
    data: sendTransactionData, 
    sendTransaction, 
    isPending: isSendingEth
  } = useSendTransaction();
  
  // Wait for transaction receipt
  const { 
    data: txReceipt,
    isLoading: isWaitingForTx
  } = useWaitForTransactionReceipt({ 
    hash: sendTransactionData 
  });
  
  // Contract interaction hooks
  const { 
    data: writeContractData,
    writeContract,
    isPending: isContractWritePending 
  } = useWriteContract();
  
  // Wait for contract transaction receipt
  const { 
    data: contractTxReceipt,
    isLoading: isWaitingForContractTx,
    isSuccess: isContractTxSuccess 
  } = useWaitForTransactionReceipt({ 
    hash: writeContractData 
  });
  
  // Read token balance
  const { 
    data: tokenBalance,
    refetch: refetchTokenBalance
  } = useReadContract({
    address: usdcContractAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });
  
  // Read token symbol
  const { 
    data: tokenSymbol 
  } = useReadContract({
    address: usdcContractAddress,
    abi: erc20Abi,
    functionName: 'symbol',
    query: {
      enabled: !!address,
    }
  });

  // Handle ETH transaction
  const handleSendEth = async () => {
    if (!recipient.startsWith('0x') || !amount) return;
    
    try {
      await sendTransaction({ 
        to: recipient as `0x${string}`,
        value: parseEther(amount), 
      });
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };
  
  // Handle contract interaction
  const handleApproveTokens = async () => {
    if (!spender.startsWith('0x') || !approveAmount) return;
    
    try {
      await writeContract({
        address: usdcContractAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender as `0x${string}`, parseEther(approveAmount)],
      });
    } catch (error) {
      console.error('Contract interaction failed:', error);
    }
  };
  
  // Refresh token balance after transaction
  React.useEffect(() => {
    if (isContractTxSuccess) {
      refetchTokenBalance();
    }
  }, [isContractTxSuccess, refetchTokenBalance]);

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardHeader>
          <CardTitle>On-Chain Examples</CardTitle>
          <CardDescription>Connect your wallet to interact with on-chain examples</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>On-Chain Examples</span>
          <Badge variant="outline" className="ml-2">
            {balance ? `${formatEther(balance.value).substring(0, 6)} ${balance.symbol}` : 'Loading...'}
          </Badge>
        </CardTitle>
        <CardDescription>Interact with blockchains using wagmi and viem</CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="eth" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="eth">Send ETH</TabsTrigger>
          <TabsTrigger value="contract">Contract Interaction</TabsTrigger>
        </TabsList>
        
        <TabsContent value="eth">
          <CardContent className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient Address</label>
              <Input
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (ETH)</label>
              <Input
                type="text"
                placeholder="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleSendEth}
              disabled={isSendingEth || isWaitingForTx || !recipient || !amount}
            >
              {isSendingEth ? 'Sending...' : 
               isWaitingForTx ? 'Confirming...' : 
               'Send ETH'}
            </Button>
            
            {txReceipt && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-300">
                  Transaction successful!
                </p>
                <p className="text-xs mt-1 break-all">
                  <a 
                    href={`https://etherscan.io/tx/${sendTransactionData}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View on Etherscan: {sendTransactionData?.substring(0, 20)}...
                  </a>
                </p>
                <p className="text-xs mt-1">
                  Gas used: {txReceipt.gasUsed.toString()}
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="contract">
          <CardContent className="space-y-4 mt-4">
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
              <h3 className="text-sm font-medium mb-1">USDC Contract Interaction</h3>
              <p className="text-xs opacity-70">Contract: {usdcContractAddress.substring(0, 12)}...</p>
              <p className="text-xs opacity-70 mt-1">
                {tokenBalance && tokenSymbol ? 
                  `Your balance: ${formatEther(tokenBalance)} ${tokenSymbol}` : 
                  'Loading token data...'}
              </p>
            </div>
          
            <div className="space-y-2">
              <label className="text-sm font-medium">Spender Address (for approve)</label>
              <Input
                placeholder="0x..."
                value={spender}
                onChange={(e) => setSpender(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount to Approve</label>
              <Input
                type="text"
                placeholder="10"
                value={approveAmount}
                onChange={(e) => setApproveAmount(e.target.value)}
              />
            </div>
            
            <Button 
              className="w-full" 
              onClick={handleApproveTokens}
              disabled={isContractWritePending || isWaitingForContractTx || !spender || !approveAmount}
            >
              {isContractWritePending ? 'Approving...' : 
               isWaitingForContractTx ? 'Confirming...' : 
               `Approve ${approveAmount} tokens`}
            </Button>
            
            {contractTxReceipt && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-300">
                  Contract interaction successful!
                </p>
                <p className="text-xs mt-1 break-all">
                  <a 
                    href={`https://etherscan.io/tx/${writeContractData}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View on Etherscan: {writeContractData?.substring(0, 20)}...
                  </a>
                </p>
                <p className="text-xs mt-1">
                  Gas used: {contractTxReceipt.gasUsed.toString()}
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <Separator className="my-4" />
      
      <CardFooter className="flex flex-col">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Connected as: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Using wagmi v2 and viem for on-chain interactions
        </p>
      </CardFooter>
    </Card>
  );
} 