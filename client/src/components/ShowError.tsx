import Alert from "react-bootstrap/Alert";

/**
 * ShowError component
 *
 * @param param0
 * @returns
 */
export function ShowError({ error }: { error: null | Error }) {
  if (!error) {
    return null;
  }

  return (
    <Alert variant="warning">
      <Alert.Heading>{error.name}</Alert.Heading>
      <p>{error.message}</p>
    </Alert>
  );
}
