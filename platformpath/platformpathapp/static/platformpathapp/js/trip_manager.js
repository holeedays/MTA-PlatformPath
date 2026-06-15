import { PathFinder } from "./path_finder.js";
export class TripManager {
    phases;
    phaseIndex = 0;
    pathFinder;
    // Current phase state
    currentPath = null;
    currentIndex = 0;
    currentStation = null;
    constructor(phases, pathFinder) {
        this.phases = phases;
        this.pathFinder = pathFinder;
    }
    // Fetch all the stations in the trip
    async prefetchStations() {
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
    get currentPhase() {
        const phase = this.phases[this.phaseIndex];
        if (!phase) {
            throw new Error('No current phase found');
        }
        return phase;
    }
    get isLastPhase() {
        return this.phaseIndex === this.phases.length - 1;
    }
    get isLastStep() {
        return this.currentPath !== null &&
            this.currentIndex === this.currentPath.length - 1;
    }
    get totalPhases() {
        return this.phases.length;
    }
    get isFirstStepOfTrip() {
        return this.phaseIndex === 0 && this.currentIndex === 0;
    }
    // Load the path for the phase that we are on
    async loadCurrentPhasePath() {
        const phase = this.currentPhase;
        // fetch station which is now cached in the PathFinder
        // since we prefetched all stations at the start of the trip
        const station = await this.pathFinder.fetchStation(phase.stationName);
        if (!station) {
            console.error('Failed to load station for current phase:', phase.stationName);
            return;
        }
        // Store StationResponse for current station
        this.currentStation = station;
        this.currentPath = this.pathFinder.findPath(station, phase.fromNodeId || 0, phase.toNodeId || 0);
        this.currentIndex = 0;
    }
    // Move to next phase, returns false if already on last phase
    async advancePhase() {
        if (this.isLastPhase) {
            return false; // Can't advance, already on last phase
        }
        this.phaseIndex++;
        await this.loadCurrentPhasePath();
        return true;
    }
    // Move to next step in current phase, returns 'step' if moved to 
    // next step, 'end-of-phase' if moved past last step, and 'end-of-trip' if on last step of last phase
    nextStep() {
        if (!this.currentPath) {
            return 'end-of-trip';
        }
        if (this.currentIndex < this.currentPath.length - 1) {
            this.currentIndex++;
            return 'step';
        }
        else {
            if (this.isLastPhase) {
                return 'end-of-trip';
            }
            return 'end-of-phase';
        }
    }
    // Move to previous step, or previous phase if
    // at the start of a phase that is not the first one
    async prevStep() {
        if (this.currentIndex > 0) { // Within a phase
            this.currentIndex--;
            return 'step';
        }
        else if (this.phaseIndex > 0) { // At the start of a phase with a previous phase
            this.phaseIndex--;
            await this.loadCurrentPhasePath();
            // Set index to the last step of newly loaded previous phase
            if (this.currentPath) {
                this.currentIndex = this.currentPath.length - 1;
            }
            else {
                this.currentIndex = 0;
            }
            return 'phase-changed';
        }
        else { // At the very start
            return 'at-start';
        }
    }
    getAllPhaseLabels() {
        return this.phases.map(phase => ({
            label: phase.label,
            type: phase.type
        }));
    }
}
//# sourceMappingURL=trip_manager.js.map