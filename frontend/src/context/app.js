import { createContext, useContext } from "react";

export const IntroContext = createContext({ done: true });
export const useIntro = () => useContext(IntroContext);

// Shared handle on the Lenis instance so route changes can reset scroll position.
export const lenisRef = { current: null };
