'use client';

import {
    CompressOutlined,
    FullscreenExitOutlined,
    FullscreenOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
} from '@ant-design/icons';
import { Button, Space, Tooltip, theme } from 'antd';
import Konva from 'konva';
import {
    type DragEvent,
    type TouchEvent,
    type WheelEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    FloorMapDisplayResponse,
    FloorMapMachineDisplayResponse,
    MachineFloorPositionRequest,
} from '@/types/FloorMap';
import { getMachineStatusFill, getMachineStatusStroke } from '../_utils/floorMapColors';
import {
    FLOOR_MAP_MACHINE_DRAG_DATA_TYPE,
    parseFloorMapMachineDragPayload,
} from '../_utils/floorMapDrag';
import {
    DEFAULT_MACHINE_POSITION,
    PixelRect,
    clampPixelRectToImage,
    isMachinePlaced,
    pixelRectToRatio,
    ratioToPixelRect,
} from '../_utils/floorMapRatio';

interface FloorMapKonvaCanvasProps {
    floorMap: FloorMapDisplayResponse;
    selectedMachineId: string | null;
    savingMachineId: string | null;
    readOnly?: boolean;
    minHeight?: number;
    onSelectMachine: (machineId: string | null) => void;
    onUpdateMachine?: (machineId: string, position: MachineFloorPositionRequest) => void;
    onDropMachine?: (machineId: string, position: MachineFloorPositionRequest) => void;
}

const MIN_NODE_WIDTH = 36;
const MIN_NODE_HEIGHT = 28;
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.25;

const clampZoom = (value: number) => Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);

const getImageRectForZoom = (
    image: HTMLImageElement,
    stageSize: { width: number; height: number },
    zoom: number
): PixelRect => {
    const scale =
        Math.min(stageSize.width / image.naturalWidth, stageSize.height / image.naturalHeight) *
        zoom;
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;

    return {
        x: (stageSize.width - width) / 2,
        y: (stageSize.height - height) / 2,
        width,
        height,
    };
};

const clampPan = (
    pan: { x: number; y: number },
    imageRect: PixelRect,
    stageSize: { width: number; height: number }
) => {
    const minX = stageSize.width - (imageRect.x + imageRect.width);
    const maxX = -imageRect.x;
    const minY = stageSize.height - (imageRect.y + imageRect.height);
    const maxY = -imageRect.y;

    return {
        x: imageRect.width > stageSize.width ? Math.min(Math.max(pan.x, minX), maxX) : 0,
        y: imageRect.height > stageSize.height ? Math.min(Math.max(pan.y, minY), maxY) : 0,
    };
};

const isSamePan = (first: { x: number; y: number }, second: { x: number; y: number }) =>
    first.x === second.x && first.y === second.y;

type ReactTouchList = TouchEvent<HTMLDivElement>['touches'];

const getTouchDistance = (touches: ReactTouchList) => {
    const first = touches[0];
    const second = touches[1];

    return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
};

function useElementSize<T extends HTMLElement>() {
    const ref = useRef<T | null>(null);
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const updateSize = () => {
            setSize({
                width: node.clientWidth,
                height: node.clientHeight,
            });
        };

        updateSize();

        const observer = new ResizeObserver(updateSize);
        observer.observe(node);

        return () => observer.disconnect();
    }, []);

    return { ref, size };
}

function useFloorPlanImage(url: string | null) {
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

    useEffect(() => {
        if (!url) {
            setImage(null);
            setStatus('idle');
            return;
        }

        let cancelled = false;
        const nextImage = new window.Image();
        setStatus('loading');

        nextImage.onload = () => {
            if (cancelled) return;
            setImage(nextImage);
            setStatus('loaded');
        };

        nextImage.onerror = () => {
            if (cancelled) return;
            setImage(null);
            setStatus('error');
        };

        nextImage.src = url;

        return () => {
            cancelled = true;
        };
    }, [url]);

    return { image, status };
}

const MACHINE_LABEL_MAX_FONT_SIZE = 13;
const MACHINE_LABEL_MIN_FONT_SIZE = 1;
const MACHINE_LABEL_PADDING = 4;
const MACHINE_LABEL_FONT_STEP = 0.5;

