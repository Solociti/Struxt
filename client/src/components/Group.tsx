import InputGroup from "react-bootstrap/InputGroup";

interface GroupProps {
  prepend?: React.ReactNode;
  append?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Simple input group component
 *
 * @param param0
 * @returns
 */
export default function Group({ prepend, append, children }: GroupProps) {
  return (
    <InputGroup>
      {prepend && <InputGroup.Text>{prepend}</InputGroup.Text>}
      {children}
      {append && <InputGroup.Text>{append}</InputGroup.Text>}
    </InputGroup>
  );
}
