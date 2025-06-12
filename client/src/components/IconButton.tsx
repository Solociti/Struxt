import Button, { ButtonProps } from "react-bootstrap/Button";
import MaterialIcon from "./MaterialIcon";
import Spinner from "react-bootstrap/Spinner";

export interface IconButtonProps extends ButtonProps {
  /**
   * The material font icon to display in the button.
   */
  icon: string;

  /**
   * When true, shows a spinner instead of the icon.
   */
  spinner?: boolean;
}

/**
 * Creates a button with the material font icon
 *
 * @param param0
 * @returns
 */
export default function IconButton({
  children,
  disabled,
  icon,
  size,
  spinner,
  ...props
}: IconButtonProps) {
  const spinnerVariant = props.variant === "light" ? "dark" : "light";

  return (
    <Button disabled={spinner || disabled} size={size} {...props}>
      <span
        style={{
          width: "1em",
          overflow: "visible",
        }}
        className="d-inline-block me-2"
      >
        {spinner ? (
          <Spinner
            animation="border"
            size="sm"
            variant={spinnerVariant}
            style={{
              height: "1em",
              width: "1em",
            }}
          />
        ) : (
          <MaterialIcon
            style={{
              position: "relative",
              top: "0.06em",
            }}
          >
            {icon}
          </MaterialIcon>
        )}
      </span>
      {children}
    </Button>
  );
}
