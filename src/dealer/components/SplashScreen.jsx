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

      <div className="wipe-wrapper">
        <img src="/assets/icon-512.png" alt="Dealrix Logo" className="wipe-img" />
      </div>

    </div>
  );
}