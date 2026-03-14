import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "customer-order-tray";
const EVENT_NAME = "order-tray-updated";

const parseTray = (value) => {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readTray = () => {
  if (typeof window === "undefined") return [];
  return parseTray(window.localStorage.getItem(STORAGE_KEY));
};

const writeTray = (nextCart) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: nextCart }));
};

const useOrderTray = () => {
  const [cart, setCartState] = useState(readTray);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    setCartState(readTray());

    const syncFromStorage = () => setCartState(readTray());
    const syncFromCustomEvent = (event) => setCartState(Array.isArray(event.detail) ? event.detail : readTray());

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(EVENT_NAME, syncFromCustomEvent);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(EVENT_NAME, syncFromCustomEvent);
    };
  }, []);

  const setCart = useCallback((updater) => {
    const currentCart = readTray();
    const nextCart = typeof updater === "function" ? updater(currentCart) : updater;
    writeTray(nextCart);
    setCartState(nextCart);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart],
  );

  return {
    cart,
    setCart,
    clearCart,
    itemCount,
  };
};

export default useOrderTray;
