import { Component, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Lenis from "lenis";
import { Toaster } from "sonner";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Preloader from "@/components/Preloader";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Story from "@/pages/Story";
import Contact from "@/pages/Contact";
import { IntroContext, lenisRef } from "@/context/app";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center px-6">
          <p className="font-display text-2xl text-olive">Something went wrong.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/story" element={<Story />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </AnimatePresence>
  );
}

function AppShell() {
  const location = useLocation();
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setIntroDone(true);
      return;
    }
    const t = setTimeout(() => setIntroDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenisRef.current = lenis;
    let raf;
    const loop = (time) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const intro = useMemo(() => ({ done: introDone }), [introDone]);

  return (
    <IntroContext.Provider value={intro}>
      <Nav />
      <AnimatedRoutes />
      <Footer />
      <AnimatePresence>{!introDone && <Preloader />}</AnimatePresence>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#242716",
            color: "#F6F2E9",
            border: "1px solid #5A5C37",
            borderRadius: 0,
          },
        }}
      />
    </IntroContext.Provider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
