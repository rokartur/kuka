import * as fs from 'fs';

enum PartID { Base = 0, Body, Arm, Wrist, Tool, BlackDisk }

interface Part { id: number; name: string; theta: number; }
interface MoveCommand { partId: PartID; theta: number; steps: number; }

const DEFAULT_STEP_DELAY_MS = 25, TARGET_FPS = 60, TARGET_EXECUTION_DURATION_SECONDS = 6;
const INTERPOLATION_FACTOR = TARGET_FPS / (1000 / DEFAULT_STEP_DELAY_MS);
const TARGET_STEPS_FOR_EXECUTION = Math.round((TARGET_EXECUTION_DURATION_SECONDS * 1000) / DEFAULT_STEP_DELAY_MS);
const baseStepsFromInput = Math.ceil(TARGET_STEPS_FOR_EXECUTION / INTERPOLATION_FACTOR);
const durationInputForCalcSteps = (baseStepsFromInput * DEFAULT_STEP_DELAY_MS) / 1000;

const calculateStepsForDuration = (durationInput: number): number => Math.floor((Math.floor(durationInput * 1000 / DEFAULT_STEP_DELAY_MS) * INTERPOLATION_FACTOR));
const easeInOutCubic = (t: number): number => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const STEPS = calculateStepsForDuration(durationInputForCalcSteps);

let parts: Part[] = [];
let file: fs.WriteStream;

const createPart = (id: number, name: string): Part => ({ id, name, theta: 0 });

const getPartsLabel = (): string => parts.map(part => part.name).join(' ') + ' ';

const initializeKuka = (): void => {
    parts = [
        createPart(PartID.Base, "KukaTheta-1"), createPart(PartID.Body, "KukaTheta-2"),
        createPart(PartID.Arm, "KukaTheta-3"), createPart(PartID.Wrist, "KukaTheta-4"),
        createPart(PartID.Tool, "KukaTheta-5"), createPart(PartID.BlackDisk, "KukaTheta-6")
    ];
    file = fs.createWriteStream("Kuka.dat");
    file.write(getPartsLabel() + '\n');
};

const movePart = (part: Part, theta: number, steps: number): number[] => {
    if (steps < 0) steps = 0;
    const moves: number[] = [], start = part.theta, end = start + theta;
    for (let i = 1; i <= steps; i++) {
        const normalizedTime = i / steps, easedFactor = easeInOutCubic(normalizedTime);
        moves.push(start + (end - start) * easedFactor);
    }
    part.theta = end;
    return moves;
};

const movePartByID = (id: number, theta: number, steps: number): void => {
    const moves = movePart(parts[id], theta, steps);
    const thetas = parts.map(part => part.theta);
    moves.forEach(move => {
        thetas[id] = move;
        file.write(thetas.map(t => t.toFixed(2)).join(' ') + ' \n');
    });
};

const moveMultipleParts = (commands: MoveCommand[]): void => {
    if (commands.length === 0) return;
    const maxSteps = Math.max(...commands.map(cmd => cmd.steps));
    const allMoves: number[][] = Array(parts.length).fill(null).map(() => []);

    commands.forEach(command => {
        const moves = movePart(parts[command.partId], command.theta, command.steps);
        allMoves[command.partId] = moves;
        while (allMoves[command.partId].length < maxSteps) {
            allMoves[command.partId].push(moves[moves.length - 1]);
        }
    });

    for (let i = 0; i < parts.length; i++) {
        if (allMoves[i].length === 0) {
            allMoves[i] = Array(maxSteps).fill(parts[i].theta);
        }
    }

    for (let step = 0; step < maxSteps; step++) {
        file.write(allMoves.map(moves => moves[step].toFixed(2)).join(' ') + ' \n');
    }
};

const main = (): void => {
    initializeKuka();
    try {
        movePartByID(PartID.Base, 60, STEPS);
        moveMultipleParts([
            { partId: PartID.Body, theta: 90.0, steps: STEPS },
            { partId: PartID.Arm, theta: -90.0, steps: STEPS }
        ]);
        moveMultipleParts([
            { partId: PartID.Body, theta: -45.0, steps: STEPS },
            { partId: PartID.Arm, theta: 90.0, steps: STEPS },
            { partId: PartID.Tool, theta: -45.0, steps: STEPS },
        ]);
        moveMultipleParts([
            { partId: PartID.Body, theta: -45.0, steps: STEPS },
            { partId: PartID.Tool, theta: 45.0, steps: STEPS },
        ]);
        movePartByID(PartID.Base, -60, STEPS);
    } finally {
        file.end();
    }
};

main();