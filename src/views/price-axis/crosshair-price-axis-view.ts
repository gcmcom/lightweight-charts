import { generateContrastColors } from '../../helpers/color';

import { Crosshair, CrosshairPriceAndCoordinate } from '../../model/crosshair';
import { PriceScale } from '../../model/price-scale';
import { PriceAxisViewRendererCommonData, PriceAxisViewRendererData } from '../../renderers/iprice-axis-view-renderer';

import { PriceAxisView } from './price-axis-view';

export type CrosshairPriceAxisViewValueProvider<HorzScaleItem> = (priceScale: PriceScale<HorzScaleItem>) => CrosshairPriceAndCoordinate;

export class CrosshairPriceAxisView<HorzScaleItem> extends PriceAxisView<HorzScaleItem> {
	private _source: Crosshair<HorzScaleItem>;
	private readonly _priceScale: PriceScale<HorzScaleItem>;
	private readonly _valueProvider: CrosshairPriceAxisViewValueProvider<HorzScaleItem>;

	public constructor(source: Crosshair<HorzScaleItem>, priceScale: PriceScale<HorzScaleItem>, valueProvider: CrosshairPriceAxisViewValueProvider<HorzScaleItem>) {
		super();
		this._source = source;
		this._priceScale = priceScale;
		this._valueProvider = valueProvider;
	}

	protected _updateRendererData(
		axisRendererData: PriceAxisViewRendererData,
		paneRendererData: PriceAxisViewRendererData,
		commonRendererData: PriceAxisViewRendererCommonData
	): void {
		axisRendererData.visible = false;
		const options = this._source.options().horzLine;
		if (!options.labelVisible) {
			return;
		}

		const firstValue = this._priceScale.firstValue();
		if (!this._source.visible() || this._priceScale.isEmpty() || (firstValue === null)) {
			return;
		}

		const colors = generateContrastColors(options.labelBackgroundColor);
		commonRendererData.background = colors.background;
		commonRendererData.color = colors.foreground;

		const additionalPadding = 2 / 12 * this._priceScale.fontSize();

		commonRendererData.additionalPaddingTop = additionalPadding;
		commonRendererData.additionalPaddingBottom = additionalPadding;

		const value = this._valueProvider(this._priceScale);
		commonRendererData.coordinate = value.coordinate;
		axisRendererData.text = this._priceScale.formatPrice(value.price, firstValue);
		axisRendererData.visible = true;
	}
}
