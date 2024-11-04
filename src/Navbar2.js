import React, { useState, useEffect, useContext } from 'react';
import { IoClose } from 'react-icons/io5';
import { toast, ToastContainer } from 'react-toastify';
import { WalletContext } from './WalletContext';
import {BrowserProvider, ethers} from 'ethers';
import 'react-toastify/dist/ReactToastify.css';

const BNB_TESTNET_CHAIN_ID = '0x61'; // BNB Testnet chain ID (97 in decimal)

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { account, setAccount } = useContext(WalletContext);

  useEffect(() => {
    if (account) {
      checkAndSwitchNetwork();
    }
  }, [account]);

  const checkAndSwitchNetwork = async () => {
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log(chainId)
        console.log(BNB_TESTNET_CHAIN_ID)
  
        if (chainId !== BNB_TESTNET_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: BNB_TESTNET_CHAIN_ID }],
            });
          } catch (switchError) {
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: BNB_TESTNET_CHAIN_ID,
                      chainName: 'BNB Smart Chain Testnet',
                      nativeCurrency: {
                        name: 'BNB',
                        symbol: 'tBNB',
                        decimals: 18,
                      },
                      rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
                      blockExplorerUrls: ['https://testnet.bscscan.com'],
                    },
                  ],
                });
              } catch (addError) {
                console.error('Failed to add BNB Smart Chain:', addError);
                throw addError;
              }
            } else {
              console.error('Failed to switch network:', switchError);
              throw switchError;
            }
          }
        }
        return true;
      } catch (error) {
        console.error('Error checking/switching network:', error);
        throw error;
      }
    } else {
      console.error('MetaMask is not installed');
      throw new Error('MetaMask is not installed');
    }
  };
  
  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      setIsConnecting(true);
      try {
        // Check and switch network before connecting
        await checkAndSwitchNetwork();
  
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setAccount(address);
        setIsOpen(false);
        toast.success('Wallet connected successfully', {
          position: "bottom-right",
          autoClose: 5000,
          closeOnClick: true,
          draggable: false,
          toastId: 17,
        });
  
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length === 0) {
            setAccount(null);
            toast.info('Disconnected from MetaMask', {
              position: "bottom-right",
              autoClose: 5000,
              closeOnClick: true,
              draggable: false,
            });
          } else {
            setAccount(accounts[0]);
            toast.info('MetaMask account changed', {
              position: "bottom-right",
              autoClose: 5000,
              closeOnClick: true,
              draggable: false,
            });
          }
        });
      } catch (error) {
        console.error("Error connecting MetaMask: ", error);
        toast.error('Failed to connect wallet. Please ensure you are on the BNB Smart Chain network and try again.', {
          position: "bottom-right",
          autoClose: 5000,
          closeOnClick: true,
          draggable: false,
          toastId: 19,
        });
      } finally {
        setIsConnecting(false);
      }
    } else {
      console.error('MetaMask not detected');
      toast.error('MetaMask is not installed. Please install it to use this feature.', {
        position: "bottom-right",
        autoClose: false,
        closeOnClick: true,
        draggable: false,
        toastId: 18,
      });
    }
  };

  return (
    <>
      <div className="w-full flex flex-col justify-end items-baseline h-[8vh] md:h-[12vh]">
        <button
          className="bg-transparent px-[25px] py-[10px] text-[16px] border-white border-[2px] font-[900] rounded-[10px] text-white self-end"
          onClick={() => setIsOpen(true)}
        >
          {account ? `Connected: ${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Connect Wallet'}
        </button>
      </div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed z-[1050] top-0 left-0 right-0 bottom-0 bg-[#00000080] flex items-center justify-center"
        >
          <section 
            className="bg-[#11141F] max-w-[400px] rounded-[10px] z-[1060] py-[16px] pb-[30px] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="flex justify-center items-center h-[40px] w-[40px] rounded-full bg-[#1A1F2E] absolute top-[20px] right-[20px] cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <IoClose size={24} />
            </div>
            <section className="p-12">
              <h2 className="text-[24px] font-sans mb-6">Connect Wallet to continue</h2>
              <button
                className="w-full bg-[#6cdf00] text-white py-2 px-4 rounded mb-2"
                onClick={connectWallet}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </section>
          </section>
        </div>
      )}
      <ToastContainer containerId={"networkError"} />
    </>
  );
};

export default Navbar;