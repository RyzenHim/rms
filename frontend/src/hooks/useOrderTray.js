import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api, { withAuth } from "../services/api";

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
  const { token, user } = useAuth();
  const [cart, setCartState] = useState(readTray);
  const cartRef = useRef(cart);
  const isCustomer = Boolean(token && user?.roles?.includes("customer"));

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  useEffect(() => {
    if (typeof window === "undefined" || isCustomer) return undefined;
    setCartState(readTray());

    const syncFromStorage = () => setCartState(readTray());
    const syncFromCustomEvent = (event) => setCartState(Array.isArray(event.detail) ? event.detail : readTray());

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener(EVENT_NAME, syncFromCustomEvent);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener(EVENT_NAME, syncFromCustomEvent);
    };
  }, [isCustomer]);

  useEffect(() => {
    if (!isCustomer) {
      setCartState(readTray());
      return;
    }

    let isMounted = true;

    const loadTray = async () => {
      try {
        const { data } = await api.get("/tray", withAuth(token));
        const nextItems = Array.isArray(data?.tray?.items) ? data.tray.items : [];
        if (!isMounted) return;
        setCartState(nextItems);
      } catch {
        if (!isMounted) return;
        setCartState([]);
      }
    };

    loadTray();

    return () => {
      isMounted = false;
    };
  }, [isCustomer, token]);

  const persistCustomerTray = useCallback(async (nextCart, fallbackCart) => {
    try {
      const { data } = await api.put(
        "/tray",
        {
          items: nextCart.map((item) => ({
            menuItem: item.menuItem,
            quantity: Number(item.quantity || 0),
            notes: item.notes || "",
          })),
        },
        withAuth(token)
      );
      const savedItems = Array.isArray(data?.tray?.items) ? data.tray.items : nextCart;
      setCartState(savedItems);
      cartRef.current = savedItems;
    } catch {
      setCartState(fallbackCart);
      cartRef.current = fallbackCart;
    }
  }, [token]);

  const setCart = useCallback((updater) => {
    const currentCart = isCustomer ? cartRef.current : readTray();
    const nextCart = typeof updater === "function" ? updater(currentCart) : updater;
    setCartState(nextCart);
    cartRef.current = nextCart;

    if (isCustomer) {
      void persistCustomerTray(nextCart, currentCart);
      return;
    }

    writeTray(nextCart);
  }, [isCustomer, persistCustomerTray]);

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
