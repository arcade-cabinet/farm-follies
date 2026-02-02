import { useCallback, useState } from "react";
import { GameScreen } from "./game/screens/GameScreen";
import { SplashScreen } from "./game/screens/SplashScreen";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return <GameScreen />;
}

export default App;
