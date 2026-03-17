import { useEffect } from "react";

const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return undefined;

    const { style } = document.body;
    const previousOverflow = style.overflow;

    style.overflow = "hidden";

    return () => {
      style.overflow = previousOverflow;
    };
  }, [isLocked]);
};

export default useBodyScrollLock;
