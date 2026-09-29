import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import {
  PUBLIC_LAUNCH_TIMESTAMP,
  nextSundayDropTimestamp,
  formatCountdown,
} from "../domain/queueClock";
interface QueueStatusContextValue {
  countdownLabel: string;
  isBeforeLaunch: boolean;
  nextDropTimestamp: number;
  queueCapacity: number;
  maximumCardsPerCollector: number;
  liveAllocationAvailable: false;
}
const QueueStatusContext = createContext<QueueStatusContextValue | undefined>(
  undefined,
);
export function QueueStatusProvider({ children }: PropsWithChildren) {
  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTimestamp(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const nextDropTimestamp = nextSundayDropTimestamp(currentTimestamp);
  return (
    <QueueStatusContext.Provider
      value={{
        nextDropTimestamp,
        countdownLabel: formatCountdown(nextDropTimestamp - currentTimestamp),
        isBeforeLaunch: currentTimestamp < PUBLIC_LAUNCH_TIMESTAMP,
        queueCapacity: 500,
        maximumCardsPerCollector: 10,
        liveAllocationAvailable: false,
      }}
    >
      {children}
    </QueueStatusContext.Provider>
  );
}
export function useQueueStatus() {
  const context = useContext(QueueStatusContext);
  if (!context)
    throw Error("useQueueStatus must be used within QueueStatusProvider.");
  return context;
}
