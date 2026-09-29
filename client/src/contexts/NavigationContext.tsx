import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type PropsWithChildren,
} from "react";
import { Linking } from "react-native";
import {
  readInitialRoute,
  writeRoute,
  subscribeToNavigation,
} from "../platform/navigation";
import {
  isExternalDestination,
  isPermittedExternalDestination,
  resolveClientRoute,
} from "../domain/routes";
interface NavigationContextValue {
  currentRoute: string;
  navigateTo: (destination: string) => void;
}
const NavigationContext = createContext<NavigationContextValue | undefined>(
  undefined,
);
export function NavigationProvider({ children }: PropsWithChildren) {
  const [currentRoute, setCurrentRoute] = useState(readInitialRoute);
  useEffect(() => subscribeToNavigation(setCurrentRoute), []);
  const navigateTo = useCallback(
    (destination: string) => {
      if (isExternalDestination(destination)) {
        if (isPermittedExternalDestination(destination))
          void Linking.openURL(destination);
        return;
      }
      if (/^[a-z][a-z0-9+.-]*:/i.test(destination)) return;
      const nextRoute = resolveClientRoute(destination, currentRoute);
      writeRoute(nextRoute);
      setCurrentRoute(nextRoute);
    },
    [currentRoute],
  );
  return (
    <NavigationContext.Provider value={{ currentRoute, navigateTo }}>
      {children}
    </NavigationContext.Provider>
  );
}
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context)
    throw Error("useNavigation must be used within NavigationProvider.");
  return context;
}
