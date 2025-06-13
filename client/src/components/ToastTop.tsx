import { useEffect, useState } from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import MaterialIcon from "./MaterialIcon";

// Create a global toast controller
type ToastController = {
  showToast: (
    title: string,
    icon: string,
    variant: string,
    autoHideDelay: number
  ) => void;
};

// setup the toast controller
let toastController: ToastController | null = null;

/**
 * Shows a toast notification at the top of the screen.
 *
 * @param title
 * @param icon
 * @param variant
 * @param autoHideDelay
 */
export function showToastTop(
  title: string,
  icon: string = "info",
  variant: string = "secondary",
  autoHideDelay: number = 5000
): void {
  if (toastController) {
    toastController.showToast(title, icon, variant, autoHideDelay);
  } else {
    console.error("Toast system not initialized yet");
  }
}

// Toast component
interface ToastTopProps {
  show: boolean;
  title: string;
  icon: string;
  variant: string;
  autoHideDelay: number;
  onClose: () => void;
}

function ToastTop({
  show,
  title,
  icon,
  variant,
  autoHideDelay,
  onClose,
}: ToastTopProps) {
  return (
    <ToastContainer
      position="top-center"
      className="p-3"
      style={{
        zIndex: 1060,
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
      }}
    >
      <Toast
        onClose={onClose}
        show={show}
        delay={autoHideDelay}
        autohide
        bg={variant}
        className="top-toast-slide-down"
      >
        <Toast.Header>
          <MaterialIcon>{icon}</MaterialIcon>
          <strong className="ms-2 me-auto">{title}</strong>
          {/* <small>just now</small> */}
        </Toast.Header>
        <div
          className="bg-secondary d-flex justify-content-end"
          style={{ height: "2px" }}
        >
          <div
            style={{
              animationDuration: `${autoHideDelay / 1000}s`,
            }}
            className="bg-light top-toast-progress-bar"
          ></div>
        </div>
      </Toast>

      <style>
        {`
          .top-toast-progress-bar {
            margin-top: -1px;
            height: 4px;
            width: 0%;
            animation: topToastProgress 5s linear;
          }
          @keyframes topToastProgress {
            0% {
              width: 100%;
            }
            100% {
              width: 0%;
            }
          }

          .top-toast-slide-down {
            animation: topToastSlideDown 0.3s ease-out;
          }
          
          @keyframes topToastSlideDown {
            0% {
              transform: translateY(-100%);
              opacity: 0;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </ToastContainer>
  );
}

/**
 * Setup the toast top provider.
 *
 * @returns
 */
export default function ToastTopProvider() {
  const [toastProps, setToastProps] = useState({
    show: false,
    title: "",
    icon: "info",
    variant: "secondary",
    autoHideDelay: 5000,
  });
  const [key, setKey] = useState(0);

  // Initialize the controller on mount
  useEffect(() => {
    toastController = {
      showToast: (
        title: string,
        icon: string,
        variant: string,
        autoHideDelay: number
      ) => {
        setToastProps({
          show: true,
          title,
          icon,
          variant,
          autoHideDelay,
        });

        setKey((prevKey) => prevKey + 1);
      },
    };

    return () => {
      toastController = null;
    };
  }, []);

  const handleClose = () => setToastProps((prev) => ({ ...prev, show: false }));

  return <ToastTop key={key} {...toastProps} onClose={handleClose} />;
}
