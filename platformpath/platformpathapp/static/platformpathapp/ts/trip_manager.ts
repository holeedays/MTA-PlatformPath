import { PathFinder, type PathStep } from "./path_finder.ts";

export interface TripPhase {
    type: 'enter' | 'transfer' | 'exit';
    stationName: string;
    diagramPath: string;
    fromNodeId?: number;
    toNodeId?: number;
    label: string;
}

class TripManager {
    private phases: TripPhase[];
    private phaseIndex: number = 0;
    private pathFinder: PathFinder;

    // Current phase state
    public currentPath: PathStep[] | null = null;
    public currentIndex: number = 0;

    constructor(phases: TripPhase[], pathFinder: PathFinder) {
        this.phases = phases;
        this.pathFinder = pathFinder;
    }

    // Fetch all the stations in the trip
    public async prefetchStations(): Promise<void> {
        // Get a list of stations in the trip
        const allStationNames = this.phases.map(phase => phase.stationName);

        // remove duplicates (NOTE: doesn't seem necessary, might remove later)
        const uniqueStationNames = [...new Set(allStationNames)];
        
        // Create an array of fetch tasks (Promises) for the PathFinder
        const fetchTasks = uniqueStationNames.map(stationName => {
            return this.pathFinder.fetchStation(stationName);
        });

        // Run all the fetch tasks in parallel and wait for them to complete
        const stations = await Promise.all(fetchTasks);
    }

    public get currentPhase(): TripPhase {
        const phase = this.phases[this.phaseIndex];
        if (!phase) {
            throw new Error('No current phase found');
        }
        return phase;
    }

    public get isLastPhase(): boolean {
        return this.phaseIndex === this.phases.length - 1;
    }

    public get isLastStep(): boolean {
        return this.currentPath !== null && 
            this.currentIndex === this.currentPath.length - 1;
    }

    public get totalPhases(): number {
        return this.phases.length;
    }

    // Load the path for the phase that we are on
    public async loadCurrentPhasePath(): Promise<void> {
        const phase = this.currentPhase;

        // fetch station which is now cached in the PathFinder
        // since we prefetched all stations at the start of the trip
        const station = await this.pathFinder.fetchStation(phase.stationName);
        if (!station) {
            console.error('Failed to load station for current phase:', phase.stationName);
            return;
        }

        this.currentPath = this.pathFinder.findPath(
            station,
            phase.fromNodeId || 0,
            phase.toNodeId || 0
        );
        this.currentIndex = 0;
    }

    // Move to next phase, returns false if already on last phase
    public async advancePhase(): Promise<boolean> {
        if (this.isLastPhase) {
            return false; // Can't advance, already on last phase
        }
        this.phaseIndex++;
        await this.loadCurrentPhasePath();
        return true;
    }

    // Move to next step in current phase, returns 'step' if moved to 
    // next step, 'end-of-phase' if moved past last step, and 'end-of-trip' if on last step of last phase
    public nextStep(): 'step' | 'end-of-phase' | 'end-of-trip' {
        if (!this.currentPath) {
            return 'end-of-trip';
        }

        if (this.currentIndex < this.currentPath.length - 1) {
            this.currentIndex++;
            return 'step';
        } else {
            return 'end-of-phase';
        }
    }

    public prevStep(): void {
        if (this.currentIndex > 0) this.currentIndex--;
    }

    public getAllPhaseLabels(): { label: string; type: string }[] {
        return this.phases.map(phase => ({
            label: phase.label,
            type: phase.type
        }));
    }
}