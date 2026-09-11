export type TimeGrain =
    | 'HALF_HOUR'
    | 'HOUR'
    | 'DAY'
    | 'WEEK'
    | 'ISO_WEEK'
    | 'MONTH'
    | 'QUARTER'
    | 'YEAR';

export type LabelStyle =
    | 'AUTO'
    | 'CLOCK'
    | 'CLOCK_RANGE'
    | 'WEEKDAY'
    | 'WEEKDAY_SHORT'
    | 'DATE'
    | 'DATE_ISO'
    | 'WEEK_INDEX'
    | 'WEEK_RANGE'
    | 'MONTH_NAME'
    | 'MONTH_SHORT'
    | 'MONTH_YEAR'
    | 'QUARTER'
    | 'YEAR';

export interface ChartMeta {
    grain: TimeGrain;
    labelStyle: Exclude<LabelStyle, 'AUTO'>;
    anchor: string;
    timeBasis: 'LOCAL_NAIVE';
    bucketCount: number;
    windowStart: string;
    windowEnd: string;
}

export interface ChartAxisPoint {
    key: string;
    index: number;
    labelEn?: string;
    labelVi?: string;
}

export interface ChartSeriesBase {
    key: string;
    name: string;
    values: number[];
    total: number;
}

export interface ChartResponse<TSeries extends ChartSeriesBase = ChartSeriesBase> {
    meta: ChartMeta;
    axis: ChartAxisPoint[];
    series: TSeries[];
}

export const ALL_TIME_GRAINS: TimeGrain[] = [
    'HALF_HOUR',
    'HOUR',
    'DAY',
    'WEEK',
    'ISO_WEEK',
    'MONTH',
    'QUARTER',
    'YEAR',
];

// byDateRange has no allow-list — every grain is selectable, default DAY.
export const CUSTOM_RANGE_DEFAULT_GRAIN: TimeGrain = 'DAY';

export interface TimeGrainOption {
    name: TimeGrain;
    nameEn: string;
    nameVi: string;
}

export const ALL_LABEL_STYLES: Exclude<LabelStyle, 'AUTO'>[] = [
    'CLOCK',
    'CLOCK_RANGE',
    'WEEKDAY',
    'WEEKDAY_SHORT',
    'DATE',
    'DATE_ISO',
    'WEEK_INDEX',
    'WEEK_RANGE',
    'MONTH_NAME',
    'MONTH_SHORT',
    'MONTH_YEAR',
    'QUARTER',
    'YEAR',
];
