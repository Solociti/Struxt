import axios from "axios";
import { keycloakHostname, keycloakRealmName } from "./setupKeycloak.ts";
import { getBearerToken } from "./getBearerToken.ts";

interface RoleRepresentation {
  id: string;
  name: string;
  description: string;
  scopeParamRequired: boolean;
  composite: boolean;
  composites: any;
  clientRole: boolean;
  containerId: string;
  attributes: any;
}

export function realms(realmName?: string) {
  if (!realmName) {
    realmName = keycloakRealmName;
  }

  const url = new URL(`/admin/realms/${realmName}/`, keycloakHostname);

  return {
    users(userId: string) {
      url.pathname += `users/${userId}/`;

      return {
        roleMappings: {
          realm: {
            async get() {
              url.pathname += "role-mappings/realm/";

              const result = await axios.get(url.toString());
              return result;
            },
            async delete() {
              url.pathname += "role-mappings/realm/";

              const result = await axios.delete(url.toString());
              return result;
            },
            async post(body: any) {
              url.pathname += "role-mappings/realm/";

              const result = await axios.post(url.toString(), body);
              return result;
            },

            composite: {
              async get(
                briefRepresentation?: boolean
              ): Promise<Partial<RoleRepresentation>[]> {
                url.pathname += "role-mappings/realm/composite/";

                if (typeof briefRepresentation === "boolean") {
                  url.searchParams.set(
                    "briefRepresentation",
                    briefRepresentation.toString()
                  );
                }

                const bearerToken = await getBearerToken();

                const result = await axios.get(url.toString(), {
                  headers: {
                    Authorization: `Bearer ${bearerToken}`,
                  },
                });

                if (result.status === 200) {
                  return result.data;
                }

                return [];
              },
            },
          },
        },
      };
    },
  };
}
