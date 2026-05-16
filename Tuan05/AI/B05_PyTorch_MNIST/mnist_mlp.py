"""
B05 — PyTorch MNIST: MLP Model → Forward → Backprop → Train 5 epochs → Plot
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import matplotlib.pyplot as plt
import numpy as np

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")


# ── 1. Data ───────────────────────────────────────────────────────────────────
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.1307,), (0.3081,)),   # MNIST mean/std
])

train_dataset = datasets.MNIST(root="./data", train=True,  download=True, transform=transform)
test_dataset  = datasets.MNIST(root="./data", train=False, download=True, transform=transform)

train_loader = DataLoader(train_dataset, batch_size=64, shuffle=True,  num_workers=0)
test_loader  = DataLoader(test_dataset,  batch_size=256, shuffle=False, num_workers=0)

print(f"Train: {len(train_dataset)} samples | Test: {len(test_dataset)} samples")


# ── 2. Model: Multi-Layer Perceptron ─────────────────────────────────────────
class MLP(nn.Module):
    def __init__(self):
        super().__init__()
        self.network = nn.Sequential(
            nn.Flatten(),                  # 28x28 → 784
            nn.Linear(784, 256),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, 10),            # 10 classes
        )

    def forward(self, x):
        return self.network(x)


model = MLP().to(DEVICE)
print(f"\nModel:\n{model}")
total_params = sum(p.numel() for p in model.parameters())
print(f"Total parameters: {total_params:,}")


# ── 3. Training setup ─────────────────────────────────────────────────────────
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=1e-3)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=2, gamma=0.5)


# ── 4. Train & Evaluate ───────────────────────────────────────────────────────
def train_epoch(model, loader, optimizer, criterion):
    model.train()
    total_loss, correct = 0.0, 0
    for X_batch, y_batch in loader:
        X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
        optimizer.zero_grad()
        logits = model(X_batch)           # Forward pass
        loss = criterion(logits, y_batch)
        loss.backward()                   # Backpropagation
        optimizer.step()
        total_loss += loss.item() * len(X_batch)
        correct += (logits.argmax(1) == y_batch).sum().item()
    return total_loss / len(loader.dataset), correct / len(loader.dataset)


def eval_epoch(model, loader, criterion):
    model.eval()
    total_loss, correct = 0.0, 0
    with torch.no_grad():
        for X_batch, y_batch in loader:
            X_batch, y_batch = X_batch.to(DEVICE), y_batch.to(DEVICE)
            logits = model(X_batch)
            loss = criterion(logits, y_batch)
            total_loss += loss.item() * len(X_batch)
            correct += (logits.argmax(1) == y_batch).sum().item()
    return total_loss / len(loader.dataset), correct / len(loader.dataset)


EPOCHS = 5
history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}

print("\n" + "=" * 60)
print(f"{'Epoch':>5} {'Train Loss':>12} {'Train Acc':>10} {'Val Loss':>10} {'Val Acc':>10}")
print("=" * 60)

for epoch in range(1, EPOCHS + 1):
    tr_loss, tr_acc = train_epoch(model, train_loader, optimizer, criterion)
    vl_loss, vl_acc = eval_epoch(model, test_loader, criterion)
    scheduler.step()

    history["train_loss"].append(tr_loss)
    history["train_acc"].append(tr_acc)
    history["val_loss"].append(vl_loss)
    history["val_acc"].append(vl_acc)

    print(f"{epoch:>5} {tr_loss:>12.4f} {tr_acc:>10.4f} {vl_loss:>10.4f} {vl_acc:>10.4f}")

print(f"\nFinal test accuracy: {history['val_acc'][-1]*100:.2f}%")


# ── 5. Plot loss and accuracy ──────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
epochs = range(1, EPOCHS + 1)

axes[0].plot(epochs, history["train_loss"], "o-", label="Train Loss")
axes[0].plot(epochs, history["val_loss"],   "o-", label="Val Loss")
axes[0].set_xlabel("Epoch"); axes[0].set_ylabel("Loss")
axes[0].set_title("Loss per Epoch"); axes[0].legend()

axes[1].plot(epochs, [a*100 for a in history["train_acc"]], "o-", label="Train Acc")
axes[1].plot(epochs, [a*100 for a in history["val_acc"]],   "o-", label="Val Acc")
axes[1].set_xlabel("Epoch"); axes[1].set_ylabel("Accuracy (%)")
axes[1].set_title("Accuracy per Epoch"); axes[1].legend()

plt.tight_layout()
plt.savefig("mnist_training.png", dpi=100)
print("Chart saved: mnist_training.png")


# ── 6. Save model ─────────────────────────────────────────────────────────────
torch.save(model.state_dict(), "mnist_mlp.pth")
print("Model saved: mnist_mlp.pth")
