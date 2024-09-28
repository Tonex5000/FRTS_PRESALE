import React, { useState, useEffect, useContext } from 'react';
import { IoClose } from 'react-icons/io5';
import { toast, ToastContainer } from 'react-toastify';
import { WalletContext } from './WalletContext';
import { BrowserProvider } from 'ethers';
import { MetaMaskSDK } from '@metamask/sdk';
import 'react-toastify/dist/ReactToastify.css';

const BNB_MAINNET_CHAIN_ID = 56; // BSC Mainnet chain ID

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { account, setAccount } = useContext(WalletContext);
  const [metaMaskSDK, setMetaMaskSDK] = useState(null);

  useEffect(() => {
    const initSDK = async () => {
      const MMSDK = new MetaMaskSDK({
        dappMetadata: {
          name: "Ftrs_Presale",
          url: window.location.href,
        }
      });
      setMetaMaskSDK(MMSDK);
    };
    initSDK();
  }, []);

  useEffect(() => {
    if (account) {
      checkNetwork();
    }
  }, [account]);

  const checkNetwork = async (provider) => {
    try {
      const network = await provider.getNetwork();
      if (network.chainId !== BNB_MAINNET_CHAIN_ID) {
        toast.error('Please switch to Binance Smart Chain Mainnet in your wallet.', {
          position: "bottom-right",
          autoClose: 5000,
          closeOnClick: true,
          draggable: false,
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const ethereum = metaMaskSDK ? metaMaskSDK.getProvider() : window.ethereum;
      
      if (ethereum) {
        await ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        if (await checkNetwork(provider)) {
          setAccount(address);
          setIsOpen(false);
          toast.success('Wallet connected successfully', {
            position: "bottom-right",
            autoClose: 5000,
            closeOnClick: true,
            draggable: false,
          });

          ethereum.on('accountsChanged', handleAccountsChanged);
        }
      } else {
        throw new Error('MetaMask not detected');
      }
    } catch (error) {
      console.error("Error connecting MetaMask: ", error);
      toast.error('Failed to connect wallet. Please install MetaMask and try again.', {
        position: "bottom-right",
        autoClose: 5000,
        closeOnClick: true,
        draggable: false,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      toast.info('Disconnected from wallet', {
        position: "bottom-right",
        autoClose: 5000,
        closeOnClick: true,
        draggable: false,
      });
    } else {
      setAccount(accounts[0]);
      toast.info('Wallet account changed', {
        position: "bottom-right",
        autoClose: 5000,
        closeOnClick: true,
        draggable: false,
      });
    }
  };

  function handleDisconnect() {
    setAccount(null);
    toast.info('Disconnected from wallet', {
      position: "bottom-right",
      autoClose: 5000,
      closeOnClick: true,
      draggable: false,
    });
  }

  const handleConnectClick = () => {
    connectWallet();
  };

  return (
    <>
      <div className="w-full flex flex-col justify-end items-baseline h-[8vh] md:h-[12vh]">
        <button
          className="bg-transparent px-[25px] py-[10px] text-[16px] border-white border-[2px] font-[900] rounded-[10px] text-white self-end"
          onClick={() => account ? handleDisconnect() : setIsOpen(true)}
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
                onClick={handleConnectClick}
                disabled={isConnecting}
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </section>
          </section>
        </div>
      )}
      <ToastContainer />
    </>
  );
};

export default Navbar;