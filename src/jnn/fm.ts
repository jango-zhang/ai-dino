export interface IOptions {
  inputCount: number;
  outputCount: number;
  learnReate: number;
  epoch: number;
  hiddenLayers: Array<number>;
}

export interface INeuron {
  weights: Array<number>;
  bias: number;
  output?: number;
  delta?: number;
}

export interface IFitOptions {
  onEpochFinish: (trainData: Array<number>) => void;
}

export type TLayer = Array<INeuron>;
export type TNetwork = Array<TLayer>;

export class JNN {
  public network: TNetwork = [];

  constructor(public options: IOptions) {
    this.initNetwork();
  }

  private createLayer(neuronCount: number, inputCount: number): TLayer {
    const layer: TLayer = [];
    for (let i = 0; i < neuronCount; i++) {
      const weights = [];
      for (let j = 0; j < inputCount; j++) {
        weights.push(Math.random());
      }
      layer.push({ weights, bias: Math.random() } as INeuron);
    }
    return layer;
  }

  private initNetwork() {
    let prevLayerSize = this.options.inputCount;

    for (const neuronCount of this.options.hiddenLayers) {
      this.network.push(this.createLayer(neuronCount, prevLayerSize));
      prevLayerSize = neuronCount;
    }

    this.network.push(this.createLayer(this.options.outputCount, prevLayerSize));
  }

  private activate(neuron: INeuron, inputs: Array<number>) {
    const { weights, bias } = neuron;
    const ret = weights.reduce(
      (prev, weight, index) => prev + weight * inputs[index],
      bias
    );

    return ret;
  }

  // 激活函数
  private sigmoid(activation: number) {
    return 1 / (1 + Math.exp(-activation));
  }

  // 反向传播求导
  private transferDerivative(output) {
    return output * (1 - output);
  }

  // 先前传播
  private forwardPropagate(inputs: Array<number>) {
    let currentLayerOutput = inputs;

    this.network.forEach((layer) => {
      const _output = [];

      layer.forEach((neuron) => {
        const activation = this.activate(neuron, currentLayerOutput);
        const output = this.sigmoid(activation);

        neuron.output = output;
        _output.push(output);
      });

      currentLayerOutput = _output;
    });

    return currentLayerOutput;
  }

  /**
   * 误差进行反向传播
   * @param expected 期望值
   */
  private backwardPropagateError(expected: Array<number>) {
    for (
      let layerIndex = this.network.length - 1;
      layerIndex >= 0;
      layerIndex--
    ) {
      const layer = this.network[layerIndex];
      const errors = [];

      // 计算每一个神经元的误差
      if (layerIndex === this.network.length - 1) {
        layer.forEach((neuron, neuronIndex) => {
          errors.push(expected[neuronIndex] - neuron.output);
        });
      } else {
        layer.forEach((neuron, neuronIndex) => {
          let error = 0;
          // 获取下一层神经元
          let nextLayer = this.network[layerIndex + 1];
          // 当前 neuron 在下一层每个 neuron 对应的 weights
          nextLayer.forEach((nextNeuron) => {
            const nextNeuronWeight = nextNeuron.weights[neuronIndex];
            const nextNeuronDelta = nextNeuron.delta;

            error += nextNeuronWeight * nextNeuronDelta;
          });

          errors.push(error);
        });
      }

      layer.forEach((neuron, index) => {
        neuron.delta = errors[index] * this.transferDerivative(neuron.output);
      });
    }
  }

  private updateWeights(inputs: Array<number>) {
    for (let layerIndex = 0; layerIndex < this.network.length; layerIndex++) {
      const layer = this.network[layerIndex];
      let _inputs = inputs;

      // 第一层取 input，后续各层取上一层 output
      if (layerIndex !== 0) {
        const prevLayer = this.network[layerIndex - 1];

        _inputs = prevLayer.map((neuron) => neuron.output);
      }

      // 更新当前层的 weight & bias
      for (let neuronIndex = 0; neuronIndex < layer.length; neuronIndex++) {
        const neuron = layer[neuronIndex];

        for (let w = 0; w < _inputs.length; w++) {
          neuron.weights[w] +=
            this.options.learnReate * neuron.delta * _inputs[w];
        }

        neuron.bias += this.options.learnReate * neuron.delta;
      }
    }
  }


  public async fit(trainData: Array<Array<number>>, expectedOutput: Array<Array<number>>, options: IFitOptions) {
    for (let i = 0; i < this.options.epoch; i++) {
      // 误差
      let sumError = 0;

      for (let j = 0; j < trainData.length; j++) {
        const row = trainData[j];
        const output = this.forwardPropagate(trainData[j]);
        const expected = expectedOutput[j];

        sumError += expected.reduce((prev, curr, index) => {
          return prev + (expected[index] - output[index]) ** 2;
        }, sumError);

        this.backwardPropagateError(expected);
        this.updateWeights(row);
        await options.onEpochFinish.apply(this, [row]);
      }
    }
  }

  public predict(dataset: Array<number>) {
    const output = this.forwardPropagate(dataset);

    return output;
  }
}