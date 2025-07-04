import axios from "axios";
import { toast } from "react-toastify";

function isAxiosErrorWithRetry(
  error: unknown
): error is import("axios").AxiosError & { config: { _retry?: boolean } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "isAxiosError" in error &&
    (error as any).isAxiosError === true &&
    "config" in error &&
    typeof (error as any).config === "object" &&
    (error as any).config !== null &&
    "_retry" in (error as any).config
  );
}

export const showErrorToast = (error: unknown): void => {
  if (isAxiosErrorWithRetry(error) && error.config._retry) {
    return;
  }
  if (axios.isAxiosError(error)) {
    const errorMsg =
      error.response?.data?.message || error.message || "Something went wrong";
    toast.error(errorMsg);
  } else if (error instanceof Error) {
    toast.error(error.message);
  } else {
    toast.error("An unknown error occurred");
  }
};
