export const FLOOR_MAP_MACHINE_DRAG_DATA_TYPE = 'application/x-qwaste-floor-map-machine';

interface FloorMapMachineDragPayload {
    machineId: string;
}

export const createFloorMapMachineDragPayload = (machineId: string): string =>
    JSON.stringify({ machineId });

export const parseFloorMapMachineDragPayload = (
    payload: string
): FloorMapMachineDragPayload | null => {
    try {
        const parsed = JSON.parse(payload) as Partial<FloorMapMachineDragPayload>;

        if (!parsed.machineId || typeof parsed.machineId !== 'string') {
            return null;
        }

        return { machineId: parsed.machineId };
    } catch {
        return null;
    }
};
