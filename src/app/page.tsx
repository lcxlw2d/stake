"use client"
import { useState, useEffect, useCallback } from "react"
import { getContract, parseEther, parseUnits, formatUnits, Abi, Address, } from "viem"
import { sepolia } from "viem/chains";
import { useAccount, useWalletClient, useBalance, useWriteContract, useChainId } from "wagmi"
import { waitForTransactionReceipt } from "viem/actions";
import styles from "./page.module.css";
import { useStakeContract } from "../hooks/useContract"
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FiArrowDown, FiInfo, FiZap, FiTrendingUp } from 'react-icons/fi';
import { toast } from "react-toastify";

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Pid } from "@/config/consts";
import { cn } from '@/utils/cn';
import { defaultChainId, viemClients } from '@/utils/client'
import { STAKE_CONTRACT_ADDRESS } from '@/config/consts'

export default function Home() {
  const stakeContract = useStakeContract();
  const { writeContractAsync } = useWriteContract()
  const [txHash, setTxHash] = useState<`0x${string}`>();
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [stakedTokenAmount, setStakedTokenAmount] = useState('0');
  const [tokenAddress, setTokenAddress] = useState('0xc0cF5768557F67eca6bd5c35eB25f5656979e30d');
  const [activeTab, setActiveTab] = useState('tab1');
  const tabs = [
    { key: 'tab1', label: 'Stake ETH' },
    { key: 'tab2', label: 'Stake ERC20 Tokens' }
  ];

  const [loading, setLoading] = useState(false);
  const { data } = useWalletClient();
  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: isConnected,
      refetchInterval: 10000,
      refetchIntervalInBackground: false,
    }
  });
  const currentChainId = useChainId() || defaultChainId;
  const [tokenSymbol, setTokenSymbol] = useState('Token');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [tokenAmount, setTokenAmount] = useState('0');

  const erc20Abi = [
    {
      "constant": true,
      "inputs": [{ "name": "owner", "type": "address" }],
      "name": "balanceOf",
      "outputs": [{ "name": "", "type": "uint256" }],
      "type": "function",
    },
    {
      "constant": true,
      "inputs": [],
      "name": "name",
      "outputs": [{ "name": "", "type": "string" }],
      "type": "function",
    },
    {
      "constant": true,
      "inputs": [],
      "name": "symbol",
      "outputs": [{ "name": "", "type": "string" }],
      "type": "function",
    },
    {
      "constant": false,
      "inputs": [
        { "name": "spender", "type": "address" },
        { "name": "amount", "type": "uint256" }
      ],
      "name": "approve",
      "outputs": [{ "name": "", "type": "bool" }],
      "type": "function"
    }
  ];

  async function getTokenInfo() {
    if (!tokenAddress) return;
    const addr = tokenAddress;
    const client = viemClients(currentChainId);
    const [balance, name, symbol] = await Promise.all([
      client.readContract({
        address: addr as Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      }),
      client.readContract({
        address: addr as Address,
        abi: erc20Abi,
        functionName: 'name',
        args: [],
      }),
      client.readContract({
        address: addr as Address,
        abi: erc20Abi,
        functionName: 'symbol',
        args: [],
      }),
    ])
    setTokenSymbol(symbol as string);
    setTokenBalance(parseFloat(formatUnits(balance as bigint, 18)));
  }
  async function onTokenAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const addr = e.target.value;
    setTokenAddress(addr);
    if (!addr) return;
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(addr)
    console.log(addr, isValidAddress)
    if (isValidAddress) {
      // 读取合约
      getTokenInfo();
    }
  }

  async function addPool() {
    if (!stakeContract || !data) return;
    // 0地址
    // const zeroAddress: Address = '0x0000000000000000000000000000000000000000';
    // const res = await stakeContract.write.addPool([zeroAddress, 60, 100000000000000, 8825587, true]);
    const MTKAddress: Address = '0xc0cF5768557F67eca6bd5c35eB25f5656979e30d';
    const res = await stakeContract.write.addPool([MTKAddress, 40, 100000000000000, 8825587, true]);
    console.log(res)
  }
  async function handleStakeToken() {
    if (!stakeContract || !data) return;
    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      toast.error('Please enter a valid tokenAmount');
      return;
    }
    if (parseFloat(tokenAmount) > tokenBalance) {
      toast.error('Amount cannot be greater than current balance');
      return;
    }
    console.log(tokenBalance, tokenAmount, '=-=-=')
    try {
      // const res = await stakeContract?.read.pool([1]);
      // console.log(res, 'pool=-=-=')
      // 0xc0cF5768557F67eca6bd5c35eB25f5656979e30d
      setLoading(true);
      // ERC20代币授权
      // const MTKAddress: Address = '0xc0cF5768557F67eca6bd5c35eB25f5656979e30d';
      const hash = await writeContractAsync({
        abi: erc20Abi,
        address: tokenAddress as Address,
        functionName: 'approve',
        args: [STAKE_CONTRACT_ADDRESS, parseUnits(tokenAmount, 18)],
      })
      const res1 = await waitForTransactionReceipt(data, { hash });
      console.log({ res1 })
      if (res1.status != 'success') {
        toast.error('Transaction failed');
        return;
      }
      const tx = await stakeContract.write.deposit([1, parseUnits(tokenAmount, 18)]);
      const res = await waitForTransactionReceipt(data, { hash: tx });
      console.log({ res })
      if (res.status === 'success') {
        toast.success('Stake successful!');
        setTokenAmount('');
        setLoading(false);
        getTokenInfo();
        return
      }
      toast.error('Stake failed!')
    } catch (error) {
      setLoading(false);
      toast.error('Transaction failed. Please try again.');
      console.log(error, 'stake-error');
    }
  }
  async function handleStake() {
    if (!stakeContract || !data) return;
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    console.log(balance)

    if (parseFloat(amount) > parseFloat(formatUnits(balance!.value, 18))) {
      toast.error('Amount cannot be greater than current balance');
      return;
    }
    setLoading(true);
    try {
      setLoading(true);
      const tx = await stakeContract.write.depositETH([], { value: parseUnits(amount, 18) });
      const res = await waitForTransactionReceipt(data, { hash: tx });
      console.log({ res })
      if (res.status === 'success') {
        toast.success('Stake successful!');
        setAmount('');
        setLoading(false);
        getStakedAmount();
        return
      }
      toast.error('Stake failed!')
    } catch (error) {
      setLoading(false);
      toast.error('Transaction failed. Please try again.');
      console.log(error, 'stake-error');
    }
  }
  const getStakedAmount = useCallback(async () => {
    if (address && stakeContract) {
      const res = await stakeContract?.read.stakingBalance([Pid, address]);
      setStakedAmount(formatUnits(res as bigint, 18));
      const resT = await stakeContract?.read.stakingBalance([1, address]);
      setStakedTokenAmount(formatUnits(resT as bigint, 18));
    }
  }, [stakeContract, address]);

  useEffect(() => {
    if (stakeContract && address) {
      getStakedAmount();
    }
    if (stakeContract && tokenAddress) {
      getTokenInfo();
    }
  }, [stakeContract, address, getStakedAmount, getTokenInfo, tokenAddress]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <div className="inline-block mb-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-2 border-primary-500/20 flex items-center justify-center shadow-xl"
            style={{ boxShadow: '0 0 60px 0 rgba(14,165,233,0.15)' }}
          >
            <FiZap className="w-12 h-12 text-primary-500" />
          </motion.div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent mb-2">
          MetaNode Stake
        </h1>

      </motion.div>
      <div className="w-full max-w-md mx-auto p-4">
        {/* Tab 按钮 */}
        <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={cn(
                "relative text-base lg:text-lg font-medium transition-all duration-300 group",
                activeTab === tab.key ? "text-primary-400" : "text-gray-400 hover:text-primary-400"
              )}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-[1.5px] left-0 right-0 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-400 group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div>
          {activeTab === 'tab1' && (
            <div className="p-4 rounded">
              <Card className="max-w-3xl min-h-[420px] mx-auto p-4 sm:p-8 md:p-12 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl border-primary-500/20 border-[1.5px] rounded-2xl sm:rounded-3xl">
                <div className="space-y-8 sm:space-y-12">
                  {/* Staked Amount Display */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 p-4 sm:p-8 bg-gray-800/70 rounded-xl sm:rounded-2xl border border-gray-700/50 group-hover:border-primary-500/50 transition-colors duration-300 shadow-lg">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 bg-primary-500/10 rounded-full">
                      <FiTrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-primary-400" />
                    </div>
                    <div className="flex flex-col justify-center flex-1 min-w-0 items-center sm:items-start">
                      <span className="text-gray-400 text-base sm:text-lg mb-1">Staked Amount</span>
                      <span className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent leading-tight break-all">
                        {parseFloat(stakedAmount).toFixed(4)} ETH
                      </span>
                    </div>
                  </div>

                  {/* Input Field */}
                  <div className="space-y-4 sm:space-y-6">
                    <Input
                      label="Amount to Stake"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.0"
                      rightElement={<span className="text-gray-500">ETH</span>}
                      helperText={balance ? `Available: ${parseFloat(balance.formatted).toFixed(4)} ETH` : undefined}
                      className="text-lg sm:text-xl py-3 sm:py-5"
                    />
                  </div>

                  {/* Stake Button */}
                  <div className="pt-4 sm:pt-8">
                    {!isConnected ? (
                      <div className="flex justify-center">
                        <div className="glow">
                          <ConnectButton />
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleStake}
                        disabled={loading || !amount}
                        loading={loading}
                        fullWidth
                        className="py-3 sm:py-5 text-lg sm:text-xl"
                      >
                        <FiArrowDown className="w-6 h-6 sm:w-7 sm:h-7" />
                        <span>Stake ETH</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
          {activeTab === 'tab2' && (
            <div className="p-4 rounded">
              <Card className="max-w-3xl min-h-[420px] mx-auto p-4 sm:p-8 md:p-12 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl border-primary-500/20 border-[1.5px] rounded-2xl sm:rounded-3xl">
                <div className="space-y-8 sm:space-y-12">
                  {/* Input Field */}
                  <div className="space-y-4 sm:space-y-6">
                    <Input
                      label="Your Token Address"
                      type="text"
                      value={tokenAddress}
                      onChange={onTokenAddressChange}
                      placeholder="Input address here"
                      helperText={`Your Balance: ${tokenBalance} ${tokenSymbol}`}
                      className="text-lg sm:text-xl py-3 sm:py-5"
                    />
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    Staked Token: {stakedTokenAmount} {tokenSymbol}
                  </div>
                  <div className="space-y-4 sm:space-y-6">
                    <Input
                      label="Amount to Stake"
                      type="number"
                      value={tokenAmount}
                      onChange={(e) => setTokenAmount(e.target.value)}
                      placeholder="0.0"
                      rightElement={<span className="text-gray-500">{tokenSymbol}</span>}
                      className="text-lg sm:text-xl py-3 sm:py-5"
                    />
                  </div>

                  {/* Stake Button */}
                  <div className="pt-4 sm:pt-8">
                    {!isConnected ? (
                      <div className="flex justify-center">
                        <div className="glow">
                          <ConnectButton />
                        </div>
                      </div>
                    ) : (
                      <Button
                        onClick={handleStakeToken}
                        disabled={loading || !tokenAmount}
                        loading={loading}
                        fullWidth
                        className="py-3 sm:py-5 text-lg sm:text-xl"
                      >
                        <FiArrowDown className="w-6 h-6 sm:w-7 sm:h-7" />
                        <span>Stake Token</span>
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
      {/* <Button onClick={() => addPool()}>add pool</Button> */}
    </div>
  );
}
