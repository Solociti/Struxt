import React, { useEffect, useState } from "react";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import IconButton from "./IconButton";

export interface ShowPathValidationErrorsProps {
  /**
   * Array of validation error messages to display
   */
  errors: string[];

  /**
   * The child element to wrap (typically a Form.Control)
   */
  children: React.ReactElement;

  /**
   * Popover placement relative to the child element
   * @default "right"
   */
  placement?: "top" | "right" | "bottom" | "left" | "auto";

  /**
   * Optional callback to auto-fix validation errors
   * When provided, an "Auto-fix" button will appear in the popover
   */
  onFix?: () => void;
}

/**
 * Component that wraps an input field and displays validation errors in a popover
 * with an optional auto-fix button
 *
 * @example
 * <ShowPathValidationErrors
 *   errors={validationErrors}
 *   onFix={() => {
 *     const sanitized = sanitizePath(path, { skipInvalid: true });
 *     setPath(sanitized);
 *   }}
 * >
 *   <Form.Control
 *     value={path}
 *     onChange={(e) => setPath(e.target.value)}
 *     isInvalid={validationErrors.length > 0}
 *   />
 * </ShowPathValidationErrors>
 */
export function ShowPathValidationErrors({
  errors,
  children,
  placement = "right",
  onFix,
}: ShowPathValidationErrorsProps) {
  const [show, setShow] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Show popover if there are errors and (input is focused or hovered)
  useEffect(() => {
    if (errors.length > 0 && (isFocused || isHovered)) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [errors.length, isFocused, isHovered]);

  // If there are no errors, just render the child without the popover
  if (errors.length === 0) {
    return children;
  }

  // Clone the child to add focus/blur and mouse enter/leave handlers
  const childWithHandlers = React.cloneElement(children, {
    onFocus: (e: React.FocusEvent) => {
      setIsFocused(true);
      // Call original onFocus if it exists
      const originalOnFocus = (children.props as any).onFocus;
      if (originalOnFocus) {
        originalOnFocus(e);
      }
    },
    onBlur: (e: React.FocusEvent) => {
      setIsFocused(false);
      // Call original onBlur if it exists
      const originalOnBlur = (children.props as any).onBlur;
      if (originalOnBlur) {
        originalOnBlur(e);
      }
    },
    onMouseEnter: (e: React.MouseEvent) => {
      setIsHovered(true);
      // Call original onMouseEnter if it exists
      const originalOnMouseEnter = (children.props as any).onMouseEnter;
      if (originalOnMouseEnter) {
        originalOnMouseEnter(e);
      }
    },
    onMouseLeave: (e: React.MouseEvent) => {
      setIsHovered(false);
      // Call original onMouseLeave if it exists
      const originalOnMouseLeave = (children.props as any).onMouseLeave;
      if (originalOnMouseLeave) {
        originalOnMouseLeave(e);
      }
    },
  } as any);

  const popover = (
    <Popover
      id="path-validation-errors-popover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Popover.Header as="h3">Validation Errors</Popover.Header>
      <Popover.Body>
        <ul className={onFix ? "mb-2 ps-3" : "mb-0 ps-3"}>
          {errors.map((error, index) => (
            <li key={index} className="small">
              {error}
            </li>
          ))}
        </ul>
        {onFix && (
          <div className="d-flex justify-content-end">
            <IconButton
              size="sm"
              variant="primary"
              icon="auto_fix_high"
              onClick={onFix}
            >
              Fix Path
            </IconButton>
          </div>
        )}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger={[]}
      placement={placement}
      overlay={popover}
      show={show}
    >
      {childWithHandlers}
    </OverlayTrigger>
  );
}
