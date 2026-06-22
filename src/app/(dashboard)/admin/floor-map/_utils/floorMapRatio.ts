import { FloorMapMachineResponse, MachineFloorPositionRequest } from '@/types/FloorMap';

export const DEFAULT_MACHINE_POSITION: MachineFloorPositionRequest = {
    xRatio: 0.08,
    yRatio: 0.08,
    widthRatio: 0.12,
    heightRatio: 0.08,
};

export interface PixelRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const isMachinePlaced = (machine: FloorMapMachineResponse): boolean =>
    machine.xRatio != null &&
    machine.yRatio != null &&
    machine.widthRatio != null &&
    machine.heightRatio != null;

const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max);

export const clampMachinePosition = (
    position: MachineFloorPositionRequest
): MachineFloorPositionRequest => {
    const widthRatio = clamp(position.widthRatio, 0.001, 1);
    const heightRatio = clamp(position.heightRatio, 0.001, 1);

    return {
        widthRatio,
        heightRatio,
        xRatio: clamp(position.xRatio, 0, 1 - widthRatio),
        yRatio: clamp(position.yRatio, 0, 1 - heightRatio),
    };
};

export const getDefaultMachinePosition = (index: number): MachineFloorPositionRequest => {
    const offset = (index % 6) * 0.025;

    return clampMachinePosition({
        ...DEFAULT_MACHINE_POSITION,
        xRatio: DEFAULT_MACHINE_POSITION.xRatio + offset,
        yRatio: DEFAULT_MACHINE_POSITION.yRatio + offset,
    });
};

export const ratioToPixelRect = (
    machine: FloorMapMachineResponse,
    imageRect: PixelRect
): PixelRect | null => {
    if (!isMachinePlaced(machine)) return null;

    return {
        x: imageRect.x + machine.xRatio! * imageRect.width,
        y: imageRect.y + machine.yRatio! * imageRect.height,
        width: machine.widthRatio! * imageRect.width,
        height: machine.heightRatio! * imageRect.height,
    };
};

export const pixelRectToRatio = (
    rect: PixelRect,
    imageRect: PixelRect
): MachineFloorPositionRequest => {
    const x = clamp(rect.x, imageRect.x, imageRect.x + imageRect.width);
    const y = clamp(rect.y, imageRect.y, imageRect.y + imageRect.height);
    const width = clamp(rect.width, 1, imageRect.width);
    const height = clamp(rect.height, 1, imageRect.height);

    return clampMachinePosition({
        xRatio: (x - imageRect.x) / imageRect.width,
        yRatio: (y - imageRect.y) / imageRect.height,
        widthRatio: width / imageRect.width,
        heightRatio: height / imageRect.height,
    });
};

export const clampPixelRectToImage = (rect: PixelRect, imageRect: PixelRect): PixelRect => {
    const width = clamp(rect.width, 1, imageRect.width);
    const height = clamp(rect.height, 1, imageRect.height);

    return {
        width,
        height,
        x: clamp(rect.x, imageRect.x, imageRect.x + imageRect.width - width),
        y: clamp(rect.y, imageRect.y, imageRect.y + imageRect.height - height),
    };
};
