import React, { useState, useEffect, useContext } from 'react';
import { IoClose } from 'react-icons/io5';
import { toast, ToastContainer } from 'react-toastify';
import { WalletContext } from './WalletContext';
import 'react-toastify/dist/ReactToastify.css';
import Moralis from 'moralis';

const BNB_TESTNET_CHAIN_ID = '0x61'; // BNB Testnet chain ID (97 in decimal)

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { account, setAccount } = useContext(WalletContext);

  useEffect(() => {
    const initMoralis = async () => {
      try {
        await Moralis.start({ apiKey: 'YOUR_MORALIS_API_KEY' });
      } catch (error) {
        console.error('Failed to initialize Moralis:', error);
      }
    };
    initMoralis();
  }, []);

  useEffect(() => {
    if (account) {
      checkNetwork();
    }
  }, [account]);

  const checkNetwork = async () => {
    try {
      const chain = await Moralis.EvmApi.chain.getChain();
      if (chain.chainId !== BNB_TESTNET_CHAIN_ID) {
        await switchNetwork();
      }
      return true;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  };

  const switchNetwork = async () => {
    try {
      await Moralis.EvmApi.network.switchNetwork({
        chainId: BNB_TESTNET_CHAIN_ID,
      });
    } catch (error) {
      if (error.code === 4902) {
        await addNetwork();
      } else {
        throw error;
      }
    }
  };

  const addNetwork = async () => {
    try {
      await Moralis.EvmApi.network.addNetwork({
        chainId: BNB_TESTNET_CHAIN_ID,
        chainName: 'BNB Smart Chain Testnet',
        currencyName: 'BNB',
        currencySymbol: 'tBNB',
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
        blockExplorerUrl: 'https://testnet.bscscan.com',
      });
    } catch (error) {
      console.error('Failed to add BNB Testnet:', error);
      throw error;
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      await checkNetwork();
      const connectorId = window.ethereum ? 'metamask' : 'walletconnect';
      const response = await Moralis.Auth.requestEthereumAccounts({ connectorId });
      setAccount(response[0]);
      setIsOpen(false);
      toast.success('Wallet connected successfully', {
        position: "bottom-right",
        autoClose: 5000,
        closeOnClick: true,
        draggable: false,
        toastId: 17,
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please make sure you are on the BNB Testnet.', {
        position: "bottom-right",
        autoClose: 5000,
        closeOnClick: true,
        draggable: false,
        toastId: 19,
      });
    } finally {
      setIsConnecting(false);
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