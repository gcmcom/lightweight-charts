import { ensureNotNull } from '../../helpers/assertions';
import { generateContrastColors } from '../../helpers/color';

import { ChartModel } from '../../model/chart-model';
import { Crosshair, TimeAndCoordinateProvider } from '../../model/crosshair';
import { TimeAxisViewRenderer, TimeAxisViewRendererData } from '../../renderers/time-axis-view-renderer';

import { ITimeAxisView } from './itime-axis-view';

export class CrosshairTimeAxisView<HorzScaleItem> implements ITimeAxisView<HorzScaleItem> {
	private _invalidated: boolean = true;
	private readonly _crosshair: Crosshair<HorzScaleItem>;
	private readonly _model: ChartModel<HorzScaleItem>;
	private readonly _valueProvider: TimeAndCoordinateProvider;
	private readonly _renderer: TimeAxisViewRenderer<HorzScaleItem> = new TimeAxisViewRenderer();
	private readonly _rendererData: TimeAxisViewRendererData = {
		visible: false,
		background: '#4c525e',
		color: 'white',
		text: '',
		width: 0,
		coordinate: NaN,
		tickVisible: true,
	};

	public constructor(crosshair: Crosshair<HorzScaleItem>, model: ChartModel<HorzScaleItem>, valueProvider: TimeAndCoordinateProvider) {
		this._crosshair = crosshair;
		this._model = model;
		this._valueProvider = valueProvider;
	}

	public update(): void {
		this._invalidated = true;
	}

	public renderer(): TimeAxisViewRenderer<HorzScaleItem> {
		if (this._invalidated) {
			this._updateImpl();
			this._invalidated = false;
		}

		this._renderer.setData(this._rendererData);

		return this._renderer;
	}

	private _updateImpl(): void {
		const data = this._rendererData;
		data.visible = false;

		const options = this._crosshair.options().vertLine;

		if (!options.labelVisible) {
			return;
		}

		const timeScale = this._model.timeScale();
		if (timeScale.isEmpty()) {
			return;
		}

		data.width = timeScale.width();

		const value = this._valueProvider();
		if (!value.time) {
			return;
		}

		data.coordinate = value.coordinate;
		const currentTime = timeScale.indexToTimeScalePoint(this._crosshair.appliedIndex());
		data.text = timeScale.formatDateTime(ensureNotNull(currentTime));
		data.visible = true;

		const colors = generateContrastColors(options.labelBackgroundColor);
		data.background = colors.background;
		data.color = colors.foreground;
		data.tickVisible = timeScale.options().ticksVisible;
	}
}
