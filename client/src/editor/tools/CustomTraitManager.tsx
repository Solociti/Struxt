import { TraitsResultProps } from "@grapesjs/react";
import { TraitPropertyField } from "./TraitPropertyField";

export function CustomTraitManager({
  traits,
}: Omit<TraitsResultProps, "Container">) {
  return (
    <div className="gjs-custom-style-manager text-left mt-3 p-1">
      {!traits.length ? (
        <div className="text-muted small p-2">No properties available</div>
      ) : (
        traits.map((trait) => (
          <TraitPropertyField key={trait.getId()} trait={trait} />
        ))
      )}
    </div>
  );
}
