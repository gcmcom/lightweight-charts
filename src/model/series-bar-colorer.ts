import { ensure, ensureNotNull } from '../helpers/assertions';

import { PlotRowValueIndex } from './plot-data';
import { Series } from './series';
import { SeriesPlotRow } from './series-data';
import {
	AreaStyleOptions,
	BarStyleOptions,
	BaselineStyleOptions,
	CandlestickStyleOptions,
	HistogramStyleOptions,
	LineStyleOptions,
	SeriesOptionsMap,
	SeriesType,
} from './series-options';
import { TimePointIndex } from './time-data';

export interface PrecomputedBars<HorzScaleItem> {
	value: SeriesPlotRow<SeriesType, HorzScaleItem>;
	previousValue?: SeriesPlotRow<SeriesType, HorzScaleItem>;
}

export interface CommonBarColorerStyle {
	barColor: string;
}

export interface LineStrokeColorerStyle {
	lineColor: string;
}

export interface LineBarColorerStyle extends CommonBarColorerStyle, LineStrokeColorerStyle {
}

export interface HistogramBarColorerStyle extends CommonBarColorerStyle {
}
export interface AreaFillColorerStyle {
	topColor: string;
	bottomColor: string;
}
export interface AreaBarColorerStyle extends CommonBarColorerStyle, AreaFillColorerStyle, LineStrokeColorerStyle {
}

export interface BaselineStrokeColorerStyle {
	topLineColor: string;
	bottomLineColor: string;
}

export interface BaselineFillColorerStyle {
	topFillColor1: string;
	topFillColor2: string;
	bottomFillColor2: string;
	bottomFillColor1: string;
}

export interface BaselineBarColorerStyle extends CommonBarColorerStyle, BaselineStrokeColorerStyle, BaselineFillColorerStyle {
}

export interface BarColorerStyle extends CommonBarColorerStyle {
}

export interface CandlesticksColorerStyle extends CommonBarColorerStyle {
	barBorderColor: string;
	barWickColor: string;
}

export interface BarStylesMap {
	Bar: BarColorerStyle;
	Candlestick: CandlesticksColorerStyle;
	Area: AreaBarColorerStyle;
	Baseline: BaselineBarColorerStyle;
	Line: LineBarColorerStyle;
	Histogram: HistogramBarColorerStyle;
}

type FindBarFn<HorzScaleItem> = (barIndex: TimePointIndex, precomputedBars?: PrecomputedBars<HorzScaleItem>) => SeriesPlotRow<SeriesType, HorzScaleItem> | null;

type StyleGetterFn<T extends SeriesType, HorzScaleItem> = (
	findBar: FindBarFn<HorzScaleItem>,
	barStyle: ReturnType<Series<T, HorzScaleItem>['options']>,
	barIndex: TimePointIndex,
	precomputedBars?: PrecomputedBars<HorzScaleItem>
) => BarStylesMap[T];

type BarStylesFnMap<T extends SeriesType, HorzScaleItem> = {
	[T in keyof SeriesOptionsMap]: StyleGetterFn<T, HorzScaleItem>;
};

export class SeriesBarColorer<T extends SeriesType, HorzScaleItem> {
	private _series: Series<T, HorzScaleItem>;
	private readonly _styleGetter: BarStylesFnMap<T, HorzScaleItem>[T];
	private readonly _barStyleFnMap: BarStylesFnMap<T, HorzScaleItem>;

