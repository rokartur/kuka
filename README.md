# Kuka Robot Simulator

This project is a fork of the original [kndrad/kuka](https://github.com/kndrad/kuka) repository and has been rewritten in TypeScript.

## Description

The project simulates the movements of a Kuka robot arm, generating a data file (`Kuka.dat`) that can be used with RoboWorks software to visualize the robot's movements.

## How it Works

The simulator uses functional programming approach with TypeScript. Each robot part is represented by the [`Part`](index.ts) interface.

### Basic Robot Parts:

Defined in the [`PartID`](index.ts) enum:
*   `Base` (0)
*   `Body` (1)
*   `Arm` (2)
*   `Wrist` (3)
*   `Tool` (4)
*   `BlackDisk` (5)

### Movement Control

Movements are defined by an angle (`theta`) and the number of steps (`steps`). The simulator uses an easing function (`easeInOutCubic`) to create smooth animations. The default number of steps (`STEPS`) is calculated automatically based on the target execution duration.

### Configuration Constants

*   `DEFAULT_STEP_DELAY_MS = 25`: Default delay between steps in milliseconds
*   `TARGET_FPS = 60`: Target frames per second
*   `TARGET_EXECUTION_DURATION_SECONDS = 6`: Target duration for each movement sequence
*   `STEPS`: Automatically calculated number of steps for smooth animation

### Core Functions

*   **`initializeKuka()`**: Initializes the robot, creates instances of the parts, and prepares the `Kuka.dat` file for writing by adding the part labels at the beginning.

*   **`movePartByID(id: number, theta: number, steps: number)`**: Moves a single robot part.
    *   `id`: Part identifier from [`PartID`](index.ts)
    *   `theta`: Angle of rotation (in degrees)
    *   `steps`: Number of steps to perform the movement

*   **`moveMultipleParts(commands: MoveCommand[])`**: Allows for the simultaneous movement of multiple robot parts.
    *   `commands`: An array of `MoveCommand` objects. Each `MoveCommand` object has the following structure:
        ```typescript
        interface MoveCommand {
            partId: PartID;
            theta: number;
            steps: number;
        }
        ```
    *   The method synchronizes the movements so that all finish at the same time, based on the longest movement (largest number of steps) among all commands. Parts whose movement is shorter will maintain their final position until the longest movement is completed.

*   **`movePart(part: Part, theta: number, steps: number): number[]`**: Internal function that calculates smooth movement trajectory using easing.

*   **`easeInOutCubic(t: number): number`**: Easing function for smooth animation transitions.

### Example Usage

```typescript
// Move single part
movePartByID(PartID.Base, 60, STEPS);

// Move multiple parts simultaneously  
moveMultipleParts([
    { partId: PartID.Body, theta: 90.0, steps: STEPS },
    { partId: PartID.Arm, theta: -90.0, steps: STEPS }
]);
```

## How to Use

1.  Clone the repository.
2.  Install dependencies:
    ```sh
    bun install
    ```
3.  Modify the movement sequences in the `main` function in the [`index.ts`](index.ts) file as needed.
4.  Run the script:
    ```sh
    bun run start
    ```
    This will generate a `Kuka.dat` file in the project's root directory.
5.  Open the `Kuka.dat` file in RoboWorks software to visualize the robot's movements.

## Output Format

The `Kuka.dat` file contains a series of lines, where each line represents the state of the angles of all six robot parts at a given time step. The first line contains the part labels (`KukaTheta-1` through `KukaTheta-6`), and subsequent lines contain the angle values formatted to 2 decimal places.

## Key Differences from Original

*   Rewritten in TypeScript with type safety
*   Functional programming approach instead of class-based
*   Automatic step calculation based on target duration
*   Built-in easing functions for smooth animations
*   Simplified API with fewer parameters (no manual acceleration parameter)
*   Enhanced `moveMultipleParts` function for complex coordinated movements