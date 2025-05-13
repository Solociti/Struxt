FROM quay.io/keycloak/keycloak:latest AS builder

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_PROXY_HEADERS=xforwarded
ENV KC_DB=mariadb

WORKDIR /opt/keycloak
# for demonstration purposes only, please make sure to use proper certificates in production instead
# RUN keytool -genkeypair -storepass password -storetype PKCS12 -keyalg RSA -keysize 2048 -dname "CN=server" -alias server -ext "SAN:c=DNS:accounts.localhost,localhost,IP:127.0.0.1" -keystore conf/server.keystore

RUN /opt/keycloak/bin/kc.sh build
RUN apt -y update && apt -y install curl

FROM quay.io/keycloak/keycloak:latest

COPY --from=builder /usr/bin/curl /usr/bin/curl
COPY --from=builder /opt/keycloak/ /opt/keycloak/

ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_PROXY_HEADERS=xforwarded
ENV KC_DB=mariadb


ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
