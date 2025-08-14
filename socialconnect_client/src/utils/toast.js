import { toast } from 'react-toastify';

const defaultOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'light',
};

export const showToast = {
  success: (message) => toast.success(message, defaultOptions),
  error: (message) => toast.error(message, defaultOptions),
  info: (message) => toast.info(message, defaultOptions),
  warning: (message) => toast.warning(message, defaultOptions),
};