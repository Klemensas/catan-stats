import { useEffect } from "react";

export const useLocationUpdater = (fileUrl: string) =>
  useEffect(() => {
    const url = new URL(window.location.href);

    if (!fileUrl) {
      url.searchParams.delete("file");
    } else {
      url.searchParams.set("file", fileUrl);
    }

    window.history.replaceState({}, "", url.href);
  }, [fileUrl]);
