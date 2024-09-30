import buffer from 'buffer';

import logo from './logo.svg';
import './App.css';
import Main from './main3';
import { MoralisProvider } from "react-moralis";
import Footer from './Footer';
import { WalletProvider } from './WalletContext';
import Header from './Header';
import Navbar from './Navbar3';


window.Buffer = buffer.Buffer;

function App() {
  return (
    <>
      <Header />
      {/* Background container with an overlay */}
      <div className="relative text-[#6CDF00] px-[3vw] text-center min-h-screen">
        {/* Background image */}
        <div className="absolute inset-0 bg-[url('/src/assets/bg.jpg')] bg-cover bg-center"></div>
        
        {/* Semi-transparent black overlay */}
        <div className="absolute inset-0 bg-black opacity-55"></div>

        {/* Content */}
        <section className="relative z-10 max-w-[650px] mx-auto">
          <WalletProvider>
            <Main />
            <Footer />
          </WalletProvider>
        </section>
      </div>
    </>
  );
}

export default App;
