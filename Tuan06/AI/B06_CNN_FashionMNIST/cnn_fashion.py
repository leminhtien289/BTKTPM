"""
B06 — CNN FashionMNIST: Conv2d layers + Demo predict 1 image
Reuses PyTorch training loop from B05, adds Conv2d architecture
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
import matplotlib.pyplot as plt
import numpy as np

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASSES = ["T-shirt", "Trouser", "Pullover", "Dress", "Coat",
           "Sandal", "Shirt", "Sneaker", "Bag", "Ankle boot"]


# ── 1. Data ───────────────────────────────────────────────────────────────────
transform_train = transforms.Compose([
    transforms.RandomHorizontalFlip(),              # data augmentation
    transforms.RandomCrop(28, padding=2),
    transforms.ToTensor(),
    transforms.Normalize((0.2860,), (0.3530,)),     # FashionMNIST stats
])
transform_test = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.2860,), (0.3530,)),
])

train_dataset = datasets.FashionMNIST(root="./data", train=True,  download=True, transform=transform_train)
test_dataset  = datasets.FashionMNIST(root="./data", train=False, download=True, transform=transform_test)

train_loader = DataLoader(train_dataset, batch_size=128, shuffle=True,  num_workers=0)
test_loader  = DataLoader(test_dataset,  batch_size=256, shuffle=False, num_workers=0)


# ── 2. CNN Model ──────────────────────────────────────────────────────────────
class CNN(nn.Module):
    def __init__(self):
        super().__init__()
        # Feature extraction
        self.features = nn.Sequential(
            # Block 1: 1×28×28 → 32×14×14
            nn.Conv2d(1, 32, kernel_size=3, padding=1),   # 32×28×28
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2),                               # 32×14×14

            # Block 2: 32×14×14 → 64×7×7
            nn.Conv2d(32, 64, kernel_size=3, padding=1),  # 64×14×14
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2),                               # 64×7×7

            # Block 3: 64×7×7 → 128×7×7
            nn.Conv2d(64, 128, kernel_size=3, padding=1), # 128×7×7
            nn.BatchNorm2d(128),
            nn.ReLU(),
        )
        # Classifier
        self.classifier = nn.Sequential(
            nn.Flatten(),                   # 128×7×7 = 6272
            nn.Linear(6272, 256),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(256, 10),
        )

    def forward(self, x):
        x = self.features(x)
        return self.classifier(x)


model = CNN().to(DEVICE)
params = sum(p.numel() for p in model.parameters())
print(f"CNN parameters: {params:,}")


# ── 3. Train ──────────────────────────────────────────────────────────────────
criterion = nn.CrossEntropyLoss()
optimizer = optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=5)

EPOCHS = 5
history = {"train_loss": [], "val_acc": []}

print(f"\n{'Epoch':>5} {'Train Loss':>12} {'Val Acc':>10}")
print("=" * 32)

for epoch in range(1, EPOCHS + 1):
    model.train()
    total_loss = 0.0
    for X_b, y_b in train_loader:
        X_b, y_b = X_b.to(DEVICE), y_b.to(DEVICE)
        optimizer.zero_grad()
        loss = criterion(model(X_b), y_b)
        loss.backward()
        optimizer.step()
        total_loss += loss.item() * len(X_b)
    scheduler.step()

    model.eval()
    correct = 0
    with torch.no_grad():
        for X_b, y_b in test_loader:
            X_b, y_b = X_b.to(DEVICE), y_b.to(DEVICE)
            correct += (model(X_b).argmax(1) == y_b).sum().item()
    val_acc = correct / len(test_dataset)

    history["train_loss"].append(total_loss / len(train_dataset))
    history["val_acc"].append(val_acc)
    print(f"{epoch:>5} {history['train_loss'][-1]:>12.4f} {val_acc:>10.4f}")

print(f"\nFinal test accuracy: {history['val_acc'][-1]*100:.2f}%")


# ── 4. Demo: Predict 1 image ──────────────────────────────────────────────────
model.eval()
img, true_label = test_dataset[0]   # get first test image
img_batch = img.unsqueeze(0).to(DEVICE)   # add batch dim: 1×1×28×28

with torch.no_grad():
    logits = model(img_batch)
    probs  = torch.softmax(logits, dim=1)[0]
    pred   = probs.argmax().item()

print(f"\nDemo prediction:")
print(f"  True label:      {CLASSES[true_label]}")
print(f"  Predicted:       {CLASSES[pred]} ({probs[pred]*100:.1f}% confidence)")
print(f"  Top 3 predictions:")
top3 = probs.topk(3)
for prob, idx in zip(top3.values, top3.indices):
    print(f"    {CLASSES[idx.item()]:<12} {prob.item()*100:.1f}%")


# ── 5. Visualize predictions ──────────────────────────────────────────────────
fig, axes = plt.subplots(2, 5, figsize=(15, 6))
axes = axes.flatten()

with torch.no_grad():
    for i in range(10):
        img, true_label = test_dataset[i]
        img_b = img.unsqueeze(0).to(DEVICE)
        pred_i = model(img_b).argmax(1).item()
        color = "green" if pred_i == true_label else "red"
        axes[i].imshow(img.squeeze(), cmap="gray")
        axes[i].set_title(f"True: {CLASSES[true_label]}\nPred: {CLASSES[pred_i]}",
                          color=color, fontsize=8)
        axes[i].axis("off")

plt.suptitle("CNN FashionMNIST Predictions (green=correct, red=wrong)")
plt.tight_layout()
plt.savefig("cnn_fashion_predictions.png", dpi=100)
print("Chart saved: cnn_fashion_predictions.png")

torch.save(model.state_dict(), "cnn_fashion.pth")
print("Model saved: cnn_fashion.pth")
