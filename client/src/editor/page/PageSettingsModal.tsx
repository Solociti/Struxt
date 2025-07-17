import { useEditor } from "@grapesjs/react";
import { FormInput } from "client/components/FormInput";
import IconButton from "client/components/IconButton";
import SimpleModal from "client/components/modals/SimpleModal";
import { Components, Page } from "grapesjs";
import { useEffect, useState } from "react";
import HtmlEditor from "../code/htmlEditor";
import { PropertyGroup } from "../tools/PropertyGroup";

export function PageSettingsModal() {
  const editor = useEditor();

  const [show, setShow] = useState(false);
  const [page, setPage] = useState<Page | null>(null);
  const [isGlobal, setIsGlobal] = useState(false);

  const isMainPage = editor.Pages.getMain() === page;

  useEffect(() => {
    const onOpen = (event: {
      id: string;
      options: { page: Page };
      result: any;
    }) => {
      const page = event.options.page;
      if (page) {
        setPage(page);
      } else {
        setIsGlobal(true);
        setPage(null);
      }

      setShow(true);
    };
    const onClose = () => {
      setShow(false);
      setPage(null);
      setIsGlobal(false);
    };

    editor.on("command:run:struxt:page:settings", onOpen);
    editor.on("command:stop:struxt:page:settings", onClose);

    return () => {
      editor.off("command:run:struxt:page:settings", onOpen);
      editor.off("command:stop:struxt:page:settings", onClose);
    };
  }, [editor]);

  /**
   * Get the global setting value
   *
   * @param key
   * @returns
   */
  const getGlobalSetting = (key: string): string => {
    // for global, getProjectDataCustom
    // TODO: implement this properly

    return "";
  };

  /**
   * Get a page setting value
   */
  const getSetting = (key: string): string => {
    // for global, getProjectDataCustom
    // TODO: implement this properly

    if (!page) {
      return "";
    }

    if (key === "customCodeHead") {
      const mainComponent = page.getMainComponent();
      return mainComponent.head.getInnerHTML();
    }

    if (key === "customCodeBody") {
      const mainComponent = page.getMainComponent();

      const components = mainComponent.findType("custom-html-body");
      const html = components.map((c) => c.getInnerHTML()).join("\n");
      return html;
    }

    const settings = page.get("settings") || {};

    return ((settings as any)[key] as string) || "";
  };

  /**
   * Set a page setting value
   */
  const setSetting = (key: string, value: string) => {
    // for global, setProjectDataCustom
    // TODO: implement this properly

    if (!page) {
      return;
    }

    if (key === "customCodeHead") {
      const mainComponent = page.getMainComponent();

      return;
    }

    const settings = page.get("settings") || {};
    (settings as any)[key] = value;

    page.set("settings", settings);
  };

  return (
    <SimpleModal
      title={isGlobal ? "Global Settings" : "Page Settings"}
      show={show}
      onHide={() => editor.stopCommand("struxt:page:settings", {})}
      size="lg"
      scrollable
      footer={
        <>
          <div className="d-flex flex-grow-1">
            <IconButton
              icon="delete"
              variant="outline-danger"
              onClick={() => {}}
            >
              Delete Page
            </IconButton>
          </div>
          <div>
            <IconButton
              icon="close"
              variant="secondary"
              onClick={() => editor.stopCommand("struxt:page:settings", {})}
            >
              Close
            </IconButton>
          </div>
        </>
      }
    >
      {/* Name */}
      {!isGlobal && (
        <PropertyGroup
          label="Name"
          description="The name of the page. This is used to identify the page in the editor and in the browser tab."
        >
          <FormInput
            value={page?.getName() || ""}
            onRealChange={(value) => page?.setName(value.trim())}
          />
        </PropertyGroup>
      )}

      {/* Slug */}
      {!isMainPage && !isGlobal && (
        <PropertyGroup
          label="Slug"
          description="The slug is the URL-friendly version of the name. It is usually all lowercase and contains only letters, numbers, and hyphens."
        >
          <FormInput
            value={getSetting("slug") || ""}
            onRealChange={(value) => setSetting("slug", value.trim())}
            placeholder="page-slug"
          />
        </PropertyGroup>
      )}

      {/* Title */}
      <PropertyGroup
        label="Title"
        description="The title that appears in the browser tab and search engine results."
      >
        <FormInput
          value={getSetting("title") || ""}
          onRealChange={(value) => setSetting("title", value.trim())}
          placeholder={getGlobalSetting("title") || "Page title"}
        />
      </PropertyGroup>

      {/* Description */}
      <PropertyGroup
        label="Description"
        description="A short summary of the page content for search engines and social media."
      >
        <FormInput
          as="textarea"
          value={getSetting("description")}
          onRealChange={(value) => setSetting("description", value.trim())}
          placeholder={getGlobalSetting("description") || "Page description"}
          style={{ minHeight: "80px" }}
        />
      </PropertyGroup>

      {/* Favicon */}
      <PropertyGroup
        label="Favicon"
        description="The small icon that appears in the browser tab."
      >
        <FormInput
          value={getSetting("favicon")}
          onRealChange={(value) => setSetting("favicon", value.trim())}
          placeholder={
            getGlobalSetting("favicon") || "Favicon URL (e.g., /favicon.ico)"
          }
        />
      </PropertyGroup>

      {/* Keywords */}
      <PropertyGroup
        label="Keywords"
        description="Keywords or phrases that describe the content of the page (comma-separated)."
      >
        <FormInput
          as="textarea"
          value={getSetting("keywords")}
          onRealChange={(value) => setSetting("keywords", value.trim())}
          placeholder={
            getGlobalSetting("keywords") || "keyword1, keyword2, keyword3"
          }
          style={{ minHeight: "60px" }}
        />
      </PropertyGroup>

      {/* Social Title */}
      <PropertyGroup
        label="Social Title"
        description="The title that appears when the page is shared on social networks."
      >
        <FormInput
          value={getSetting("socialTitle")}
          onRealChange={(value) => setSetting("socialTitle", value.trim())}
          placeholder={getGlobalSetting("socialTitle") || "Social media title"}
        />
      </PropertyGroup>

      {/* Social Image */}
      <PropertyGroup
        label="Social Image"
        description="The image that appears when the page is shared on social networks."
      >
        <FormInput
          value={getSetting("socialImage")}
          onRealChange={(value) => setSetting("socialImage", value.trim())}
          placeholder={
            getGlobalSetting("socialImage") || "Social media image URL"
          }
        />
      </PropertyGroup>

      {/* Social Description */}
      <PropertyGroup
        label="Social Description"
        description="The description that appears when the page is shared on social networks."
      >
        <FormInput
          as="textarea"
          value={getSetting("socialDescription")}
          onRealChange={(value) =>
            setSetting("socialDescription", value.trim())
          }
          placeholder={
            getGlobalSetting("socialDescription") || "Social media description"
          }
          style={{ minHeight: "60px" }}
        />
      </PropertyGroup>

      {/* Custom HTML Head */}
      <PropertyGroup
        label="Custom HTML Head"
        description="Add any custom HTML (e.g. meta tags, stylesheets, scripts) to be included in the <head> section of the page."
      >
        <HtmlEditor
          value={getSetting("customCodeHead")}
          onRealChange={(value) => setSetting("customCodeHead", value)}
        />
      </PropertyGroup>

      {/* Custom HTML Body */}
      <PropertyGroup
        label="Custom HTML Body"
        description="Add any custom HTML (e.g. scripts, tracking codes) to be included just before the closing </body> tag."
      >
        <HtmlEditor
          value={getSetting("customCodeBody")}
          onRealChange={(value) => setSetting("customCodeBody", value)}
        />
      </PropertyGroup>
    </SimpleModal>
  );
}