function fitMachineLabelFontSize(measurer: Konva.Text, text: string, width: number, height: number) {
    const availableWidth = Math.max(width - MACHINE_LABEL_PADDING * 2, 1);
    const ceiling = Math.min(
        MACHINE_LABEL_MAX_FONT_SIZE,
        Math.max(MACHINE_LABEL_MIN_FONT_SIZE, height - MACHINE_LABEL_PADDING * 2)
    );

    for (let size = ceiling; size > MACHINE_LABEL_MIN_FONT_SIZE; size -= MACHINE_LABEL_FONT_STEP) {
        measurer.fontSize(size);
        if (measurer.measureSize(text).width <= availableWidth) {
            return size;
        }
    }

    return MACHINE_LABEL_MIN_FONT_SIZE;
}

interface MachineHoverInfo {
    machine: FloorMapMachineDisplayResponse;
    x: number;
    y: number;
}

function createMachineNode({
    machine,
    rect,
    imageRect,
    selected,
    saving,
    readOnly,
    selectedStroke,
    savingFill,
    onSelect,
    onUpdate,
    onHoverChange,
}: {
    machine: FloorMapMachineDisplayResponse;
    rect: PixelRect;
    imageRect: PixelRect;
    selected: boolean;
    saving: boolean;
    readOnly: boolean;
    selectedStroke: string;
    savingFill: string;
    onSelect: () => void;
    onUpdate?: (position: MachineFloorPositionRequest) => void;
    onHoverChange: (info: MachineHoverInfo | null) => void;
}) {
    const statusFill = getMachineStatusFill(machine.currentStatus);
    const statusStroke = getMachineStatusStroke(machine.currentStatus);

    const group = new Konva.Group({
        x: rect.x,
        y: rect.y,
        draggable: !readOnly,
        name: 'machine-node',
    });

    const body = new Konva.Rect({
        width: rect.width,
        height: rect.height,
        fill: saving ? savingFill : statusFill,
        opacity: 1,
        stroke: selected ? selectedStroke : statusStroke,
        strokeWidth: selected ? 2 : 1,
        cornerRadius: 0,
        shadowColor: 'rgba(0, 0, 0, 0.25)',
        shadowBlur: selected ? 8 : 4,
        shadowOffsetY: 2,
        shadowOpacity: selected ? 0.5 : 0.3,
    });

    const label = new Konva.Text({
        text: machine.propertyCode,
        width: rect.width,
        height: rect.height,
        align: 'center',
        verticalAlign: 'middle',
        fill: '#fff',
        fontStyle: 'bold',
        padding: MACHINE_LABEL_PADDING,
        listening: false,
        wrap: 'none',
    });
    label.fontSize(fitMachineLabelFontSize(label, machine.propertyCode, rect.width, rect.height));

    group.add(body);
    group.add(label);

    group.on('click tap', (event) => {
        event.cancelBubble = true;
        onSelect();
    });

    group.on('mouseenter mousemove', () => {
        const stage = group.getStage();
        if (!stage) return;

        stage.container().style.cursor = 'pointer';
        const pointer = stage.getPointerPosition();
        if (pointer) {
            onHoverChange({ machine, x: pointer.x, y: pointer.y });
        }
    });

    group.on('mouseleave', () => {
        const stage = group.getStage();
        if (stage) stage.container().style.cursor = '';
        onHoverChange(null);
    });

    if (!readOnly && onUpdate) {
        group.on('dragend', () => {
            const nextRect = clampPixelRectToImage(
                {
                    x: group.x(),
                    y: group.y(),
                    width: rect.width,
                    height: rect.height,
                },
                imageRect
            );

            group.position({ x: nextRect.x, y: nextRect.y });
            onUpdate(pixelRectToRatio(nextRect, imageRect));
        });

        group.on('transformend', () => {
            const nextRect = clampPixelRectToImage(
                {
                    x: group.x(),
                    y: group.y(),
                    width: rect.width * group.scaleX(),
                    height: rect.height * group.scaleY(),
                },
                imageRect
            );

            group.scale({ x: 1, y: 1 });
            group.position({ x: nextRect.x, y: nextRect.y });
            body.size({ width: nextRect.width, height: nextRect.height });
            label.size({ width: nextRect.width, height: nextRect.height });
            label.fontSize(
                fitMachineLabelFontSize(label, machine.propertyCode, nextRect.width, nextRect.height)
            );
            onUpdate(pixelRectToRatio(nextRect, imageRect));
        });
    }

    return group;
}

