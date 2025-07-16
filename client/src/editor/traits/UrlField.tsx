import { FormInput } from "client/components/FormInput";
import Group from "client/components/Group";
import IconButton from "client/components/IconButton";
import MaterialIcon from "client/components/MaterialIcon";
import type { Component, Editor, Trait } from "grapesjs";
import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import { PropertyGroup } from "../tools/PropertyGroup";

interface UrlFieldProps {
  defValue?: string;
  value: string;
  trait: Trait;
  editor: Editor;
}

/**
 * Create a custom href field for the trait
 *
 * @param param0
 * @returns
 */
export function UrlField({ defValue, value, trait, editor }: UrlFieldProps) {
  const [_counter, setCounter] = useState(0);
  const component = editor.getSelected();

  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (!selecting) {
      return () => {};
    }

    const onComponentHovered = (component: Component) => {
      // use the CanvasSpot to draw a border around the hovered component
      const canvas = editor.Canvas;
      canvas.addSpot(
        {
          id: "selection",
          type: "hover",
          component,
        },
        {}
      );
      // TODO: find a way to render the spot
      // https://grapesjs.com/docs/modules/Canvas.html#canvas-spots
    };

    const onSelected = (child: Component) => {
      setSelecting(false);
      editor.select(component);

      const id = child.getId();
      trait.setValue(`#${id}`);
    };

    editor.on("component:hovered", onComponentHovered);
    editor.on("component:selected", onSelected);

    return () => {
      editor.Canvas.removeSpots({ id: "selection" });

      editor.off("component:hovered", onComponentHovered);
      editor.off("component:selected", onSelected);
    };
  }, [selecting]);

  let activeKey: string = component?.get("hrefType") || "";
  if (!activeKey) {
    // infer the active key from the value
    if (value.startsWith("page://")) {
      activeKey = "pages";
    } else if (value.startsWith("#")) {
      activeKey = "elements";
    } else if (value.startsWith("mailto:")) {
      activeKey = "email";
    } else if (value.startsWith("tel:")) {
      activeKey = "tel";
    } else {
      activeKey = "url";
    }
  }

  return (
    <div className="border-bottom border-top mb-2">
      <Tabs
        variant="underline"
        fill
        justify
        className="mb-2"
        activeKey={activeKey}
        onSelect={(key) => {
          component?.set("hrefType", key);
          trait.setValue("");
          setCounter((value) => value + 1);
        }}
      >
        <Tab
          eventKey="url"
          title={
            <MaterialIcon style={{ fontSize: "1.3em" }}>link</MaterialIcon>
          }
        >
          <PropertyGroup label="URL">
            <FormInput
              placeholder={defValue || "https://example.com"}
              value={value}
              onRealChange={(value) => trait.setValue(value)}
              size="sm"
            />
          </PropertyGroup>
        </Tab>

        <Tab
          eventKey="pages"
          title={
            <MaterialIcon style={{ fontSize: "1.3em" }}>tab_group</MaterialIcon>
          }
        >
          {/* TODO: setup a dropdown component */}
          <PropertyGroup label="Page">
            <Form.Select
              value={value}
              onChange={(ev) => trait.setValue(ev.target.value)}
              size="sm"
            >
              <option value="">- Select Page -</option>

              {editor.Pages.getAll().map((page) => (
                <option key={page.id} value={`page://${page.id}`}>
                  {page.getName()}
                </option>
              ))}
            </Form.Select>
          </PropertyGroup>
        </Tab>

        <Tab
          eventKey="elements"
          title={
            <MaterialIcon style={{ fontSize: "1.3em" }}>
              jump_to_element
            </MaterialIcon>
          }
        >
          <PropertyGroup label="Element">
            <Group prepend="#">
              <FormInput
                placeholder={defValue || "Element ID"}
                value={value.replace(/^#{0,5}/, "")}
                onRealChange={(value) => trait.setValue(`#${value}`)}
                size="sm"
              />

              <IconButton
                icon="target"
                size="sm"
                variant={selecting ? "secondary" : "outline-secondary"}
                onClick={() => setSelecting(!selecting)}
              />
            </Group>
          </PropertyGroup>
        </Tab>

        <Tab
          eventKey="email"
          title={
            <MaterialIcon style={{ fontSize: "1.3em" }}>email</MaterialIcon>
          }
        >
          <EmailInput
            value={value}
            onUpdate={(value) => trait.setValue(value)}
          />
        </Tab>

        <Tab
          eventKey="tel"
          title={
            <MaterialIcon style={{ fontSize: "1.3em" }}>phone</MaterialIcon>
          }
        >
          <PropertyGroup label="Phone">
            <FormInput
              placeholder={defValue || "+1234567890"}
              value={value.replace(/^tel:/, "")}
              onRealChange={(value) => trait.setValue(`tel:${value}`)}
              size="sm"
            />
          </PropertyGroup>
        </Tab>
      </Tabs>
    </div>
  );
}

/**
 * Add the email specific input fields for the email trait
 *
 * @param param0
 * @returns
 */
function EmailInput({
  value,
  onUpdate,
}: {
  value: string;
  onUpdate: (value: string) => void;
}) {
  const urlValue = new URL(
    value && value.startsWith("mailto:") ? value : "mailto:"
  );
  urlValue.protocol = "mailto:";

  const rEmail = urlValue.pathname;
  const rSubject = urlValue.searchParams.get("subject") || "";

  const handleUpdate = (type: "email" | "subject") => (value: string) => {
    let email = type === "email" ? value : rEmail;
    let subject = type === "subject" ? value : rSubject;

    // compile the url
    const params = new URLSearchParams();
    if (subject) {
      params.set("subject", subject);
    }

    const url = `mailto:${email}${subject ? `?${params.toString()}` : ""}`;
    onUpdate(url);
  };

  return (
    <>
      <PropertyGroup label="Email">
        <FormInput
          placeholder="email@example.com"
          value={rEmail}
          onRealChange={handleUpdate("email")}
          size="sm"
        />
      </PropertyGroup>

      <PropertyGroup label="Subject">
        <FormInput
          placeholder="Email Subject"
          value={rSubject}
          onRealChange={handleUpdate("subject")}
          size="sm"
        />
      </PropertyGroup>
    </>
  );
}
