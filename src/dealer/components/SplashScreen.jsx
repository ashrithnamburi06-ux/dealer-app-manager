import { useEffect } from "react";
import "./SplashScreen.css";

export default function SplashScreen({ onFinish }) {

  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="splash-container">

      <div className="logo-wrapper">
        <img src="/assets/icon-512.png" alt="Dealrix Logo" className="logo-img" />
        <h2 className="tagline">Dealer Management App</h2>
      </div>

      <div className="loader"></div>

    </div>
  );
}