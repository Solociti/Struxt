# Fission setup — commands run

This file summarizes and groups the shell commands you executed while setting up Fission on the host. Commands are presented in logical sections and de-duplicated where appropriate.

---

## System & firewall

- Install git

```bash
sudo dnf update
sudo dnf install git
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
sudo firewall-cmd --permanent --add-port=6443/tcp

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

Not sure this step is actually needed.

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
helm repo add fission-charts https://fission.github.io/fission-charts/
helm repo update
export FISSION_NAMESPACE="fission"
kubectl create namespace $FISSION_NAMESPACE
helm install --version 1.22.1 --namespace $FISSION_NAMESPACE fission fission-charts/fission-all
```

- Apply Fission CRDs (explicit version used during setup)

```bash
kubectl create -k "github.com/fission/fission/crds/v1?ref=v1.22.0"
```

---

## Fission CLI

- Download Fission CLI and move to `/usr/local/bin`

```bash
curl -Lo fission https://github.com/fission/fission/releases/download/v1.22.0/fission-v1.22.0-linux-amd64 && chmod +x fission && sudo mv fission /usr/local/bin/

# check version and basic health
fission version
fission check
```

---

## Setup Node Environment

Create a reusable Node.js environment for Fission with CPU and memory limits.

```bash
fission env create --name node --image ghcr.io/fission/node-env --mincpu 40 --maxcpu 80 --minmemory 64 --maxmemory 128 --poolsize 4
```

Quick examples:

```bash
# list environments
fission env list

# delete the environment
fission env delete --name node
```
