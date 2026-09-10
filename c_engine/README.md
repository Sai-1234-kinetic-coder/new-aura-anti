# AuraFit C Core Engine: AI-Powered Environment Safety & Exercise Pose System

High-performance, pure C99 standalone console application implementing real-time spatial safety analysis, biomechanical kinematic tracking, dynamic fatigue scaling, and robust Data Structures & Algorithms (DSA).

---

## 🏛️ Architecture & Data Structures (DSA)

### 1. Dynamic Landmark & Kinematics Structure (`Point2D`, `Vector2D`, `PoseLandmarks`)
- **Memory Layout**: Continuous struct representations of coordinate streams $(x, y)$ with confidence score metrics.
- **Euclidean Vector Math**: Computes relative vectors $\vec{BA} = A - B$ and $\vec{BC} = C - B$, vector magnitudes $|\vec{v}| = \sqrt{v_x^2 + v_y^2}$, dot products $\vec{BA} \cdot \vec{BC}$, and inner joint angle $\theta = \arccos\left(\text{clamp}\left(\frac{\vec{BA} \cdot \vec{BC}}{|\vec{BA}| |\vec{BC}|}\right)\right) \times \frac{180}{\pi}$.
- **Jitter Filtering**: Exponential Moving Average (EMA) smoother $\theta_{t} = \alpha \theta_{\text{raw}} + (1 - \alpha) \theta_{t-1}$.

### 2. Spatial Matrix Density Engine (`EnvironmentGrid`, `SpatialScanReport`)
- **2D Density Matrix**: $N \times M$ grid evaluating operational volume density (0 = Free Space, 1 = Cautionary Buffer, 2 = Obstacle/Wall, 3 = Hazard, 9 = User Centroid).
- **Proximity & Free-Space Algorithm**: Calculates free-space ratio $\frac{N_{\text{empty}}}{N_{\text{total}}}$, obstacle density, and Euclidean clearance distance $d = \sqrt{(r_u - r_o)^2 + (c_u - c_o)^2} \times \text{cell\_size}$.
- **Safety Classification**: Dispatches status (`EXCELLENT`, `ADEQUATE`, `CONGESTED_WARNING`, `DANGEROUS_BLOCKED`) and computes composite 0–100 safety score.

### 3. FIFO Alert Queue Data Structure (`AlertQueue`, `AlertItem`)
- **Real-Time Buffer**: Circular ring-buffer FIFO queue with $O(1)$ enqueue and $O(1)$ dequeue operations.
- **Safety Guidance**: Stores categorized and prioritized alerts (`ALERT_INFO`, `ALERT_CAUTION`, `ALERT_WARNING`, `ALERT_CRITICAL`) with automatic ring eviction on saturation.

### 4. Dynamic Array Rep History Log (`RepHistoryList`, `RepLogEntry`)
- **Dynamic Array**: Amortized $O(1)$ append with geometric doubling reallocation ($2\times$).
- **Workout Analytics**: Logs individual rep telemetry (ROM angles, duration, form score %, fatigue %, rating) and computes aggregate metrics (average form %, consistency %, fatigue curves).

### 5. Rule-Based Dynamic Fatigue Adjuster (`FatigueEngine`, `FatigueScalingResult`)
- **Composite Fatigue Index (CFI)**:
  $$\text{CFI} = 0.35 \cdot \text{MentalFatigue} + 0.25 \cdot \text{RPE}_{\text{norm}} + 0.20 \cdot \text{FormBreakdown} + 0.10 \cdot \text{CadencePenalty} + 0.10 \cdot \text{Tremor}$$
- **Dynamic Scaling Rules**:
  - $\text{CFI} \ge 80\%$: Critical threshold; dynamically cuts remaining target reps by 50% and enforces extended rest interval.
  - $65\% \le \text{CFI} < 80\%$: Elevated fatigue; scales target reps by $-30\%$.
  - $45\% \le \text{CFI} < 65\%$: Moderate fatigue; trims target reps by $-15\%$.
  - $\text{CFI} < 45\%$: Nominal planned volume maintained.

---

## 🚀 Compilation & Execution

### 1. Instant Single-File Compilation (Recommended)
```bash
# GCC (Linux / macOS / MinGW / Windows)
gcc -O2 -std=c99 aurafit_standalone.c -o aurafit -lm

# Clang
clang -O2 -std=c99 aurafit_standalone.c -o aurafit -lm

# MSVC (Windows Developer Command Prompt)
cl /O2 aurafit_standalone.c /Fe:aurafit.exe
```

### 2. Modular Build (Makefile)
```bash
make
./aurafit
```

### 3. Automated Algorithmic Verification Suite
```bash
./aurafit --test
```

---

## 🖥️ Interactive Console Menu Features

1. **Live Interactive Workout Simulation**: Streams kinematic landmarks through the FSM state tracker with real-time HUD gauge, form scores, and dynamic fatigue adjustments.
2. **Spatial Environment Matrix Scanner & Radar**: Interactive ASCII radar scan of room density with obstacle proximity alerts.
3. **Biomechanical Vector Math Lab**: Computes Euclidean dot products and interior angles for custom $(x, y)$ coordinate triplets.
4. **Dynamic Fatigue Scaling Demo**: Test rule-based target rep adjustments under varying mental/physical fatigue.
5. **Completed Workout Rep History & Analytics Report**: Tabular breakdown of completed reps and performance consistency metrics.
6. **Safety & Guidance FIFO Alert Queue Inspector**: View and drain buffered real-time safety advisories.
7. **Automated Algorithmic Test Suite**: Runs self-verifying unit tests for all mathematical, matrix, queue, and FSM components.
