import React, { useState, useEffect, useContext } from 'react';
import { IoClose } from 'react-icons/io5';
import { toast, ToastContainer } from 'react-toastify';
import { WalletContext } from './WalletContext';
import { BrowserProvider, ethers } from 'ethers';
import WalletConnectProvider from "@walletconnect/web3-provider";
import QRCodeModal from "@walletconnect/qrcode-modal";
import 'react-toastify/dist/ReactToastify.css';

const BNB_MAINNET_CHAIN_ID = 56; // BSC Mainnet chain ID

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { account, setAccount } = useContext(WalletContext);
  const [walletConnectProvider, setWalletConnectProvider] = useState(null);

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
    if (typeof window.ethereum !== 'undefined') {
      setIsConnecting(true);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const provider = new BrowserProvider(window.ethereum);
        const signer = provider.getSigner();
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

          window.ethereum.on('accountsChanged', handleAccountsChanged);
        }
      } catch (error) {
        console.error("Error connecting MetaMask: ", error);
        toast.error('Failed to connect wallet. Please try again.', {
          position: "bottom-right",
          autoClose: 5000,
          closeOnClick: true,
          draggable: false,
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
      });
    }
  };

  const connectWithWalletConnect = async () => {
    try {
      const provider = new WalletConnectProvider({
        rpc: {
          56: "https://bsc-dataseed.binance.org/", // BSC Mainnet RPC URL
        },
        chainId: BNB_MAINNET_CHAIN_ID,
        qrcodeModal: QRCodeModal,
      });

      setIsConnecting(true);

      // Subscribe to connection events
      provider.on("display_uri", (uri) => {
        QRCodeModal.open(uri, () => {
          console.log("QR Code Modal closed");
        });
      });

      // Enable session (triggers QR Code modal)
      await provider.enable();

      // Close QR Code modal after successful connection
      QRCodeModal.close();

      const web3Provider = new BrowserProvider(provider);

      if (await checkNetwork(web3Provider)) {
        const signer = web3Provider.getSigner();
        const address = await signer.getAddress();

        setAccount(address);
        setWalletConnectProvider(provider);
        setIsOpen(false);
        toast.success('Wallet connected successfully via WalletConnect', {
          position: "bottom-right",
          autoClose: 5000,
          closeOnClick: true,
          draggable: false,
        });

        provider.on('accountsChanged', handleAccountsChanged);
      }
    } catch (error) {
      console.error("Error connecting with WalletConnect: ", error);
      toast.error('Failed to connect wallet. Please try again.', {
        position: "bottom-right",
        autoClose: 5000,
        closeOnClick: true,
        draggable: false,
      });
      QRCodeModal.close();
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

  }

  const handleConnectClick = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      connectWithWalletConnect();
    } else {
      connectWallet();
    }
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