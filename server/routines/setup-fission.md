# Fission setup — commands run

This file summarizes and groups the shell commands you executed while setting up Fission on the host. Commands are presented in logical sections and de-duplicated where appropriate.

---

## System & firewall

- Install git

```bash
sudo dnf update
sudo dnf install git bash-completion epel-release
```

- Install and enable firewalld

```bash
sudo dnf install firewalld
sudo systemctl start firewalld.service
sudo systemctl enable firewalld
sudo systemctl status firewalld.service
```

- Open common ports and trust pod/service ranges

```bash
# SSH
sudo firewall-cmd --permanent --add-port=22/tcp

# Kubernetes API server
# sudo firewall-cmd --permanent --add-port=6443/tcp

# Pod and Service network ranges (trusted zone)
sudo firewall-cmd --permanent --zone=trusted --add-source=10.42.0.0/16
sudo firewall-cmd --permanent --zone=trusted --add-source=10.43.0.0/16

# Additional service (Cockpit / Prometheus endpoint used during setup)
sudo firewall-cmd --add-port=9090/tcp

# Reload and inspect
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
sudo firewall-cmd --list-all --zone=trusted
```

- Enable Cockpit (optional UI)

```bash
sudo systemctl enable --now cockpit.socket
curl localhost:9090
```

---

## k3s (Lightweight Kubernetes)

- Install k3s (disable Traefik)

```bash
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--disable traefik" sh -
```

- Uninstall (if needed)

```bash
/usr/local/bin/k3s-uninstall.sh
```

- Ensure kubectl is available (k3s provides a kubectl binary)

```bash
# symlink k3s to kubectl for convenience
sudo ln -s /usr/local/bin/k3s /usr/bin/kubectl
sudo ln -s /usr/local/bin/k3s /usr/bin/k3s

# verify nodes and pods
sudo kubectl get nodes
sudo kubectl get pods --all-namespaces
```

---

## Kubeconfig for local user

- Needed for helm

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
ls -lah ~/.kube/
cat ~/.kube/config
```

---

## Helm and Fission installation

- Download and install Helm 4 installer, then remove installer script

```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-4
chmod 700 get_helm.sh
./get_helm.sh
sudo ln -s /usr/local/bin/helm /usr/bin/helm
rm get_helm.sh
```

- Add Fission Helm repo and install Fission (namespace `fission`)

```bash
export FISSION_NAMESPACE="fission"

sudo kubectl create namespace $FISSION_NAMESPACE
sudo kubectl create -k "github.com/fission/fission/crds/v1?ref=v1.22.0"
helm repo add fission-charts https://fission.github.io/fission-charts/
helm repo update
helm install --version 1.22.0 --namespace $FISSION_NAMESPACE fission fission-charts/fission-all
```

---

## Fission CLI

- Download Fission CLI and move to `/usr/local/bin`

```bash
curl -Lo fission https://github.com/fission/fission/releases/download/v1.22.0/fission-v1.22.0-linux-amd64 && chmod +x fission && sudo mv fission /usr/local/bin/

# check version and basic health
fission version
fission check

# fission command completion
fission completion bash > fission
sudo mv fission /etc/bash_completion.d/fission
```

---

## Setup Node Environment

Create a reusable Node.js environment for Fission with CPU and memory limits.

```bash
fission env create --name node --image ghcr.io/fission/node-env --mincpu 40 --maxcpu 80 --minmemory 64 --maxmemory 128 --poolsize 4 --spec
```

Quick examples:

```bash
# list environments
fission env list

# delete the environment
fission env delete --name node
```

---

## Install and Setup Wireguard

```bash
sudo dnf install wireguard-tools

sudo mkdir -p /etc/wireguard
sudo touch /etc/wireguard/wg0.conf
wg genkey | sudo tee /etc/wireguard/wg0 | wg pubkey | sudo tee /etc/wireguard/wg0.pub
sudo vi /etc/wireguard/wg0.conf
```

Wireguard Config

Replace the server_privatekey and ip address values.

```conf
[Interface]
PrivateKey = server_privatekey
Address = 10.30.1.x/24
ListenPort = 51820
```

Turn on IP forwarding for IPV4 and IPV6

```bash
sudo sysctl -w net.ipv4.ip_forward=1 && sudo sysctl -w net.ipv6.conf.all.forwarding=1
```

Configure firewalld

```bash
sudo firewall-cmd --permanent --zone=public --add-port=51820/udp
sudo firewall-cmd --permanent --add-interface=wg0 --zone=internal
sudo firewall-cmd --permanent --zone=internal --add-masquerade

sudo firewall-cmd --reload
```

Enable Wireguard

```bash
sudo systemctl enable --now wg-quick@wg0
sudo systemctl status wg-quick@wg0
```

## Get Service Accounts

Create service accounts for dev, staging, and prod environments, and generate long-lived tokens by creating Secrets.

```bash
kubectl -n fission create serviceaccount struxt-fission-client-dev
kubectl -n fission create serviceaccount struxt-fission-client-staging
kubectl -n fission create serviceaccount struxt-fission-client-prod

kubectl apply -f fission/config/struxt-fission-role.yaml
kubectl apply -f fission/config/struxt-fission-binding.yaml
kubectl apply -f fission/config/struxt-fission-token.yaml

# Get Dev Token
kubectl -n fission get secret struxt-fission-client-dev-token -o jsonpath='{.data.token}' | base64 --decode

# Get Staging Token
kubectl -n fission get secret struxt-fission-client-staging-token -o jsonpath='{.data.token}' | base64 --decode

# Get Prod Token
kubectl -n fission get secret struxt-fission-client-prod-token -o jsonpath='{.data.token}' | base64 --decode
```

Simplified kube config to use in struxt.

```yaml
apiVersion: v1
kind: Config
clusters:
  - name: fission-cluster
    cluster:
      # Copy these two from your normal kubeconfig:
      server: https://your-k8s-api:6443
      certificate-authority-data: <base64-of-cluster-CA>

users:
  - name: struxt-fission-client-<account-type>
    user:
      token: <service-account-token>

contexts:
  - name: struxt-fission-<account-type>
    context:
      cluster: fission-cluster
      user: struxt-fission-client-<account-type>
      namespace: fission

current-context: struxt-fission-<account-type>
```
