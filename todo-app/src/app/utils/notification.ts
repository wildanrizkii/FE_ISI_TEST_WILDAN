import toast from "react-hot-toast";

export const showNotification = {
  success: (message: string) => {
    toast.success(message, {
      id: `success-${Date.now()}`, // dibuat unique agar tidak terjadi duplikat karena toast dapat ditumpuk
    });
  },
  error: (message: string) => {
    toast.error(message, {
      id: `error-${Date.now()}`,
    });
  },
  loading: (message: string) => {
    return toast.loading(message);
  },
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },
};
