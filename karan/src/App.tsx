import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import RootLayout from './components/layout/RootLayout';
import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import LostFound from './pages/LostFound';
import Profile from './pages/Profile';
import ItemDetails from './pages/ItemDetails';
import Chat from './pages/Chat';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/lost-found" element={<LostFound />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/item/:id" element={<ItemDetails />} />
          <Route path="/chat/:chatId?" element={<Chat />} />
        </Route>
      </Routes>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))'
          }
        }}
      />
    </BrowserRouter>
  );
}
