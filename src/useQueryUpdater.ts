import { useEffect } from "react";

export const useQueryUpdater = (field: string, value: string) =>
  useEffect(() => {
    const url = new URL(window.location.href);

    if (!value) {
      url.searchParams.delete(field);
    } else {
      url.searchParams.set(field, value);
    }

    window.history.replaceState({}, "", url.href);
  }, [field, value]);
