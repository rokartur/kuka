# Kuka Robot Simulator

This project is a fork of the original [kndrad/kuka](https://github.com/kndrad/kuka) repository and has been rewritten in TypeScript.

## Description

The project simulates the movements of a Kuka robot arm, generating a data file (`Kuka.dat`) that can be used with RoboWorks software to visualize the robot's movements.

## How it Works

The main class is [`Kuka`](index.ts), which manages the individual parts of the robot. Each robot part is represented by the [`Part`](index.ts) class.

### Basic Robot Parts:

Defined in the [`PartID`](index.ts) enum:
*   `Base`
*   `Body`
*   `Arm`
*   `Wrist`
*   `Tool`
*   `BlackDisk`

### Movement Control

Movements are defined by an angle (`theta`), acceleration (`acceleration`), and the number of steps (`steps`). The number of steps is calculated based on the movement duration using the [`calculateStepsForDuration(durationSeconds)`](index.ts) function. The default number of steps (`STEPS`) and acceleration (`ACCELERATION`) are defined globally.

### `Kuka` Class Methods

*   **`constructor()`**: Initializes the robot, creates instances of the parts, and prepares the `Kuka.dat` file for writing by adding the part labels at the beginning.
*   **`movePart(id: PartID, theta: number, acceleration: number, steps: number)`**: Moves a single robot part.
    *   `id`: Part identifier from [`PartID`](index.ts).
    *   `theta`: Angle of rotation (in degrees).
    *   `acceleration`: Acceleration factor (affects the movement curve).
    *   `steps`: Number of steps to perform the movement.
*   **Helper methods for `movePart`**:
    *   [`moveBase(theta, acceleration, steps)`](index.ts)
    *   [`moveBody(theta, acceleration, steps)`](index.ts)
    *   [`moveArm(theta, acceleration, steps)`](index.ts)
    *   [`moveWrist(theta, acceleration, steps)`](index.ts)
    *   [`moveTool(theta, acceleration, steps)`](index.ts)
    *   [`moveDisk(theta, acceleration, steps)`](index.ts)
*   **`close()`**: Closes the write stream to the `Kuka.dat` file. **This must always be called at the end of operations.**

### New Methods (compared to the original repository)

*   **`moveMultipleParts(commands: MoveCommand[])`**: Allows for the simultaneous movement of multiple robot parts. This is a key new feature.
    *   `commands`: An array of `MoveCommand` objects. Each `MoveCommand` object has the following structure:
        ```typescript
        interface MoveCommand {
            partId: PartID;
            theta: number;
            acceleration: number;
            steps: number;
        }
        ```
    *   The method synchronizes the movements so that all finish at the same time, based on the longest movement (largest number of steps) among all commands. Parts whose movement is shorter will maintain their final position until the longest movement is completed.

Example of using `moveMultipleParts`:
```typescript
// ...existing code...
kuka.moveMultipleParts([
    { partId: PartID.Body, theta: 90.0, acceleration: ACCELERATION, steps: STEPS },
    { partId: PartID.Arm, theta: -90.0, acceleration: ACCELERATION, steps: STEPS }
]);
// ...existing code...
```
In the example above, the `Body` and `Arm` will move simultaneously.

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

The `Kuka.dat` file contains a series of lines, where each line represents the state of the angles of all six robot parts at a given time step. The first line contains the part labels.
