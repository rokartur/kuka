import * as fs from 'fs';

enum PartID {
    Base = 0,
    Body,
    Arm,
    Wrist,
    Tool,
    BlackDisk
}

const DEFAULT_STEP_DELAY_MS: number = 25;
const TARGET_FPS: number = 60;
const INTERPOLATION_FACTOR: number = TARGET_FPS / (1000 / DEFAULT_STEP_DELAY_MS);

function calculateStepsForDuration(durationSeconds: number): number {
    const totalTimeMs = durationSeconds * 1000;
    const baseSteps = Math.floor(totalTimeMs / DEFAULT_STEP_DELAY_MS);
    return Math.floor(baseSteps * INTERPOLATION_FACTOR);
}

const STEPS = calculateStepsForDuration(1);
const ACCELERATION: number = 1;

class Part {
    public id: number;
    public name: string;
    public theta: number;

    constructor(id: number, name: string) {
        this.id = id;
        this.name = name;
        this.theta = 0;
    }

    move(theta: number, acceleration: number, steps: number): number[] {
        if (steps < 0) {
            steps = 0;
        }

        const moves: number[] = [];
        const start = this.theta;
        const end = start + theta;
        const acc = Math.abs(acceleration);

        for (let i = 1; i <= steps; i++) {
            const normalizedTime = i / steps;
            const t = normalizedTime;

            // Smooth transition without acceleration at the start and end.
            // const smoothFactor = t * t * t * (t * (t * 6 - 15) + 10);
            
            // To maintain zero acceleration at the beginning and end, 'acc' should be > 2/3.
            // For acc = 1, smoothFactor equals quinticFactor.
            // For acc > 1, the smoothing effect (slower start/end, faster middle) is enhanced.
            let quinticFactor = t * t * t * (t * (t * 6 - 15) + 10);
            const smoothFactor = Math.pow(quinticFactor, acc);

            const newTheta = start + (end - start) * smoothFactor;

            moves.push(newTheta);
        }

        this.theta = end;
        return moves;
    }
}

class Parts extends Array<Part> {
    label(): string {
        let result = '';
        for (const part of this) {
            result += `${part.name} `;
        }
        return result;
    }
}

interface MoveCommand {
    partId: PartID;
    theta: number;
    acceleration: number;
    steps: number;
}

class Kuka {
    private parts: Parts;
    private file: fs.WriteStream;

    constructor() {
        this.parts = new Parts();
        this.parts.push(
            new Part(PartID.Base, "KukaTheta-1"),
            new Part(PartID.Body, "KukaTheta-2"),
            new Part(PartID.Arm, "KukaTheta-3"),
            new Part(PartID.Wrist, "KukaTheta-4"),
            new Part(PartID.Tool, "KukaTheta-5"),
            new Part(PartID.BlackDisk, "KukaTheta-6")
        );

        this.file = fs.createWriteStream("Kuka.dat");
        this.writeLabel();
    }

    private writeLabel(): void {
        const label = this.parts.label();
        this.file.write(label + '\n');
    }

    movePart(id: number, theta: number, acceleration: number, steps: number): void {
        const moves = this.parts[id].move(theta, acceleration, steps);
        const thetas: number[] = this.parts.map(part => part.theta);

        for (const move of moves) {
            thetas[id] = move;

            let line = '';
            for (const theta of thetas) {
                line += `${theta.toFixed(2)} `;
            }
            line += '\n';

            this.file.write(line);
        }
    }

    moveMultipleParts(commands: MoveCommand[]): void {
        if (commands.length === 0) return;

        const maxSteps = Math.max(...commands.map(cmd => cmd.steps));

        const allMoves: number[][] = [];
        for (let i = 0; i < this.parts.length; i++) {
            allMoves[i] = [];
        }

        for (const command of commands) {
            const moves = this.parts[command.partId].move(command.theta, command.acceleration, command.steps);
            allMoves[command.partId] = moves;
            
            while (allMoves[command.partId].length < maxSteps) {
                allMoves[command.partId].push(moves[moves.length - 1]);
            }
        }

        for (let i = 0; i < this.parts.length; i++) {
            if (allMoves[i].length === 0) {
                for (let j = 0; j < maxSteps; j++) {
                    allMoves[i].push(this.parts[i].theta);
                }
            }
        }

        for (let step = 0; step < maxSteps; step++) {
            let line = '';
            for (let partId = 0; partId < this.parts.length; partId++) {
                line += `${allMoves[partId][step].toFixed(2)} `;
            }
            line += '\n';
            this.file.write(line);
        }
    }

    moveBase(theta: number, acceleration: number, steps: number): void {
        this.movePart(PartID.Base, theta, acceleration, steps);
    }

    moveBody(theta: number, acceleration: number, steps: number): void {
        this.movePart(PartID.Body, theta, acceleration, steps);
    }

    moveArm(theta: number, acceleration: number, steps: number): void {
        this.movePart(PartID.Arm, theta, acceleration, steps);
    }

    moveWrist(theta: number, acceleration: number, steps: number): void {
        this.movePart(PartID.Wrist, theta, acceleration, steps);
    }

    moveTool(theta: number, acceleration: number, steps: number): void {
        this.movePart(PartID.Tool, theta, acceleration, steps);
    }

    moveDisk(theta: number, acceleration: number, steps: number): void {
        this.movePart(PartID.BlackDisk, theta, acceleration, steps);
    }

    close(): void {
        this.file.end();
    }
}

// If you use this code please leave a ⭐ on GitHub:
// https://github.com/rokartur/kuka

function main(): void {
    const kuka = new Kuka();

    try {
        kuka.moveBase(60.0, ACCELERATION, STEPS);
        kuka.moveMultipleParts([
            { partId: PartID.Body, theta: 90.0, acceleration: ACCELERATION, steps: STEPS },
            { partId: PartID.Arm, theta: -90.0, acceleration: ACCELERATION, steps: STEPS }
        ]);
        kuka.moveMultipleParts([
            { partId: PartID.Body, theta: -45.0, acceleration: ACCELERATION, steps: STEPS },
            { partId: PartID.Arm, theta: 90.0, acceleration: ACCELERATION, steps: STEPS },
            { partId: PartID.Tool, theta: -45.0, acceleration: ACCELERATION, steps: STEPS  },
        ]);
        kuka.moveMultipleParts([
            { partId: PartID.Body, theta: -45.0, acceleration: ACCELERATION, steps: STEPS },
            { partId: PartID.Tool, theta: 45.0, acceleration: ACCELERATION, steps: STEPS },
        ]);
        kuka.moveBase(-60.0, ACCELERATION, STEPS);
    } finally {
        kuka.close();
    }
}

main();