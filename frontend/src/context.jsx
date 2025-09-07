// frontend/src/context.jsx
import { createContext } from "react";

// Default value prevents consumers from crashing if provider not yet mounted
export const Context = createContext({
  isAuthorized: false,
  setIsAuthorized: () => {},
  user: null,
  setUser: () => {},
});
