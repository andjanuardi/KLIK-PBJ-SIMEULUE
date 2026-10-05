import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { ensureSeed } from "./lib/seed";
import Admin from "./pages/Admin";
import Ajukan from "./pages/Ajukan";
import Detail from "./pages/Detail";
import Home from "./pages/Home";
import Lacak from "./pages/Lacak";
import Login from "./pages/Login";
import Sukses from "./pages/Sukses";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  useEffect(() => { ensureSeed(); }, []);
  return (
    <BrowserRouter>
      <ScrollTop />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ajukan" element={<Ajukan />} />
            <Route path="/sukses/:kode" element={<Sukses />} />
            <Route path="/lacak" element={<Lacak />} />
            <Route path="/konsultasi/:kode" element={<Detail />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