	public constructor(series: Series<T, HorzScaleItem>) {
		this._series = series;

		this._barStyleFnMap = {
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Bar: (findBar: FindBarFn<HorzScaleItem>, barStyle: BarStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars<HorzScaleItem>): BarColorerStyle => {
				const upColor = barStyle.upColor;
				const downColor = barStyle.downColor;

				const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Bar', HorzScaleItem>;
				const isUp = ensure(currentBar.value[PlotRowValueIndex.Open]) <= ensure(currentBar.value[PlotRowValueIndex.Close]);

				return {
					barColor: currentBar.color ?? (isUp ? upColor : downColor),
				};
			},
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Candlestick: (findBar: FindBarFn<HorzScaleItem>, candlestickStyle: CandlestickStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars<HorzScaleItem>): CandlesticksColorerStyle => {
				const upColor = candlestickStyle.upColor;
				const downColor = candlestickStyle.downColor;
				const borderUpColor = candlestickStyle.borderUpColor;
				const borderDownColor = candlestickStyle.borderDownColor;

				const wickUpColor = candlestickStyle.wickUpColor;
				const wickDownColor = candlestickStyle.wickDownColor;

				const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Candlestick', HorzScaleItem>;
				const isUp = ensure(currentBar.value[PlotRowValueIndex.Open]) <= ensure(currentBar.value[PlotRowValueIndex.Close]);

				return {
					barColor: currentBar.color ?? (isUp ? upColor : downColor),
					barBorderColor: currentBar.borderColor ?? (isUp ? borderUpColor : borderDownColor),
					barWickColor: currentBar.wickColor ?? (isUp ? wickUpColor : wickDownColor),
				};
			},
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Area: (findBar: FindBarFn<HorzScaleItem>, areaStyle: AreaStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars<HorzScaleItem>): AreaBarColorerStyle => {
				const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Area', HorzScaleItem>;
				return {
					barColor: currentBar.lineColor ?? areaStyle.lineColor,
					lineColor: currentBar.lineColor ?? areaStyle.lineColor,
					topColor: currentBar.topColor ?? areaStyle.topColor,
					bottomColor: currentBar.bottomColor ?? areaStyle.bottomColor,
				};
			},
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Baseline: (findBar: FindBarFn<HorzScaleItem>, baselineStyle: BaselineStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars<HorzScaleItem>): BaselineBarColorerStyle => {
				const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Baseline', HorzScaleItem>;
				const isAboveBaseline = currentBar.value[PlotRowValueIndex.Close] >= baselineStyle.baseValue.price;

				return {
					barColor: isAboveBaseline ? baselineStyle.topLineColor : baselineStyle.bottomLineColor,
					topLineColor: currentBar.topLineColor ?? baselineStyle.topLineColor,
					bottomLineColor: currentBar.bottomLineColor ?? baselineStyle.bottomLineColor,
					topFillColor1: currentBar.topFillColor1 ?? baselineStyle.topFillColor1,
					topFillColor2: currentBar.topFillColor2 ?? baselineStyle.topFillColor2,
					bottomFillColor1: currentBar.bottomFillColor1 ?? baselineStyle.bottomFillColor1,
					bottomFillColor2: currentBar.bottomFillColor2 ?? baselineStyle.bottomFillColor2,
				};
			},
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Line: (findBar: FindBarFn<HorzScaleItem>, lineStyle: LineStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars<HorzScaleItem>): LineBarColorerStyle => {
				const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Line', HorzScaleItem>;

				return {
					barColor: currentBar.color ?? lineStyle.color,
					lineColor: currentBar.color ?? lineStyle.color,
				};
			},
			// eslint-disable-next-line @typescript-eslint/naming-convention
			Histogram: (findBar: FindBarFn<HorzScaleItem>, histogramStyle: HistogramStyleOptions, barIndex: TimePointIndex, precomputedBars?: PrecomputedBars<HorzScaleItem>): HistogramBarColorerStyle => {
				const currentBar = ensureNotNull(findBar(barIndex, precomputedBars)) as SeriesPlotRow<'Histogram', HorzScaleItem>;
				return {
					barColor: currentBar.color ?? histogramStyle.color,
				};
			},
		};

		this._styleGetter = this._barStyleFnMap[series.seriesType()];

	}

	public barStyle(barIndex: TimePointIndex, precomputedBars?: PrecomputedBars<HorzScaleItem>): BarStylesMap[T] {
		// precomputedBars: {value: [Array BarValues], previousValue: [Array BarValues] | undefined}
		// Used to avoid binary search if bars are already known
		return this._styleGetter(this._findBar, this._series.options(), barIndex, precomputedBars);
	}

	private _findBar = (barIndex: TimePointIndex, precomputedBars?: PrecomputedBars<HorzScaleItem>): SeriesPlotRow<T, HorzScaleItem> | null => {
		if (precomputedBars !== undefined) {
			return precomputedBars.value;
		}

		return this._series.bars().valueAt(barIndex);
	};
}