export default function FloorMapKonvaCanvas({
    floorMap,
    selectedMachineId,
    savingMachineId,
    readOnly = false,
    minHeight = 420,
    onSelectMachine,
    onUpdateMachine,
    onDropMachine,
}: FloorMapKonvaCanvasProps) {
    const { t } = useTranslation();
    const { token } = theme.useToken();
    const { ref: containerRef, size } = useElementSize<HTMLDivElement>();
    const stageHostRef = useRef<HTMLDivElement | null>(null);
    const pinchStateRef = useRef<{
        distance: number;
        ratioX: number;
        ratioY: number;
        zoom: number;
    } | null>(null);
    const [isDragOverImage, setIsDragOverImage] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenSupported, setFullscreenSupported] = useState(false);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [hoveredMachine, setHoveredMachine] = useState<MachineHoverInfo | null>(null);
    const { image, status } = useFloorPlanImage(floorMap.floorPlanImageUrl);

    const imageRect = useMemo<PixelRect | null>(() => {
        if (!image || size.width <= 0 || size.height <= 0) return null;

        return getImageRectForZoom(image, size, zoom);
    }, [image, size.height, size.width, zoom]);

    const zoomToPoint = (nextZoom: number, point: { x: number; y: number }) => {
        if (!image || !imageRect) return;

        const currentPan = clampPan(pan, imageRect, size);
        const ratioX = (point.x - currentPan.x - imageRect.x) / imageRect.width;
        const ratioY = (point.y - currentPan.y - imageRect.y) / imageRect.height;
        const nextImageRect = getImageRectForZoom(image, size, nextZoom);
        const nextPan = clampPan(
            {
                x: point.x - nextImageRect.x - ratioX * nextImageRect.width,
                y: point.y - nextImageRect.y - ratioY * nextImageRect.height,
            },
            nextImageRect,
            size
        );

        setZoom(nextZoom);
        setPan(nextPan);
    };

    const zoomToCenter = (nextZoom: number) => {
        zoomToPoint(nextZoom, { x: size.width / 2, y: size.height / 2 });
    };

    const handleZoomIn = () => {
        zoomToCenter(clampZoom(zoom + ZOOM_STEP));
    };

    const handleZoomOut = () => {
        zoomToCenter(clampZoom(zoom - ZOOM_STEP));
    };

    const handleResetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleToggleFullscreen = async () => {
        const container = containerRef.current;
        if (!container || !fullscreenSupported) return;

        try {
            if (document.fullscreenElement === container) {
                await document.exitFullscreen();
                return;
            }

            await container.requestFullscreen();
        } catch {
            setIsFullscreen(document.fullscreenElement === container);
        }
    };

    useEffect(() => {
        const container = containerRef.current;
        const canFullscreen = Boolean(
            document.fullscreenEnabled && container?.requestFullscreen
        );

        setFullscreenSupported(canFullscreen);

        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === container);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        handleFullscreenChange();

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [containerRef]);

    useEffect(() => {
        if (!imageRect) return;

        setPan((prev) => {
            const next = clampPan(prev, imageRect, size);
            return isSamePan(prev, next) ? prev : next;
        });
    }, [imageRect, size]);

    useEffect(() => {
        const host = stageHostRef.current;
        if (!host || size.width <= 0 || size.height <= 0) return;

        host.innerHTML = '';

        const stage = new Konva.Stage({
            container: host,
            width: size.width,
            height: size.height,
        });

        const contentLayer = new Konva.Layer();

        stage.add(contentLayer);

        if (image && imageRect) {
            const boundedPan = clampPan(pan, imageRect, size);
            const canPan = imageRect.width > size.width || imageRect.height > size.height;
            const viewportGroup = new Konva.Group({
                x: boundedPan.x,
                y: boundedPan.y,
                draggable: canPan,
                dragBoundFunc: (nextPan) => clampPan(nextPan, imageRect, size),
            });
            const backgroundImage = new Konva.Shape({
                x: imageRect.x,
                y: imageRect.y,
                width: imageRect.width,
                height: imageRect.height,
                name: 'floor-plan-image',
                sceneFunc(ctx, shape) {
                    const native = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;
                    const prev = native.imageSmoothingEnabled;
                    native.imageSmoothingEnabled = false;
                    native.drawImage(image, 0, 0, shape.width(), shape.height());
                    native.imageSmoothingEnabled = prev;
                },
                hitFunc(ctx, shape) {
                    ctx.beginPath();
                    ctx.rect(0, 0, shape.width(), shape.height());
                    ctx.closePath();
                    ctx.fillStrokeShape(shape);
                },
            });

            backgroundImage.on('click tap', () => {
                onSelectMachine(null);
            });

            backgroundImage.on('mouseenter', () => {
                if (canPan) {
                    stage.container().style.cursor = 'grab';
                }
            });

            backgroundImage.on('mouseleave', () => {
                stage.container().style.cursor = '';
            });

            viewportGroup.on('dragstart', () => {
                if (canPan) {
                    stage.container().style.cursor = 'grabbing';
                }
            });

            viewportGroup.on('dragend', () => {
                stage.container().style.cursor = canPan ? 'grab' : '';
                setPan(clampPan({ x: viewportGroup.x(), y: viewportGroup.y() }, imageRect, size));
            });

            viewportGroup.add(backgroundImage);

            floorMap.machines.filter(isMachinePlaced).forEach((machine) => {
                const rect = ratioToPixelRect(machine, imageRect);
                if (!rect) return;

                const node = createMachineNode({
                    machine,
                    rect,
                    imageRect,
                    selected: machine.machineId === selectedMachineId,
                    saving: machine.machineId === savingMachineId,
                    readOnly,
                    selectedStroke: token.colorPrimary,
                    savingFill: token.colorWarning,
                    onSelect: () => onSelectMachine(machine.machineId),
                    onUpdate: onUpdateMachine
                        ? (position) => onUpdateMachine(machine.machineId, position)
                        : undefined,
                    onHoverChange: setHoveredMachine,
                });

                viewportGroup.add(node);

                if (!readOnly && machine.machineId === selectedMachineId) {
                    const transformer = new Konva.Transformer({
                        nodes: [node],
                        rotateEnabled: false,
                        borderStroke: token.colorPrimary,
                        anchorStroke: token.colorPrimary,
                        anchorFill: token.colorBgContainer,
                        anchorSize: 8,
                        anchorCornerRadius: 2,
                        enabledAnchors: [
                            'top-left',
                            'top-right',
                            'bottom-left',
                            'bottom-right',
                            'middle-left',
                            'middle-right',
                            'top-center',
                            'bottom-center',
                        ],
                        boundBoxFunc: (oldBox, newBox) => {
                            if (
                                newBox.width < MIN_NODE_WIDTH ||
                                newBox.height < MIN_NODE_HEIGHT
                            ) {
                                return oldBox;
                            }
                            return newBox;
                        },
                    });

                    viewportGroup.add(transformer);
                }
            });

            contentLayer.add(viewportGroup);
        }

        stage.on('mousedown touchstart', (event) => {
            if (event.target === stage) {
                onSelectMachine(null);
            }
        });

        contentLayer.draw();

        return () => {
            stage.destroy();
            host.innerHTML = '';
            setHoveredMachine(null);
        };
    }, [
        floorMap.machines,
        image,
        imageRect,
        onSelectMachine,
        onUpdateMachine,
        pan,
        readOnly,
        savingMachineId,
        selectedMachineId,
        size,
        size.height,
        size.width,
        token.colorBgContainer,
        token.colorPrimary,
        token.colorWarning,
    ]);

    const hasMachineDragPayload = (event: DragEvent<HTMLDivElement>) =>
        Array.from(event.dataTransfer.types).includes(FLOOR_MAP_MACHINE_DRAG_DATA_TYPE);

    const getLocalDropPoint = (event: DragEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container || !imageRect) return null;

        const containerRect = container.getBoundingClientRect();
        const boundedPan = clampPan(pan, imageRect, size);
        const x = event.clientX - containerRect.left - boundedPan.x;
        const y = event.clientY - containerRect.top - boundedPan.y;

        if (
            x < imageRect.x ||
            x > imageRect.x + imageRect.width ||
            y < imageRect.y ||
            y > imageRect.y + imageRect.height
        ) {
            return null;
        }

        return { x, y };
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        if (readOnly) return;

        if (!hasMachineDragPayload(event) || !getLocalDropPoint(event)) {
            setIsDragOverImage(false);
            return;
        }

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        setIsDragOverImage(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        if (
            event.relatedTarget instanceof Node &&
            event.currentTarget.contains(event.relatedTarget)
        ) {
            return;
        }

        setIsDragOverImage(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        if (readOnly || !onDropMachine) return;

        const payload = parseFloorMapMachineDragPayload(
            event.dataTransfer.getData(FLOOR_MAP_MACHINE_DRAG_DATA_TYPE)
        );
        const dropPoint = getLocalDropPoint(event);

        if (!payload || !dropPoint || !imageRect) {
            setIsDragOverImage(false);
            return;
        }

        event.preventDefault();
        setIsDragOverImage(false);

        const width = DEFAULT_MACHINE_POSITION.widthRatio * imageRect.width;
        const height = DEFAULT_MACHINE_POSITION.heightRatio * imageRect.height;
        const rect = clampPixelRectToImage(
            {
                x: dropPoint.x - width / 2,
                y: dropPoint.y - height / 2,
                width,
                height,
            },
            imageRect
        );

        onDropMachine(payload.machineId, pixelRectToRatio(rect, imageRect));
    };

    const getLocalTouchCenter = (touches: ReactTouchList) => {
        const container = containerRef.current;
        if (!container) return null;

        const containerRect = container.getBoundingClientRect();
        const first = touches[0];
        const second = touches[1];

        return {
            x: (first.clientX + second.clientX) / 2 - containerRect.left,
            y: (first.clientY + second.clientY) / 2 - containerRect.top,
        };
    };

    const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
        if (event.touches.length !== 2 || !imageRect) return;

        const center = getLocalTouchCenter(event.touches);
        if (!center) return;

        const boundedPan = clampPan(pan, imageRect, size);
        const distance = getTouchDistance(event.touches);
        if (distance <= 0) return;

        event.preventDefault();
        pinchStateRef.current = {
            distance,
            ratioX: (center.x - boundedPan.x - imageRect.x) / imageRect.width,
            ratioY: (center.y - boundedPan.y - imageRect.y) / imageRect.height,
            zoom,
        };
    };

    const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
        const pinchState = pinchStateRef.current;
        if (event.touches.length !== 2 || !pinchState || !image || !imageRect) return;

        const center = getLocalTouchCenter(event.touches);
        if (!center) return;

        event.preventDefault();

        const nextZoom = clampZoom(
            pinchState.zoom * (getTouchDistance(event.touches) / pinchState.distance)
        );
        const nextImageRect = getImageRectForZoom(image, size, nextZoom);
        const nextPan = clampPan(
            {
                x: center.x - nextImageRect.x - pinchState.ratioX * nextImageRect.width,
                y: center.y - nextImageRect.y - pinchState.ratioY * nextImageRect.height,
            },
            nextImageRect,
            size
        );

        setZoom(nextZoom);
        setPan(nextPan);
    };

    const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
        if (event.touches.length < 2) {
            pinchStateRef.current = null;
        }
    };

    const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
        if (!imageRect || !containerRef.current) return;

        event.preventDefault();

        const containerRect = containerRef.current.getBoundingClientRect();
        const point = {
            x: event.clientX - containerRect.left,
            y: event.clientY - containerRect.top,
        };
        const direction = event.deltaY > 0 ? -1 : 1;

        zoomToPoint(clampZoom(zoom + direction * ZOOM_STEP), point);
    };

    return (
        <div
            ref={containerRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onWheel={handleWheel}
            style={{
                position: 'relative',
                height: isFullscreen ? '100vh' : '100%',
                minHeight: isFullscreen ? '100vh' : minHeight,
                border: isDragOverImage
                    ? `2px dashed ${token.colorPrimary}`
                    : `1px solid ${token.colorBorderSecondary}`,
                borderRadius: isFullscreen ? 0 : token.borderRadiusLG,
                // Floor plan drawings use dark line work, so the canvas stays white in both themes
                background: '#ffffff',
                boxShadow: isDragOverImage ? `0 0 0 4px ${token.colorPrimaryBg}` : undefined,
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                overflow: 'hidden',
                touchAction: 'none',
            }}
        >
            <div ref={stageHostRef} style={{ width: '100%', height: '100%' }} />

            <Space
                size={4}
                onWheel={(event) => event.stopPropagation()}
                style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    padding: 4,
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadius,
                    background: token.colorBgElevated,
                    boxShadow: token.boxShadowSecondary,
                }}
            >
                <Tooltip title={t('floorMap.actions.zoomOut')}>
                    <Button
                        size="small"
                        icon={<ZoomOutOutlined />}
                        disabled={zoom <= MIN_ZOOM}
                        onClick={handleZoomOut}
                    />
                </Tooltip>
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 44,
                        height: 24,
                        color: token.colorTextSecondary,
                        fontSize: 12,
                        fontWeight: 500,
                        fontVariantNumeric: 'tabular-nums',
                    }}
                >
                    {Math.round(zoom * 100)}%
                </span>
                <Tooltip title={t('floorMap.actions.zoomIn')}>
                    <Button
                        size="small"
                        icon={<ZoomInOutlined />}
                        disabled={zoom >= MAX_ZOOM}
                        onClick={handleZoomIn}
                    />
                </Tooltip>
                <Tooltip title={t('floorMap.actions.fitView')}>
                    <Button
                        size="small"
                        icon={<CompressOutlined />}
                        disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                        onClick={handleResetZoom}
                    />
                </Tooltip>
                {fullscreenSupported && (
                    <Tooltip
                        title={t(
                            isFullscreen
                                ? 'floorMap.actions.exitFullscreen'
                                : 'floorMap.actions.fullscreen'
                        )}
                    >
                        <Button
                            size="small"
                            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                            onClick={handleToggleFullscreen}
                        />
                    </Tooltip>
                )}
            </Space>

            {hoveredMachine && (
                <div
                    style={{
                        position: 'absolute',
                        left: hoveredMachine.x + 14,
                        top: hoveredMachine.y + 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 10px',
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: token.borderRadius,
                        background: token.colorBgElevated,
                        boxShadow: token.boxShadowSecondary,
                        color: token.colorText,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 10,
                    }}
                >
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: getMachineStatusFill(hoveredMachine.machine.currentStatus),
                            flexShrink: 0,
                        }}
                    />
                    <span style={{ fontWeight: 600 }}>{hoveredMachine.machine.propertyCode}</span>
                    <span style={{ color: token.colorTextSecondary }}>
                        {t(`floorMap.status.${hoveredMachine.machine.currentStatus}`, {
                            defaultValue: hoveredMachine.machine.currentStatus ?? '',
                        })}
                    </span>
                </div>
            )}

            {!readOnly && status === 'loaded' && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        padding: '4px 10px',
                        border: `1px solid ${token.colorBorderSecondary}`,
                        borderRadius: 999,
                        background: token.colorBgElevated,
                        boxShadow: token.boxShadow,
                        color: token.colorTextTertiary,
                        fontSize: 12,
                        pointerEvents: 'none',
                    }}
                >
                    {t('floorMap.canvas.dragHint')}
                </div>
            )}

            {status === 'error' && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: token.colorTextTertiary,
                        pointerEvents: 'none',
                    }}
                >
                    {t('floorMap.messages.imageLoadFailed')}
                </div>
            )}
        </div>
    );
}
