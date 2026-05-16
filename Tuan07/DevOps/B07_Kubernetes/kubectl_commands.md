# B07 — kubectl Commands: Scale, Update Image, Inspect

## Setup minikube

```bash
minikube start --driver=docker --cpus=2 --memory=4096
kubectl config use-context minikube

# Apply all manifests
kubectl apply -f deployment.yaml

# Verify
kubectl get pods
kubectl get services
kubectl get hpa
```

## Scale Pods

```bash
# Scale to 5 replicas
kubectl scale deployment myapp --replicas=5

# Watch scaling
kubectl get pods -w

# Scale down
kubectl scale deployment myapp --replicas=2

# Auto-scaling via HPA (already configured in deployment.yaml)
# Trigger HPA manually for testing:
kubectl run -it --rm load-generator --image=busybox --restart=Never -- \
    /bin/sh -c "while true; do wget -q -O- http://myapp-service/api/products; done"
kubectl get hpa -w
```

## Update Image (Rolling Update)

```bash
# Update to new image version
kubectl set image deployment/myapp myapp=username/myapp:v2.0

# Watch rolling update progress (0 downtime)
kubectl rollout status deployment/myapp

# Describe to see events
kubectl describe deployment myapp
```

## Rollback

```bash
# View rollout history
kubectl rollout history deployment/myapp

# Rollback to previous version
kubectl rollout undo deployment/myapp

# Rollback to specific revision
kubectl rollout undo deployment/myapp --to-revision=2
```

## Debugging

```bash
# Get pod logs
kubectl logs -l app=myapp --tail=50 -f

# Exec into pod
kubectl exec -it $(kubectl get pod -l app=myapp -o jsonpath='{.items[0].metadata.name}') -- sh

# Describe pod (events, resource usage)
kubectl describe pod -l app=myapp

# Port-forward for local testing
kubectl port-forward service/myapp-service 8080:80

# Access via minikube
minikube service myapp-service --url
```

## Expected Output

```
$ kubectl get pods
NAME                     READY   STATUS    RESTARTS   AGE
myapp-7d9f8b9c5-2xkqp   1/1     Running   0          2m
myapp-7d9f8b9c5-8vnrl   1/1     Running   0          2m

$ kubectl get services
NAME            TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
myapp-service   NodePort   10.96.45.123   <none>        80:30080/TCP   2m

$ kubectl get hpa
NAME        REFERENCE          TARGETS   MINPODS   MAXPODS   REPLICAS
myapp-hpa   Deployment/myapp   15%/70%   2         10        2
```
