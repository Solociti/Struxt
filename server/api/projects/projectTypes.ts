interface Asset {
  type: string;
  src: string;
  unitDim: string;
  height: number;
  width: number;
  id?: string;
}

interface Style {
  selectors: string[];
  selectorsAdd?: string;
  style: Record<string, string | number>;
  wrapper?: number;
  state?: string;
  mediaText?: string;
  atRuleType?: string;
  group?: string;
}

interface Component {
  type: string;
  attributes?: {
    id: string;
    for?: string;
    type?: string;
    name?: string;
    placeholder?: string;
    required?: boolean;
    multiple?: boolean;
    accept?: string;

    [key: string]: string | number | boolean | undefined;
  };
  components?: Component[];
  classes?: string[];
  tagName?: string;
  void?: boolean;
  resizable?: Record<string, boolean | number>;
  src?: string;
  address?: string;
  zoom?: string;

  customName?: string;
  "custom-name"?: string;

  content?: string;
  style?: string;
  droppable?: boolean;
  customCodePlugin__code?: string;
}

interface Frame {
  component: Component;
  id: string;
}

interface Page {
  name: string;
  frames: Frame[];
  id: string;
  settings?: Record<string, string>;
}

interface Symbol {
  tagName: string;
  type: string;
  classes: string[];
  attributes: Record<string, string>;
  components: Component[];
  customName?: string;
  __symbols?: string[];
}

interface ProjectSettings {
  slug: string;
  title: string;
  description: string;
  favicon: string;
  keywords: string;
  socialTitle: string;
  socialImage: string;
  socialDescription: string;
  customCodeHead: string;
  customCodeBody: string;
}

interface Project {
  assets: Asset[];
  styles: Style[];
  pages: Page[];
  symbols: Symbol[];
  dataSources: any[];
  custom: {
    projectType: string;
    id: string;
    globalPageSettings: ProjectSettings;
  };
}
