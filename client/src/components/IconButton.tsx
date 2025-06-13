import Button, { ButtonProps } from "react-bootstrap/Button";
import MaterialIcon, { MaterialIconProps } from "./MaterialIcon";
import Spinner from "react-bootstrap/Spinner";

export interface IconButtonProps extends ButtonProps {
  /**
   * The material font icon to display in the button.
   */
  icon: string;

  iconProps?: MaterialIconProps;

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
  iconProps,
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
            {...iconProps}
            style={{
              top: size === "sm" ? "-0.06em" : "0.06em",
              position: "relative",
              fontSize: size === "sm" ? "22px" : "24px",
              ...(iconProps?.style || {}),
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
